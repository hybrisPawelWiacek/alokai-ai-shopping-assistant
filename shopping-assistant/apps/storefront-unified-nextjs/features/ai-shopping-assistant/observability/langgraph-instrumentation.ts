import { context, trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { BaseMessage } from '@langchain/core/messages';
import type { CommerceState } from '../state';
import { tracer, traceLangGraphNode, AIAssistantAttributes } from './telemetry';
import { Loggers } from './logger';
import { metrics } from './metrics';

/**
 * Custom instrumentation for LangGraph nodes
 * Provides detailed observability for graph execution
 */

export interface InstrumentationConfig {
  enableTracing?: boolean;
  enableMetrics?: boolean;
  enableLogging?: boolean;
  captureMessageContent?: boolean;
  captureStateSnapshots?: boolean;
}

/**
 * Instrumented node wrapper
 */
export function instrumentNode<T extends (...args: any[]) => any>(
  nodeName: string,
  nodeType: 'detect_intent' | 'enrich_context' | 'select_action' | 'execute_tool' | 'format_response',
  fn: T,
  config: InstrumentationConfig = {}
): T {
  const {
    enableTracing = true,
    enableMetrics = true,
    enableLogging = true,
    captureMessageContent = false,
    captureStateSnapshots = false
  } = config;

  return (async (...args: Parameters<T>) => {
    const startTime = performance.now();
    const [state, runnableConfig] = args as [CommerceState, RunnableConfig?];
    
    // Extract context
    const sessionId = state.context.sessionId;
    const mode = state.mode;
    const messageCount = state.messages.length;
    
    // Start span if tracing enabled
    const span = enableTracing 
      ? tracer.startSpan(`langgraph.node.${nodeName}`, {
          kind: SpanKind.INTERNAL,
          attributes: {
            [AIAssistantAttributes.SESSION_ID]: sessionId,
            [AIAssistantAttributes.MODE]: mode,
            'langgraph.node.name': nodeName,
            'langgraph.node.type': nodeType,
            'langgraph.state.message_count': messageCount,
            'langgraph.state.has_error': !!state.error
          }
        })
      : null;

    // Log node start if logging enabled
    if (enableLogging) {
      Loggers.graph.debug(`Node ${nodeName} started`, {
        sessionId,
        mode,
        nodeType,
        messageCount,
        hasError: !!state.error
      });
    }

    try {
      // Capture state snapshot if enabled
      if (captureStateSnapshots && span) {
        span.addEvent('state.snapshot.before', {
          'state.cart.items': state.cart.items.length,
          'state.cart.total': state.cart.total,
          'state.comparison.items': state.comparison.items.length,
          'state.available_actions': state.availableActions?.enabled?.length || 0
        });
      }

      // Execute the node
      const result = await context.with(
        span ? trace.setSpan(context.active(), span) : context.active(),
        () => fn(...args)
      );

      // Capture result details
      if (span) {
        // Add result attributes based on node type
        switch (nodeType) {
          case 'detect_intent':
            if (result.context?.detectedIntent) {
              span.setAttribute(AIAssistantAttributes.INTENT, result.context.detectedIntent);
            }
            break;
          
          case 'select_action':
            if (result.messages?.length > 0) {
              const lastMessage = result.messages[result.messages.length - 1];
              if ('tool_calls' in lastMessage && lastMessage.tool_calls?.length > 0) {
                span.setAttribute(AIAssistantAttributes.ACTION, lastMessage.tool_calls[0].name);
              }
            }
            break;
          
          case 'execute_tool':
            // Tool execution details captured separately
            break;
        }

        // Capture state snapshot after if enabled
        if (captureStateSnapshots && result) {
          span.addEvent('state.snapshot.after', {
            'state.messages.added': (result.messages?.length || 0) - messageCount,
            'state.context.updated': !!result.context,
            'state.error.occurred': !!result.error
          });
        }

        span.setStatus({ code: SpanStatusCode.OK });
      }

      // Record metrics if enabled
      if (enableMetrics) {
        const duration = performance.now() - startTime;
        metrics.recordNodeExecution(nodeName, duration, {
          mode,
          node: nodeType
        });
      }

      // Log success if logging enabled
      if (enableLogging) {
        const duration = performance.now() - startTime;
        Loggers.graph.info(`Node ${nodeName} completed`, {
          sessionId,
          mode,
          nodeType,
          duration_ms: duration,
          messagesAdded: (result.messages?.length || 0) - messageCount
        });
      }

      return result;
    } catch (error) {
      // Handle error
      if (span) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        span.recordException(error as Error);
      }

      if (enableMetrics) {
        const duration = performance.now() - startTime;
        metrics.recordError('node_execution_error', {
          mode,
          node: nodeType
        });
      }

      if (enableLogging) {
        const duration = performance.now() - startTime;
        Loggers.graph.error(`Node ${nodeName} failed`, error, {
          sessionId,
          mode,
          nodeType,
          duration_ms: duration
        });
      }

      throw error;
    } finally {
      span?.end();
    }
  }) as T;
}

