import { trace, context, SpanStatusCode, SpanKind, Attributes } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

/**
 * OpenTelemetry integration for distributed tracing
 * Provides comprehensive observability for the AI shopping assistant
 */

// Tracer instance
const TRACER_NAME = 'ai-shopping-assistant';
const tracer = trace.getTracer(TRACER_NAME, '1.0.0');

// Custom span attributes for AI assistant
export const AIAssistantAttributes = {
  SESSION_ID: 'ai.session.id',
  USER_ID: 'ai.user.id',
  MODE: 'ai.mode',
  INTENT: 'ai.intent',
  ACTION: 'ai.action',
  MODEL: 'ai.model',
  TOKEN_COUNT: 'ai.token.count',
  RESPONSE_TIME: 'ai.response.time',
  ERROR_TYPE: 'ai.error.type',
  CACHE_HIT: 'ai.cache.hit',
  UDL_METHOD: 'ai.udl.method',
  B2B_ACCOUNT: 'ai.b2b.account'
} as const;

/**
 * Initialize OpenTelemetry tracing
 */
export function initializeTelemetry(config?: {
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
  otlpEndpoint?: string;
  enableConsoleExport?: boolean;
}): NodeTracerProvider {
  const {
    serviceName = 'ai-shopping-assistant',
    serviceVersion = process.env.npm_package_version || '1.0.0',
    environment = process.env.NODE_ENV || 'development',
    otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    enableConsoleExport = process.env.NODE_ENV === 'development'
  } = config || {};

  // Create resource
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
      'ai.assistant.version': '1.0.0',
      'ai.framework': 'langgraph'
    })
  );

  // Create provider
  const provider = new NodeTracerProvider({
    resource
  });

  // Configure exporters
  if (otlpEndpoint && otlpEndpoint !== 'disabled') {
    const otlpExporter = new OTLPTraceExporter({
      url: otlpEndpoint,
      headers: {
        'x-service-name': serviceName
      }
    });
    provider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));
  }

  if (enableConsoleExport) {
    const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
    const consoleExporter = new ConsoleSpanExporter();
    provider.addSpanProcessor(new BatchSpanProcessor(consoleExporter));
  }

  // Register instrumentations
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation({
        requestHook: (span, request) => {
          // Add custom attributes for SDK calls
          if (request.url?.includes('/api/') || request.url?.includes('/unified/')) {
            span.setAttributes({
              'http.api.type': 'udl',
              'http.api.version': 'v1'
            });
          }
        }
      })
    ]
  });

  // Register the provider
  provider.register();

  return provider;
}

/**
 * Create a traced function wrapper
 */
export function traced<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  options?: {
    kind?: SpanKind;
    attributes?: Attributes;
    recordException?: boolean;
  }
): T {
  return ((...args: Parameters<T>) => {
    return tracer.startActiveSpan(
      name,
      {
        kind: options?.kind || SpanKind.INTERNAL,
        attributes: options?.attributes
      },
      async (span) => {
        try {
          const result = await fn(...args);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
          
          if (options?.recordException !== false) {
            span.recordException(error as Error);
          }
          
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }) as T;
}

/**
 * Create a span for AI operations
 */
export function createAISpan(
  operationName: string,
  attributes?: {
    sessionId?: string;
    userId?: string;
    mode?: 'b2c' | 'b2b';
    intent?: string;
    action?: string;
    model?: string;
  }
) {
  const span = tracer.startSpan(operationName, {
    kind: SpanKind.INTERNAL,
    attributes: {
      [AIAssistantAttributes.SESSION_ID]: attributes?.sessionId,
      [AIAssistantAttributes.USER_ID]: attributes?.userId,
      [AIAssistantAttributes.MODE]: attributes?.mode,
      [AIAssistantAttributes.INTENT]: attributes?.intent,
      [AIAssistantAttributes.ACTION]: attributes?.action,
      [AIAssistantAttributes.MODEL]: attributes?.model
    }
  });

  return span;
}

/**
 * Trace a LangGraph node execution
 */
export function traceLangGraphNode<T>(
  nodeName: string,
  nodeType: 'detect_intent' | 'enrich_context' | 'select_action' | 'execute_tool' | 'format_response',
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return tracer.startActiveSpan(
    `langgraph.node.${nodeName}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'langgraph.node.name': nodeName,
        'langgraph.node.type': nodeType,
        ...metadata
      }
    },
    async (span) => {
      const startTime = performance.now();
      
      try {
        const result = await fn();
        
        span.setAttributes({
          'langgraph.node.duration_ms': performance.now() - startTime,
          'langgraph.node.success': true
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setAttributes({
          'langgraph.node.duration_ms': performance.now() - startTime,
          'langgraph.node.success': false,
          'langgraph.node.error': error instanceof Error ? error.message : 'Unknown error'
        });
        
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
 * Trace UDL method calls
 */
export function traceUDLCall<T>(
  methodName: string,
  operation: () => Promise<T>,
  params?: Record<string, any>
): Promise<T> {
  return tracer.startActiveSpan(
    `udl.${methodName}`,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        [AIAssistantAttributes.UDL_METHOD]: methodName,
        'udl.params': JSON.stringify(params || {})
      }
    },
    async (span) => {
      const startTime = performance.now();
      
      try {
        const result = await operation();
        
        span.setAttributes({
          'udl.duration_ms': performance.now() - startTime,
          'udl.success': true
        });
        
        // Check for cache hit (if result has metadata)
        if (typeof result === 'object' && result !== null && '_cached' in result) {
          span.setAttribute(AIAssistantAttributes.CACHE_HIT, true);
        }
        
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setAttributes({
          'udl.duration_ms': performance.now() - startTime,
          'udl.success': false,
          'udl.error': error instanceof Error ? error.message : 'Unknown error'
        });
        
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
 * Context propagation utilities
 */
export const TraceContext = {
  /**
   * Extract trace context from headers
   */
  extract(headers: Record<string, string | string[]>): void {
    // OpenTelemetry will handle this automatically with HTTP instrumentation
    // This is a placeholder for custom extraction if needed
  },

  /**
   * Inject trace context into headers
   */
  inject(headers: Record<string, string> = {}): Record<string, string> {
    const activeContext = context.active();
    const carrier: Record<string, string> = {};
    
    // Use propagator to inject context
    const { propagation } = require('@opentelemetry/api');
    propagation.inject(activeContext, carrier);
    
    return { ...headers, ...carrier };
  },

  /**
   * Run a function with a specific trace context
   */
  runWithContext<T>(traceId: string, spanId: string, fn: () => T): T {
    // This would be used for continuing traces across async boundaries
    // Implementation depends on specific requirements
    return fn();
  }
};

/**
 * Telemetry middleware for Express/Next.js
 */
export function telemetryMiddleware(req: any, res: any, next: any): void {
  const span = tracer.startSpan('http.request', {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.target': req.path,
      'http.host': req.headers.host,
      'http.user_agent': req.headers['user-agent']
    }
  });

  // Store span in request for later use
  req.span = span;

  // Wrap response end to capture status
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    span.setAttributes({
      'http.status_code': res.statusCode,
      'http.response.size': res.get('content-length') || 0
    });

    span.setStatus({
      code: res.statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK
    });

    span.end();
    return originalEnd.apply(res, args);
  };

  next();
}

// Export singleton tracer
export { tracer };