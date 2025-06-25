/**
 * Comprehensive Example: Observability Layer Integration
 * 
 * This file demonstrates how to integrate the observability layer with the AI Shopping Assistant
 * across different components and environments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeObservability,
  logger,
  metrics,
  traced,
  traceLangGraphNode,
  traceUDLCall,
  instrumentGraph,
  instrumentTool,
  observabilityMiddleware,
  Loggers,
  PerformanceProfiler,
  createAISpan,
  TraceContext,
  AIAssistantAttributes
} from '../observability';
import { CommerceGraphExecutor } from '../graphs/graph-executor';
import { getSdk } from '@/sdk';
import type { CommerceState } from '../state';

// ============================================================================
// 1. INITIALIZATION
// ============================================================================

/**
 * Initialize observability with environment-specific configuration
 */
export async function initializeObservabilityLayer() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Development configuration - verbose logging, console export
  const developmentConfig = {
    serviceName: 'ai-shopping-assistant-dev',
    serviceVersion: process.env.npm_package_version || '1.0.0',
    environment: 'development',
    telemetry: {
      enabled: true,
      endpoint: 'http://localhost:4318/v1/traces', // Local Jaeger/OTLP
      consoleExport: true // Print traces to console
    },
    metrics: {
      enabled: true,
      endpoint: 'http://localhost:4318/v1/metrics',
      exportInterval: 10000 // 10 seconds
    },
    logging: {
      level: 'debug' as const,
      format: 'pretty' as const
    }
  };

  // Production configuration - optimized for performance
  const productionConfig = {
    serviceName: 'ai-shopping-assistant',
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    environment: 'production',
    telemetry: {
      enabled: true,
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'https://otel-collector.example.com/v1/traces',
      consoleExport: false
    },
    metrics: {
      enabled: true,
      endpoint: process.env.OTEL_METRICS_ENDPOINT || 'https://otel-collector.example.com/v1/metrics',
      exportInterval: 60000 // 1 minute
    },
    logging: {
      level: 'info' as const,
      format: 'json' as const
    }
  };

  // Initialize with appropriate config
  const config = isProduction ? productionConfig : developmentConfig;
  const observability = await initializeObservability(config);

  // Log initialization
  logger.info('ObservabilityExample', 'Observability layer initialized', {
    environment: config.environment,
    serviceName: config.serviceName,
    telemetryEnabled: config.telemetry.enabled,
    metricsEnabled: config.metrics.enabled
  });

  return observability;
}

// ============================================================================
// 2. API ROUTE INTEGRATION
// ============================================================================

/**
 * Example API route with full observability integration
 */
export async function POST(request: NextRequest) {
  // Start root span for the entire request
  const span = createAISpan('api.chat.request', {
    sessionId: request.headers.get('x-session-id') || undefined,
    userId: request.headers.get('x-user-id') || undefined
  });

  try {
    // Extract trace context from headers for distributed tracing
    TraceContext.extract(Object.fromEntries(request.headers.entries()));

    // Start performance profiling
    const profiler = new PerformanceProfiler();
    profiler.startProfiling('chat-request');

    // Log request start
    const requestLogger = Loggers.api;
    requestLogger.info('Chat request received', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Parse and validate request
    const body = await request.json();
    span.setAttribute('request.message.length', body.message?.length || 0);

    // Record request metrics
    metrics.recordHttpRequest('/api/ai-assistant/chat', 'POST', 200, 0);
    metrics.incrementCounter('ai.chat.requests.total');

    // Execute with tracing
    const result = await traced(
      'process_chat_request',
      async () => {
        // Your chat processing logic here
        return processChatRequest(body);
      },
      {
        attributes: {
          'request.stream': body.stream || false,
          'request.locale': body.locale || 'en-US'
        }
      }
    );

    // Profile results
    const profile = profiler.stopProfiling('chat-request');
    requestLogger.info('Chat request completed', {
      duration_ms: profile.duration,
      memory_used_mb: profile.memoryUsed / 1024 / 1024
    });

    // Record success metrics
    metrics.recordResponseTime('chat_request', profile.duration);
    
    span.setStatus({ code: 0 }); // OK
    return NextResponse.json(result);

  } catch (error) {
    // Log error with context
    Loggers.api.error('Chat request failed', error, {
      url: request.url,
      spanId: span.spanContext().spanId
    });

    // Record error metrics
    metrics.recordError('chat_request_error', {
      error_type: error instanceof Error ? error.constructor.name : 'unknown'
    });

    span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });
    span.recordException(error as Error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    span.end();
  }
}

