import { HumanMessage, BaseMessage, AIMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import { CommerceGraphBuilder } from './graph-builder';
import { CommerceToolRegistry } from '../core/tool-registry';
import { createActionRegistry } from '../actions';
import { CommerceStateAnnotation, type CommerceState } from '../state';
import type { LogEntry } from '../types/action-definition';

/**
 * Execution context for a conversation
 */
export interface ExecutionContext {
  threadId: string;
  userId?: string;
  sessionId?: string;
  mode?: 'b2c' | 'b2b';
  locale?: string;
  currency?: string;
  customMetadata?: Record<string, any>;
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  streaming?: boolean;
  timeout?: number;
  maxTokens?: number;
  includeHistory?: boolean;
  debugMode?: boolean;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  response: string;
  state: CommerceState;
  metadata: {
    executionTime: number;
    tokensUsed?: number;
    toolsInvoked?: string[];
    intentDetected?: string;
    securityFlags?: string[];
  };
}

/**
 * Streaming chunk types
 */
export type StreamingChunk = 
  | { type: 'text'; content: string }
  | { type: 'tool_start'; tool: string; args: any }
  | { type: 'tool_end'; tool: string; result: any }
  | { type: 'metadata'; data: any }
  | { type: 'error'; error: string }
  | { type: 'end'; state: CommerceState };

/**
 * High-level executor for the commerce graph
 */
export class CommerceGraphExecutor {
  private graphBuilder: CommerceGraphBuilder;
  private defaultState: CommerceState;
  private executionLogs: LogEntry[] = [];

  constructor(
    private config: {
      modelName?: string;
      temperature?: number;
      enablePersistence?: boolean;
      enableLogging?: boolean;
      onLog?: (entry: LogEntry) => void;
    } = {}
  ) {
    // Create action registry
    const actionRegistry = createActionRegistry({
      logger: this.handleLog.bind(this)
    });

    // Create graph builder
    this.graphBuilder = new CommerceGraphBuilder(actionRegistry, {
      ...config,
      enableStreaming: true,
      logger: this.handleLog.bind(this)
    });

    // Initialize default state
    this.defaultState = CommerceStateAnnotation.spec.default() as CommerceState;
  }

  /**
   * Execute a user message and get a response
   */
  async execute(
    message: string,
    context: ExecutionContext,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    try {
      // Prepare input state
      const inputState = await this.prepareInputState(message, context, options);
      
      // Execute based on streaming preference
      if (options.streaming) {
        // For streaming, we still need to collect the full result
        const chunks: StreamingChunk[] = [];
        for await (const chunk of this.executeStreaming(message, context, options)) {
          chunks.push(chunk);
        }
        
        // Get final state from last chunk
        const endChunk = chunks.find(c => c.type === 'end') as { type: 'end'; state: CommerceState };
        const finalState = endChunk?.state || inputState;
        
        return this.buildExecutionResult(finalState, startTime);
      } else {
        // Non-streaming execution
        const result = await this.graphBuilder.invoke(inputState, {
          configurable: { thread_id: context.threadId },
          recursionLimit: 10,
          tags: [`user:${context.userId}`, `session:${context.sessionId}`]
        });
        
        return this.buildExecutionResult(result, startTime);
      }
    } catch (error) {
      this.handleLog({
        level: 'error',
        message: 'Execution failed',
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          context 
        }
      });
      
      throw error;
    }
  }

  /**
   * Execute with streaming response
   */
  async *executeStreaming(
    message: string,
    context: ExecutionContext,
    options: ExecutionOptions = {}
  ): AsyncGenerator<StreamingChunk, void, unknown> {
    try {
      // Prepare input state
      const inputState = await this.prepareInputState(message, context, options);
      
      // Track execution metadata
      const toolsInvoked: string[] = [];
      let currentText = '';
      
      // Stream through graph
      for await (const event of this.graphBuilder.stream(inputState, {
        configurable: { thread_id: context.threadId },
        recursionLimit: 10,
        tags: [`user:${context.userId}`, `session:${context.sessionId}`]
      })) {
        // Parse different event types
        for (const [node, state] of Object.entries(event)) {
          if (node === 'selectAction' && state.messages?.length > 0) {
            const lastMessage = state.messages[state.messages.length - 1];
            
            // Check for tool calls
            if (lastMessage._getType() === 'ai' && lastMessage.tool_calls?.length > 0) {
              for (const toolCall of lastMessage.tool_calls) {
                yield {
                  type: 'tool_start',
                  tool: toolCall.name,
                  args: toolCall.args
                };
                toolsInvoked.push(toolCall.name);
              }
            }
          }
          
          if (node === 'toolNode' && state.messages?.length > 0) {
            const toolMessages = state.messages.filter(m => m._getType() === 'tool');
            for (const toolMsg of toolMessages) {
              yield {
                type: 'tool_end',
                tool: toolMsg.name,
                result: typeof toolMsg.content === 'string' ? 
                  JSON.parse(toolMsg.content) : toolMsg.content
              };
            }
          }
          
          if (node === 'formatResponse' && state.messages?.length > 0) {
            const responseMessage = state.messages[state.messages.length - 1];
            if (responseMessage._getType() === 'ai') {
              const content = responseMessage.content as string;
              
              // Stream text in chunks
              const words = content.split(' ');
              for (let i = 0; i < words.length; i++) {
                const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
                currentText += chunk;
                yield { type: 'text', content: chunk };
                
                // Small delay for natural streaming effect
                if (options.debugMode) {
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
              }
            }
          }
          
          // Yield metadata updates
          if (state.context?.detectedIntent) {
            yield {
              type: 'metadata',
              data: {
                intent: state.context.detectedIntent,
                confidence: state.context.intentConfidence
              }
            };
          }
          
          if (state.security?.threatLevel && state.security.threatLevel !== 'none') {
            yield {
              type: 'metadata',
              data: {
                securityThreat: state.security.threatLevel,
                trustScore: state.security.trustScore
              }
            };
          }
        }
      }
      
      // Get final state
      const finalState = await this.graphBuilder.invoke(inputState, {
        configurable: { thread_id: context.threadId }
      });
      
      yield { type: 'end', state: finalState };
      
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(threadId: string): Promise<BaseMessage[]> {
    return this.graphBuilder.getHistory(threadId);
  }

  /**
   * Clear conversation history
   */
  async clearHistory(threadId: string): Promise<void> {
    await this.graphBuilder.clearHistory(threadId);
  }

  /**
   * Prepare input state for execution
   */
  private async prepareInputState(
    message: string,
    context: ExecutionContext,
    options: ExecutionOptions
  ): Promise<Partial<CommerceState>> {
    // Get conversation history if needed
    let messages: BaseMessage[] = [];
    
    if (options.includeHistory !== false && this.config.enablePersistence) {
      const history = await this.getHistory(context.threadId);
      messages = [...history];
    }
    
    // Add new user message
    messages.push(new HumanMessage({
      content: message,
      additional_kwargs: {
        userId: context.userId,
        sessionId: context.sessionId,
        timestamp: new Date().toISOString()
      }
    }));
    
    // Build input state
    return {
      messages,
      mode: context.mode || 'b2c',
      context: {
        ...this.defaultState.context,
        locale: context.locale || 'en-US',
        currency: context.currency || 'USD',
        customerId: context.userId,
        ...context.customMetadata
      },
      performance: {
        ...this.defaultState.performance,
        startTime: new Date().toISOString()
      }
    };
  }

  /**
   * Build execution result from final state
   */
  private buildExecutionResult(
    state: CommerceState,
    startTime: number
  ): ExecutionResult {
    const executionTime = performance.now() - startTime;
    
    // Get last AI message as response
    const aiMessages = state.messages.filter(m => m._getType() === 'ai');
    const lastAiMessage = aiMessages[aiMessages.length - 1] as AIMessage;
    const response = lastAiMessage?.content as string || 'No response generated';
    
    // Collect metadata
    const toolsInvoked = state.messages
      .filter(m => m._getType() === 'tool')
      .map(m => (m as any).name);
    
    const securityFlags = state.security.detectedPatterns || [];
    
    return {
      response,
      state,
      metadata: {
        executionTime,
        toolsInvoked: [...new Set(toolsInvoked)],
        intentDetected: state.context.detectedIntent,
        securityFlags: securityFlags.length > 0 ? securityFlags : undefined
      }
    };
  }

  /**
   * Handle log entries
   */
  private handleLog(entry: LogEntry): void {
    this.executionLogs.push(entry);
    
    if (this.config.onLog) {
      this.config.onLog(entry);
    }
    
    // Keep only recent logs in memory
    if (this.executionLogs.length > 1000) {
      this.executionLogs = this.executionLogs.slice(-500);
    }
  }

  /**
   * Get execution logs
   */
  getExecutionLogs(filter?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    since?: Date;
    threadId?: string;
  }): LogEntry[] {
    let logs = [...this.executionLogs];
    
    if (filter?.level) {
      logs = logs.filter(log => log.level === filter.level);
    }
    
    if (filter?.since) {
      logs = logs.filter(log => new Date(log.timestamp) >= filter.since);
    }
    
    if (filter?.threadId) {
      logs = logs.filter(log => 
        log.metadata?.threadId === filter.threadId ||
        log.metadata?.context?.threadId === filter.threadId
      );
    }
    
    return logs;
  }

  /**
   * Update executor configuration
   */
  updateConfiguration(updates: {
    modelName?: string;
    temperature?: number;
    enablePersistence?: boolean;
  }): void {
    this.graphBuilder.updateConfig(updates);
    
    this.handleLog({
      level: 'info',
      message: 'Executor configuration updated',
      metadata: { updates }
    });
  }

  /**
   * Get graph visualization
   */
  getGraphVisualization(): any {
    return this.graphBuilder.getVisualization();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // Test basic execution
      const testResult = await this.execute(
        'test health check',
        { threadId: 'health-check' },
        { includeHistory: false }
      );
      
      return {
        status: 'healthy',
        details: {
          executionTime: testResult.metadata.executionTime,
          persistenceEnabled: this.config.enablePersistence,
          loggingEnabled: this.config.enableLogging,
          recentErrors: this.getExecutionLogs({ level: 'error', since: new Date(Date.now() - 3600000) }).length
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          persistenceEnabled: this.config.enablePersistence,
          loggingEnabled: this.config.enableLogging
        }
      };
    }
  }
}