/**
 * Instrument the entire graph execution
 */
export function instrumentGraph<T>(
  graphName: string,
  executeFn: () => Promise<T>,
  metadata?: {
    sessionId?: string;
    userId?: string;
    mode?: 'b2c' | 'b2b';
  }
): Promise<T> {
  return tracer.startActiveSpan(
    `langgraph.graph.${graphName}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'langgraph.graph.name': graphName,
        [AIAssistantAttributes.SESSION_ID]: metadata?.sessionId,
        [AIAssistantAttributes.USER_ID]: metadata?.userId,
        [AIAssistantAttributes.MODE]: metadata?.mode
      }
    },
    async (span) => {
      const startTime = performance.now();
      
      try {
        // Log graph start
        Loggers.graph.info(`Graph ${graphName} execution started`, metadata);
        
        // Track active session
        if (metadata?.sessionId) {
          metrics.startSession(metadata.sessionId);
        }
        
        // Execute graph
        const result = await executeFn();
        
        // Record success metrics
        const duration = performance.now() - startTime;
        span.setAttribute('langgraph.graph.duration_ms', duration);
        span.setStatus({ code: SpanStatusCode.OK });
        
        // Log completion
        Loggers.graph.info(`Graph ${graphName} execution completed`, {
          ...metadata,
          duration_ms: duration
        });
        
        return result;
      } catch (error) {
        // Record error
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        span.recordException(error as Error);
        
        // Log error
        Loggers.graph.error(`Graph ${graphName} execution failed`, error, metadata);
        
        throw error;
      } finally {
        span.end();
        
        // End session tracking
        if (metadata?.sessionId) {
          metrics.endSession(metadata.sessionId);
        }
      }
    }
  );
}

/**
 * Instrument tool execution
 */
export function instrumentTool(
  toolName: string,
  executeFn: () => Promise<any>,
  params?: Record<string, any>
): Promise<any> {
  return tracer.startActiveSpan(
    `langgraph.tool.${toolName}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'langgraph.tool.name': toolName,
        'langgraph.tool.params': JSON.stringify(params || {})
      }
    },
    async (span) => {
      const startTime = performance.now();
      
      try {
        const result = await executeFn();
        
        const duration = performance.now() - startTime;
        span.setAttribute('langgraph.tool.duration_ms', duration);
        span.setStatus({ code: SpanStatusCode.OK });
        
        // Record metrics
        metrics.recordActionExecution(toolName, duration, true, {
          action: toolName
        });
        
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        span.recordException(error as Error);
        
        const duration = performance.now() - startTime;
        metrics.recordActionExecution(toolName, duration, false, {
          action: toolName
        });
        
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Instrument model calls
 */
export function instrumentModelCall(
  modelName: string,
  messages: BaseMessage[],
  executeFn: () => Promise<any>
): Promise<any> {
  return tracer.startActiveSpan(
    `langgraph.model.${modelName}`,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        [AIAssistantAttributes.MODEL]: modelName,
        'langgraph.model.message_count': messages.length,
        'langgraph.model.total_tokens': messages.reduce((sum, msg) => 
          sum + (msg.content as string).length / 4, 0 // Rough token estimate
        )
      }
    },
    async (span) => {
      const startTime = performance.now();
      
      try {
        const result = await executeFn();
        
        const duration = performance.now() - startTime;
        span.setAttribute('langgraph.model.duration_ms', duration);
        
        // Extract token usage if available
        if (result?.usage) {
          span.setAttributes({
            'langgraph.model.prompt_tokens': result.usage.prompt_tokens,
            'langgraph.model.completion_tokens': result.usage.completion_tokens,
            'langgraph.model.total_tokens': result.usage.total_tokens
          });
          
          // Record token metrics
          metrics.recordModelLatency(modelName, duration, result.usage.total_tokens);
        }
        
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Create instrumented versions of common nodes
 */
export const InstrumentedNodes = {
  detectIntent: (fn: Function) => instrumentNode('detectIntent', 'detect_intent', fn),
  enrichContext: (fn: Function) => instrumentNode('enrichContext', 'enrich_context', fn),
  selectAction: (fn: Function) => instrumentNode('selectAction', 'select_action', fn),
  executeTool: (fn: Function) => instrumentNode('executeTool', 'execute_tool', fn),
  formatResponse: (fn: Function) => instrumentNode('formatResponse', 'format_response', fn)
};