// ============================================================================
// 3. GRAPH NODE INTEGRATION
// ============================================================================

/**
 * Example instrumented graph node
 */
export const instrumentedDetectIntentNode = traceLangGraphNode(
  'detectIntent',
  'detect_intent',
  async (state: CommerceState) => {
    // Log node execution
    const nodeLogger = Loggers.graph;
    nodeLogger.debug('Detecting user intent', {
      sessionId: state.context.sessionId,
      messageCount: state.messages.length
    });

    // Start timing
    const startTime = performance.now();

    try {
      // Your intent detection logic
      const intent = await detectUserIntent(state.messages);

      // Record intent metrics
      metrics.incrementCounter(`ai.intent.${intent}`, {
        mode: state.mode,
        intent
      });

      // Log detected intent
      nodeLogger.info('Intent detected', {
        sessionId: state.context.sessionId,
        intent,
        confidence: 0.95,
        duration_ms: performance.now() - startTime
      });

      return {
        ...state,
        context: {
          ...state.context,
          detectedIntent: intent
        }
      };
    } catch (error) {
      nodeLogger.error('Intent detection failed', error, {
        sessionId: state.context.sessionId
      });
      throw error;
    }
  },
  {
    sessionId: 'example-session',
    mode: 'b2c'
  }
);

// ============================================================================
// 4. UDL INTEGRATION WITH OBSERVABILITY
// ============================================================================

/**
 * Example of tracing UDL calls
 */
export async function searchProductsWithObservability(query: string) {
  return traceUDLCall(
    'searchProducts',
    async () => {
      const sdk = getSdk();
      
      // Log search request
      Loggers.udl.info('Product search initiated', {
        query,
        method: 'unified.searchProducts'
      });

      // Execute search with timing
      const startTime = performance.now();
      const result = await sdk.unified.searchProducts({
        search: query,
        limit: 10
      });

      // Record search metrics
      const duration = performance.now() - startTime;
      metrics.recordUDLCall('searchProducts', duration, result.products.length);

      // Log results
      Loggers.udl.info('Product search completed', {
        query,
        resultCount: result.products.length,
        duration_ms: duration
      });

      return result;
    },
    { search: query }
  );
}

// ============================================================================
// 5. DASHBOARD INTEGRATION
// ============================================================================

/**
 * Example dashboard component with real-time metrics
 */
