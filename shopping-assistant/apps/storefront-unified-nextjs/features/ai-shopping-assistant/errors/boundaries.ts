/**
 * Error boundaries for LangGraph execution
 * Provides safety mechanisms for graph execution
 */

import { traced } from '../observability/telemetry';
import { Loggers } from '../observability/logger';
import { metrics } from '../observability/metrics';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '@langchain/core/messages';
import {
  AIAssistantError,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  WorkflowError,
  StateError,
  type Result,
  ok,
  err
} from './types';
import { globalErrorHandler } from './handlers';
import { errorReporter, reportAndGenerateMessage } from './reporting';
import { recoveryManager, StateRecovery } from './recovery';
import type { CommerceState } from '../state';

/**
 * Error boundary configuration
 */
export interface ErrorBoundaryConfig {
  maxNodeFailures?: number;
  maxGraphFailures?: number;
  enableStateRecovery?: boolean;
  enableAutoRetry?: boolean;
  fallbackMessage?: string;
  onNodeError?: (error: AIAssistantError, nodeName: string) => void;
  onGraphError?: (error: AIAssistantError) => void;
  criticalNodes?: string[];
}

/**
 * Node execution result
 */
export type NodeResult<T> = Result<T> & {
  nodeName: string;
  duration: number;
  retryCount?: number;
};

/**
 * Graph execution context
 */
interface GraphExecutionContext {
  graphName: string;
  startTime: Date;
  nodeFailures: Map<string, number>;
  totalFailures: number;
  stateSnapshots: string[];
  lastSuccessfulNode?: string;
}

/**
 * Error boundary for graph execution
 */
export class GraphErrorBoundary {
  private executionContexts = new Map<string, GraphExecutionContext>();
  
  constructor(private config: ErrorBoundaryConfig = {}) {
    this.config = {
      maxNodeFailures: 3,
      maxGraphFailures: 2,
      enableStateRecovery: true,
      enableAutoRetry: true,
      fallbackMessage: "I apologize, but I'm having trouble processing your request. Please try again later.",
      criticalNodes: ['detectIntent', 'executeAction'],
      ...config
    };
  }
  
  /**
   * Wrap node execution with error boundary
   */
  wrapNode<T extends CommerceState>(
    nodeName: string,
    nodeFunction: (state: T) => Promise<Partial<T>>
  ): (state: T) => Promise<Partial<T>> {
    return traced(`node.${nodeName}`, async (state: T): Promise<Partial<T>> => {
      const startTime = Date.now();
      const graphContext = this.getOrCreateContext(state.context.sessionId || 'default');
      
      try {
        // Check if node has failed too many times
        const nodeFailures = graphContext.nodeFailures.get(nodeName) || 0;
        if (nodeFailures >= this.config.maxNodeFailures!) {
          throw new WorkflowError(
            `Node '${nodeName}' has failed too many times`,
            graphContext.graphName,
            nodeName,
            {
              severity: ErrorSeverity.CRITICAL,
              recoveryStrategy: RecoveryStrategy.NONE,
              retryable: false
            }
          );
        }
        
        // Create state snapshot before execution
        if (this.config.enableStateRecovery) {
          const snapshot = StateRecovery.createSnapshot(state);
          graphContext.stateSnapshots.push(snapshot);
        }
        
        // Execute node
        const result = await nodeFunction(state);
        
        // Record success
        graphContext.lastSuccessfulNode = nodeName;
        graphContext.nodeFailures.delete(nodeName);
        
        // Record metrics
        metrics.recordNodeExecution(nodeName, Date.now() - startTime, true, {
          mode: state.mode
        });
        
        return result;
      } catch (error) {
        // Handle node error
        const nodeError = await this.handleNodeError(
          error,
          nodeName,
          state,
          graphContext
        );
        
        // Record metrics
        metrics.recordNodeExecution(nodeName, Date.now() - startTime, false, {
          mode: state.mode,
          error_code: nodeError.code
        });
        
        // Check if critical node
        if (this.config.criticalNodes?.includes(nodeName)) {
          throw nodeError;
        }
        
        // Return error message for non-critical nodes
        return {
          messages: [await reportAndGenerateMessage(nodeError)]
        };
      }
    });
  }
  
