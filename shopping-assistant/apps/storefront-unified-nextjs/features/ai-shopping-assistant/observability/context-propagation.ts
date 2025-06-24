import { context, propagation, trace, Context } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { AsyncLocalStorage } from 'async_hooks';
import type { CommerceState } from '../state';

/**
 * Trace context propagation across async boundaries
 * Ensures traces are properly connected across async operations
 */

// AsyncLocalStorage for maintaining context
const asyncLocalStorage = new AsyncLocalStorage<Context>();

// Initialize propagator
const propagator = new W3CTraceContextPropagator();
propagation.setGlobalPropagator(propagator);

/**
 * Context carrier for passing trace context
 */
export interface TraceContextCarrier {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: string;
}

/**
 * Extract trace context from various sources
 */
export class ContextExtractor {
  /**
   * Extract from HTTP headers
   */
  static fromHeaders(headers: Record<string, string | string[]>): Context {
    const carrier: Record<string, string> = {};
    
    // Normalize headers
    for (const [key, value] of Object.entries(headers)) {
      carrier[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
    }
    
    return propagator.extract(context.active(), carrier, {
      get(carrier, key) {
        return carrier[key.toLowerCase()];
      },
      keys(carrier) {
        return Object.keys(carrier);
      }
    });
  }
  
  /**
   * Extract from state
   */
  static fromState(state: CommerceState): Context | null {
    const traceContext = state.context.traceContext as TraceContextCarrier;
    if (!traceContext?.traceId) return null;
    
    // Create a new context with the trace information
    const spanContext = {
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      traceFlags: traceContext.traceFlags || 0,
      isRemote: true
    };
    
    // Create a non-recording span to carry the context
    const span = trace.wrapSpanContext(spanContext);
    return trace.setSpan(context.active(), span);
  }
  
  /**
   * Extract from message metadata
   */
  static fromMessage(message: any): Context | null {
    const metadata = message.additional_kwargs?.trace_context;
    if (!metadata?.traceId) return null;
    
    return this.fromState({ context: { traceContext: metadata } } as any);
  }
}

/**
 * Context injector for propagating trace context
 */
export class ContextInjector {
  /**
   * Inject into HTTP headers
   */
  static toHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const carrier: Record<string, string> = { ...headers };
    
    propagator.inject(context.active(), carrier, {
      set(carrier, key, value) {
        carrier[key] = value;
      }
    });
    
    return carrier;
  }
  
  /**
   * Inject into state
   */
  static toState(state: CommerceState): CommerceState {
    const span = trace.getActiveSpan();
    if (!span) return state;
    
    const spanContext = span.spanContext();
    const traceContext: TraceContextCarrier = {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      traceFlags: spanContext.traceFlags
    };
    
    return {
      ...state,
      context: {
        ...state.context,
        traceContext
      }
    };
  }
  
  /**
   * Inject into message
   */
  static toMessage(message: any): any {
    const span = trace.getActiveSpan();
    if (!span) return message;
    
    const spanContext = span.spanContext();
    return {
      ...message,
      additional_kwargs: {
        ...message.additional_kwargs,
        trace_context: {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
          traceFlags: spanContext.traceFlags
        }
      }
    };
  }
}

/**
 * Async context manager
 */
export class AsyncContextManager {
  /**
   * Run a function with a specific context
   */
  static run<T>(ctx: Context, fn: () => T): T {
    return asyncLocalStorage.run(ctx, () => {
      return context.with(ctx, fn);
    });
  }
  
  /**
   * Run an async function with a specific context
   */
  static async runAsync<T>(ctx: Context, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      asyncLocalStorage.run(ctx, () => {
        context.with(ctx, async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }
  
  /**
   * Get the current context
   */
  static getCurrent(): Context {
    return asyncLocalStorage.getStore() || context.active();
  }
  
  /**
   * Create a child context
   */
  static createChild(name: string, attributes?: Record<string, any>): Context {
    const currentContext = this.getCurrent();
    const span = trace.getTracer('ai-shopping-assistant').startSpan(name, {
      attributes
    }, currentContext);
    
    return trace.setSpan(currentContext, span);
  }
}

/**
 * Trace context propagation middleware
 */
export function contextPropagationMiddleware(req: any, res: any, next: any): void {
  // Extract context from headers
  const extractedContext = ContextExtractor.fromHeaders(req.headers);
  
  // Run the request handler with the extracted context
  AsyncContextManager.run(extractedContext, () => {
    // Store context in request for later use
    req.traceContext = extractedContext;
    
    // Inject context into response headers
    const responseHeaders = ContextInjector.toHeaders();
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    next();
  });
}

/**
 * Wrap async functions to preserve trace context
 */
export function preserveContext<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name?: string
): T {
  return (async (...args: Parameters<T>) => {
    const currentContext = AsyncContextManager.getCurrent();
    
    return AsyncContextManager.runAsync(currentContext, async () => {
      if (name) {
        const span = trace.getTracer('ai-shopping-assistant').startSpan(name);
        try {
          const result = await fn(...args);
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.end();
          throw error;
        }
      } else {
        return fn(...args);
      }
    });
  }) as T;
}

/**
 * Decorator for preserving context in class methods
 */
export function PreserveContext(name?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = preserveContext(originalMethod, name || `${target.constructor.name}.${propertyKey}`);
    
    return descriptor;
  };
}

/**
 * Context-aware event emitter
 */
export class ContextAwareEventEmitter extends EventTarget {
  private contextMap = new Map<string, Context>();
  
  /**
   * Emit an event with context
   */
  emitWithContext(event: string, data: any): void {
    const currentContext = AsyncContextManager.getCurrent();
    this.contextMap.set(event, currentContext);
    
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
  
  /**
   * Listen to events with context preservation
   */
  onWithContext(event: string, handler: (data: any) => void): void {
    this.addEventListener(event, (e: Event) => {
      const customEvent = e as CustomEvent;
      const savedContext = this.contextMap.get(event);
      
      if (savedContext) {
        AsyncContextManager.run(savedContext, () => {
          handler(customEvent.detail);
        });
      } else {
        handler(customEvent.detail);
      }
    });
  }
}

/**
 * Utility functions for common patterns
 */
export const TracePropagation = {
  /**
   * Continue a trace from a parent span ID
   */
  continueTrace(traceId: string, parentSpanId: string, fn: () => void): void {
    const spanContext = {
      traceId,
      spanId: parentSpanId,
      traceFlags: 1,
      isRemote: true
    };
    
    const span = trace.wrapSpanContext(spanContext);
    const ctx = trace.setSpan(context.active(), span);
    
    context.with(ctx, fn);
  },
  
  /**
   * Fork a new trace while maintaining parent relationship
   */
  forkTrace(name: string, fn: () => Promise<any>): Promise<any> {
    const tracer = trace.getTracer('ai-shopping-assistant');
    const parentSpan = trace.getActiveSpan();
    
    const span = tracer.startSpan(name, {
      links: parentSpan ? [{
        context: parentSpan.spanContext()
      }] : []
    });
    
    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result = await fn();
        span.end();
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    });
  },
  
  /**
   * Batch operations under a single span
   */
  async batchUnderSpan<T>(
    name: string,
    operations: Array<() => Promise<T>>
  ): Promise<T[]> {
    const tracer = trace.getTracer('ai-shopping-assistant');
    const span = tracer.startSpan(name, {
      attributes: {
        'batch.size': operations.length
      }
    });
    
    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const results = await Promise.all(operations);
        span.setAttribute('batch.succeeded', operations.length);
        span.end();
        return results;
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    });
  }
};