export function ObservabilityDashboardExample() {
  // In a real implementation, this would be a React component
  // that connects to the metrics endpoint and displays real-time data

  return {
    // Fetch current metrics
    async getCurrentMetrics() {
      const currentMetrics = metrics.getSnapshot();
      
      return {
        activeSessions: currentMetrics.activeSessions || 0,
        totalRequests: currentMetrics.counters['ai.chat.requests.total'] || 0,
        averageResponseTime: currentMetrics.averages['chat_request'] || 0,
        errorRate: calculateErrorRate(currentMetrics),
        udlCallStats: getUDLCallStats(currentMetrics)
      };
    },

    // Subscribe to metric updates
    subscribeToMetrics(callback: (metrics: any) => void) {
      // In production, this would use WebSocket or SSE
      const interval = setInterval(async () => {
        const metrics = await this.getCurrentMetrics();
        callback(metrics);
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  };
}

// ============================================================================
// 6. FULL GRAPH EXECUTION WITH OBSERVABILITY
// ============================================================================

/**
 * Example of complete graph execution with comprehensive observability
 */
export async function executeGraphWithFullObservability(
  message: string,
  context: any
) {
  // Initialize session tracking
  const sessionId = context.sessionId || `session_${Date.now()}`;
  metrics.startSession(sessionId);

  // Create correlation context for all logs
  const correlationContext = {
    sessionId,
    userId: context.userId,
    mode: context.mode,
    requestId: `req_${Date.now()}`
  };

  // Instrument entire graph execution
  return instrumentGraph(
    'commerce-assistant',
    async () => {
      const executor = new CommerceGraphExecutor({
        modelName: 'gpt-4',
        temperature: 0.7,
        enableLogging: true,
        onLog: (entry) => {
          // Forward logs to structured logger with correlation
          logger.log(entry.level, `[Graph] ${entry.message}`, {
            ...entry.metadata,
            ...correlationContext
          });
        }
      });

      // Execute with comprehensive error handling
      try {
        const result = await executor.execute(message, context);
        
        // Record success metrics
        metrics.recordSessionEvent(sessionId, 'completed');
        
        return result;
      } catch (error) {
        // Record failure metrics
        metrics.recordSessionEvent(sessionId, 'failed');
        metrics.recordError('graph_execution_error', {
          sessionId,
          error_type: error instanceof Error ? error.constructor.name : 'unknown'
        });
        
        throw error;
      } finally {
        // End session tracking
        metrics.endSession(sessionId);
      }
    },
    correlationContext
  );
}

// ============================================================================
// 7. MIDDLEWARE INTEGRATION
// ============================================================================

/**
 * Example Next.js middleware with observability
 */
export function withObservability(handler: any) {
  return async (req: NextRequest, res: NextResponse) => {
    // Apply observability middleware
    return new Promise((resolve) => {
      observabilityMiddleware(req as any, res as any, async () => {
        // Execute the actual handler
        const result = await handler(req, res);
        resolve(result);
      });
    });
  };
}

// ============================================================================
// 8. PERFORMANCE MONITORING
// ============================================================================

/**
 * Example performance monitoring for critical operations
 */
export class PerformanceMonitoringExample {
  private profiler = new PerformanceProfiler();

  async monitorCriticalOperation(operationName: string, operation: () => Promise<any>) {
    // Start CPU profiling for expensive operations
    this.profiler.startProfiling(operationName);

    // Create performance span
    const span = createAISpan(`performance.${operationName}`);
    
    try {
      // Mark performance timeline
      performance.mark(`${operationName}-start`);
      
      // Execute operation
      const result = await operation();
      
      // Mark completion
      performance.mark(`${operationName}-end`);
      performance.measure(
        operationName,
        `${operationName}-start`,
        `${operationName}-end`
      );
      
      // Get performance entry
      const measure = performance.getEntriesByName(operationName)[0];
      
      // Stop profiling
      const profile = this.profiler.stopProfiling(operationName);
      
      // Log performance data
      Loggers.performance.info('Operation completed', {
        operation: operationName,
        duration_ms: measure.duration,
        cpu_time_ms: profile.cpuTime,
        memory_used_mb: profile.memoryUsed / 1024 / 1024,
        heap_used_mb: profile.heapUsed / 1024 / 1024
      });
      
      // Record metrics
      metrics.recordResponseTime(operationName, measure.duration);
      
      // Add to span
      span.setAttributes({
        'performance.duration_ms': measure.duration,
        'performance.cpu_time_ms': profile.cpuTime,
        'performance.memory_used_mb': profile.memoryUsed / 1024 / 1024
      });
      
      return result;
    } finally {
      span.end();
      
      // Clean up performance marks
      performance.clearMarks(`${operationName}-start`);
      performance.clearMarks(`${operationName}-end`);
      performance.clearMeasures(operationName);
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function processChatRequest(body: any): any {
  // Placeholder for actual implementation
  return { response: 'Example response', metadata: {} };
}

function detectUserIntent(messages: any[]): string {
  // Placeholder for actual implementation
  return 'search_products';
}

function calculateErrorRate(metrics: any): number {
  const total = metrics.counters['ai.chat.requests.total'] || 0;
  const errors = metrics.counters['ai.chat.requests.errors'] || 0;
  return total > 0 ? (errors / total) * 100 : 0;
}

function getUDLCallStats(metrics: any): any {
  // Extract UDL-specific metrics
  return {
    totalCalls: metrics.counters['udl.calls.total'] || 0,
    averageLatency: metrics.averages['udl.latency'] || 0,
    cacheHitRate: calculateCacheHitRate(metrics)
  };
}

function calculateCacheHitRate(metrics: any): number {
  const total = metrics.counters['udl.calls.total'] || 0;
  const hits = metrics.counters['udl.cache.hits'] || 0;
  return total > 0 ? (hits / total) * 100 : 0;
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Complete usage example showing initialization and integration
 */
export async function main() {
  // 1. Initialize observability layer
  const observability = await initializeObservabilityLayer();

  // 2. Set up graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('Main', 'Shutting down observability layer');
    await observability.shutdown();
    process.exit(0);
  });

  // 3. Example usage in your application
  try {
    // Trace a complete user flow
    await traced('user_shopping_flow', async () => {
      // Search for products
      const products = await searchProductsWithObservability('laptop');
      
      // Execute AI assistant
      const response = await executeGraphWithFullObservability(
        'Show me laptops under $1000',
        {
          sessionId: 'example-session',
          userId: 'user-123',
          mode: 'b2c'
        }
      );
      
      return response;
    });
  } catch (error) {
    logger.error('Main', 'Application error', error);
  }
}

// Export everything for use in other parts of the application
export {
  initializeObservabilityLayer,
  instrumentedDetectIntentNode,
  searchProductsWithObservability,
  executeGraphWithFullObservability
};