  /**
   * Wrap graph execution with error boundary
   */
  async wrapGraph<T extends CommerceState>(
    graphName: string,
    graph: StateGraph<T, any, any>,
    initialState: T
  ): Promise<Result<T>> {
    const context = this.getOrCreateContext(initialState.context.sessionId || 'default', graphName);
    
    try {
      // Check if graph has failed too many times
      if (context.totalFailures >= this.config.maxGraphFailures!) {
        throw new WorkflowError(
          `Graph '${graphName}' has failed too many times`,
          graphName,
          undefined,
          {
            severity: ErrorSeverity.CRITICAL,
            recoveryStrategy: RecoveryStrategy.NONE,
            retryable: false
          }
        );
      }
      
      // Execute graph
      const result = await traced(`graph.${graphName}`, async () => {
        return graph.invoke(initialState);
      });
      
      // Reset failure count on success
      context.totalFailures = 0;
      
      return ok(result as T);
    } catch (error) {
      // Handle graph error
      const graphError = await this.handleGraphError(error, graphName, initialState, context);
      
      // Check if should retry
      if (this.config.enableAutoRetry && graphError.retryable && context.totalFailures < this.config.maxGraphFailures!) {
        Loggers.ai.info('Retrying graph execution', {
          graphName,
          attempt: context.totalFailures + 1
        });
        
        // Restore state if available
        let retryState = initialState;
        if (this.config.enableStateRecovery && context.stateSnapshots.length > 0) {
          try {
            const lastSnapshot = context.stateSnapshots[context.stateSnapshots.length - 1];
            const restoredState = await StateRecovery.restoreSnapshot(lastSnapshot, {});
            retryState = { ...initialState, ...restoredState };
          } catch (restoreError) {
            Loggers.ai.error('Failed to restore state for retry', restoreError);
          }
        }
        
        return this.wrapGraph(graphName, graph, retryState);
      }
      
      return err(graphError);
    }
  }
  
  /**
   * Handle node error
   */
  private async handleNodeError(
    error: unknown,
    nodeName: string,
    state: CommerceState,
    context: GraphExecutionContext
  ): Promise<AIAssistantError> {
    // Normalize error
    const aiError = error instanceof AIAssistantError
      ? error
      : new WorkflowError(
          error instanceof Error ? error.message : 'Node execution failed',
          context.graphName,
          nodeName,
          {
            originalError: error instanceof Error ? error : undefined,
            context: {
              timestamp: new Date(),
              sessionId: state.context.sessionId,
              mode: state.mode,
              node: nodeName
            }
          }
        );
    
    // Update failure count
    const currentFailures = context.nodeFailures.get(nodeName) || 0;
    context.nodeFailures.set(nodeName, currentFailures + 1);
    
    // Log error
    Loggers.ai.error(`Node '${nodeName}' failed`, aiError, {
      failures: currentFailures + 1,
      maxFailures: this.config.maxNodeFailures
    });
    
    // Call error callback
    if (this.config.onNodeError) {
      this.config.onNodeError(aiError, nodeName);
    }
    
    return aiError;
  }
  
  /**
   * Handle graph error
   */
  private async handleGraphError(
    error: unknown,
    graphName: string,
    state: CommerceState,
    context: GraphExecutionContext
  ): Promise<AIAssistantError> {
    // Normalize error
    const aiError = error instanceof AIAssistantError
      ? error
      : new WorkflowError(
          error instanceof Error ? error.message : 'Graph execution failed',
          graphName,
          undefined,
          {
            originalError: error instanceof Error ? error : undefined,
            context: {
              timestamp: new Date(),
              sessionId: state.context.sessionId,
              mode: state.mode
            }
          }
        );
    
    // Update failure count
    context.totalFailures++;
    
    // Log error
    Loggers.ai.error(`Graph '${graphName}' failed`, aiError, {
      failures: context.totalFailures,
      maxFailures: this.config.maxGraphFailures,
      lastSuccessfulNode: context.lastSuccessfulNode
    });
    
    // Call error callback
    if (this.config.onGraphError) {
      this.config.onGraphError(aiError);
    }
    
    return aiError;
  }
  
  /**
   * Get or create execution context
   */
  private getOrCreateContext(sessionId: string, graphName?: string): GraphExecutionContext {
    const key = `${sessionId}:${graphName || 'default'}`;
    
    if (!this.executionContexts.has(key)) {
      this.executionContexts.set(key, {
        graphName: graphName || 'default',
        startTime: new Date(),
        nodeFailures: new Map(),
        totalFailures: 0,
        stateSnapshots: []
      });
    }
    
    return this.executionContexts.get(key)!;
  }
  
  /**
   * Clear execution context
   */
  clearContext(sessionId: string, graphName?: string): void {
    const key = `${sessionId}:${graphName || 'default'}`;
    this.executionContexts.delete(key);
  }
}

/**
 * Create safe node wrapper
 */
export function createSafeNode<T extends CommerceState>(
  nodeName: string,
  nodeFunction: (state: T) => Promise<Partial<T>>,
  config?: ErrorBoundaryConfig
): (state: T) => Promise<Partial<T>> {
  const boundary = new GraphErrorBoundary(config);
  return boundary.wrapNode(nodeName, nodeFunction);
}

/**
 * Create safe graph executor
 */
export async function executeSafeGraph<T extends CommerceState>(
  graphName: string,
  graph: StateGraph<T, any, any>,
  initialState: T,
  config?: ErrorBoundaryConfig
): Promise<T> {
  const boundary = new GraphErrorBoundary(config);
  const result = await boundary.wrapGraph(graphName, graph, initialState);
  
  if (!result.success) {
    // Add error message to state
    const errorMessage = await reportAndGenerateMessage(result.error);
    return {
      ...initialState,
      messages: [...initialState.messages, errorMessage]
    };
  }
  
  return result.data;
}

/**
 * Error recovery node for graphs
 */
export async function errorRecoveryNode(
  state: CommerceState & { error?: AIAssistantError }
): Promise<Partial<CommerceState>> {
  if (!state.error) {
    return {};
  }
  
  Loggers.ai.info('Executing error recovery node', {
    error: state.error.code,
    category: state.error.category
  });
  
  // Generate user-friendly error message
  const errorMessage = await reportAndGenerateMessage(state.error);
  
  // Clear error from state
  const { error, ...cleanState } = state;
  
  return {
    ...cleanState,
    messages: [...state.messages, errorMessage],
    context: {
      ...state.context,
      lastError: {
        code: error.code,
        timestamp: new Date().toISOString(),
        recovered: true
      }
    }
  };
}

/**
 * Create error-aware conditional edge
 */
export function createErrorAwareEdge<T extends CommerceState>(
  condition: (state: T) => string,
  errorNode: string = 'errorRecovery'
): (state: T) => string {
  return (state: T) => {
    // Check if state has error
    if ('error' in state && state.error) {
      return errorNode;
    }
    
    try {
      return condition(state);
    } catch (error) {
      Loggers.ai.error('Error in conditional edge', error);
      return errorNode;
    }
  };
}

/**
 * Global error boundary instance
 */
export const globalErrorBoundary = new GraphErrorBoundary();

/**
 * Error boundary middleware for API routes
 */
export function errorBoundaryMiddleware(
  handler: (req: any, res: any) => Promise<void>
): (req: any, res: any) => Promise<void> {
  return async (req: any, res: any) => {
    try {
      await handler(req, res);
    } catch (error) {
      const aiError = error instanceof AIAssistantError
        ? error
        : new AIAssistantError({
            code: 'API_ERROR',
            message: error instanceof Error ? error.message : 'API request failed',
            category: ErrorCategory.SYSTEM,
            severity: ErrorSeverity.HIGH,
            recoveryStrategy: RecoveryStrategy.NONE,
            retryable: false,
            originalError: error instanceof Error ? error : undefined,
            context: {
              timestamp: new Date(),
              requestId: req.headers['x-request-id'] || 'unknown'
            }
          });
      
      // Log error
      Loggers.ai.error('API error', aiError);
      
      // Send error response
      res.status(aiError.severity === ErrorSeverity.CRITICAL ? 500 : 400).json({
        error: {
          code: aiError.code,
          message: aiError.userMessage || 'An error occurred processing your request',
          retryable: aiError.retryable
        }
      });
    }
  };
}