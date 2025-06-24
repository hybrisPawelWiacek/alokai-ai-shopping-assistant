import { metrics, ValueType } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

/**
 * Metrics collection for performance monitoring
 * Tracks key metrics for the AI shopping assistant
 */

// Meter instance
const METER_NAME = 'ai-shopping-assistant';
const meter = metrics.getMeter(METER_NAME, '1.0.0');

// Metric names
export const MetricNames = {
  // Request metrics
  REQUEST_COUNT: 'ai.request.count',
  REQUEST_DURATION: 'ai.request.duration',
  REQUEST_ERROR_COUNT: 'ai.request.error.count',
  
  // LangGraph metrics
  NODE_EXECUTION_COUNT: 'ai.node.execution.count',
  NODE_EXECUTION_DURATION: 'ai.node.execution.duration',
  GRAPH_EXECUTION_DURATION: 'ai.graph.execution.duration',
  
  // Action metrics
  ACTION_EXECUTION_COUNT: 'ai.action.execution.count',
  ACTION_EXECUTION_DURATION: 'ai.action.execution.duration',
  ACTION_ERROR_COUNT: 'ai.action.error.count',
  
  // UDL metrics
  UDL_CALL_COUNT: 'ai.udl.call.count',
  UDL_CALL_DURATION: 'ai.udl.call.duration',
  UDL_CACHE_HIT_RATE: 'ai.udl.cache.hit.rate',
  
  // Model metrics
  TOKEN_USAGE: 'ai.model.token.usage',
  MODEL_LATENCY: 'ai.model.latency',
  
  // Business metrics
  CART_CONVERSION_RATE: 'ai.business.cart.conversion.rate',
  SEARCH_SUCCESS_RATE: 'ai.business.search.success.rate',
  B2B_QUOTE_COUNT: 'ai.business.b2b.quote.count',
  
  // Resource metrics
  MEMORY_USAGE: 'ai.resource.memory.usage',
  ACTIVE_SESSIONS: 'ai.resource.active.sessions',
  
  // API metrics
  CHAT_REQUEST_COUNT: 'ai.api.chat.request.count',
  CHAT_PROCESSING_TIME: 'ai.api.chat.processing.time',
  RATE_LIMIT_CHECK_COUNT: 'ai.api.rate_limit.check.count',
} as const;

/**
 * Common metric attributes
 */
export interface MetricAttributes {
  mode?: 'b2c' | 'b2b';
  action?: string;
  intent?: string;
  node?: string;
  model?: string;
  error_type?: string;
  cache_status?: 'hit' | 'miss';
  udl_method?: string;
  environment?: string;
}

/**
 * Initialize metrics collection
 */
export function initializeMetrics(config?: {
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
  otlpEndpoint?: string;
  exportIntervalMillis?: number;
}): MeterProvider {
  const {
    serviceName = 'ai-shopping-assistant',
    serviceVersion = process.env.npm_package_version || '1.0.0',
    environment = process.env.NODE_ENV || 'development',
    otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
    exportIntervalMillis = 30000 // 30 seconds
  } = config || {};

  // Create resource
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment
    })
  );

  // Create meter provider
  const meterProvider = new MeterProvider({
    resource
  });

  // Configure exporter
  if (otlpEndpoint && otlpEndpoint !== 'disabled') {
    const metricExporter = new OTLPMetricExporter({
      url: otlpEndpoint,
      headers: {
        'x-service-name': serviceName
      }
    });

    meterProvider.addMetricReader(
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis
      })
    );
  }

  // Set global meter provider
  metrics.setGlobalMeterProvider(meterProvider);

  return meterProvider;
}

/**
 * Metrics collector class
 */
export class MetricsCollector {
  // Counters
  private requestCounter = meter.createCounter(MetricNames.REQUEST_COUNT, {
    description: 'Total number of AI assistant requests'
  });
  
  private errorCounter = meter.createCounter(MetricNames.REQUEST_ERROR_COUNT, {
    description: 'Total number of errors in AI assistant'
  });
  
  private nodeExecutionCounter = meter.createCounter(MetricNames.NODE_EXECUTION_COUNT, {
    description: 'Number of LangGraph node executions'
  });
  
  private actionExecutionCounter = meter.createCounter(MetricNames.ACTION_EXECUTION_COUNT, {
    description: 'Number of action executions'
  });
  
  private udlCallCounter = meter.createCounter(MetricNames.UDL_CALL_COUNT, {
    description: 'Number of UDL API calls'
  });
  
  // Histograms
  private requestDurationHistogram = meter.createHistogram(MetricNames.REQUEST_DURATION, {
    description: 'Duration of AI assistant requests',
    unit: 'ms'
  });
  
  private nodeExecutionHistogram = meter.createHistogram(MetricNames.NODE_EXECUTION_DURATION, {
    description: 'Duration of LangGraph node executions',
    unit: 'ms'
  });
  
  private actionExecutionHistogram = meter.createHistogram(MetricNames.ACTION_EXECUTION_DURATION, {
    description: 'Duration of action executions',
    unit: 'ms'
  });
  
  private udlCallHistogram = meter.createHistogram(MetricNames.UDL_CALL_DURATION, {
    description: 'Duration of UDL API calls',
    unit: 'ms'
  });
  
  private modelLatencyHistogram = meter.createHistogram(MetricNames.MODEL_LATENCY, {
    description: 'Latency of model inference',
    unit: 'ms'
  });
  
  // Gauges
  private tokenUsageGauge = meter.createObservableGauge(MetricNames.TOKEN_USAGE, {
    description: 'Token usage by model'
  });
  
  private activeSessionsGauge = meter.createObservableGauge(MetricNames.ACTIVE_SESSIONS, {
    description: 'Number of active AI sessions'
  });
  
  private memoryUsageGauge = meter.createObservableGauge(MetricNames.MEMORY_USAGE, {
    description: 'Memory usage in MB',
    unit: 'MB'
  });
  
  // Business metrics
  private cartConversionRate = meter.createObservableGauge(MetricNames.CART_CONVERSION_RATE, {
    description: 'Cart conversion rate',
    unit: '%'
  });
  
  private searchSuccessRate = meter.createObservableGauge(MetricNames.SEARCH_SUCCESS_RATE, {
    description: 'Search success rate',
    unit: '%'
  });
  
  private b2bQuoteCounter = meter.createCounter(MetricNames.B2B_QUOTE_COUNT, {
    description: 'Number of B2B quotes generated'
  });
  
  // API metrics
  private chatRequestCounter = meter.createCounter(MetricNames.CHAT_REQUEST_COUNT, {
    description: 'Total number of chat API requests'
  });
  
  private chatProcessingHistogram = meter.createHistogram(MetricNames.CHAT_PROCESSING_TIME, {
    description: 'Chat request processing time',
    unit: 'ms'
  });
  
  private rateLimitCheckCounter = meter.createCounter(MetricNames.RATE_LIMIT_CHECK_COUNT, {
    description: 'Number of rate limit checks'
  });
  
  // Internal state for observable gauges
  private activeSessions = new Set<string>();
  private tokenUsage = new Map<string, number>();
  private cartConversions = { total: 0, converted: 0 };
  private searchMetrics = { total: 0, successful: 0 };
  
  constructor() {
    // Set up observable gauge callbacks
    this.setupObservableGauges();
  }
  
  private setupObservableGauges(): void {
    // Active sessions
    this.activeSessionsGauge.addCallback((observableResult) => {
      observableResult.observe(this.activeSessions.size);
    });
    
    // Memory usage
    this.memoryUsageGauge.addCallback((observableResult) => {
      const usage = process.memoryUsage();
      observableResult.observe(usage.heapUsed / 1024 / 1024);
    });
    
    // Token usage by model
    this.tokenUsageGauge.addCallback((observableResult) => {
      this.tokenUsage.forEach((count, model) => {
        observableResult.observe(count, { model });
      });
    });
    
    // Cart conversion rate
    this.cartConversionRate.addCallback((observableResult) => {
      const rate = this.cartConversions.total > 0 
        ? (this.cartConversions.converted / this.cartConversions.total) * 100 
        : 0;
      observableResult.observe(rate);
    });
    
    // Search success rate
    this.searchSuccessRate.addCallback((observableResult) => {
      const rate = this.searchMetrics.total > 0 
        ? (this.searchMetrics.successful / this.searchMetrics.total) * 100 
        : 0;
      observableResult.observe(rate);
    });
  }
  
  /**
   * Record a request
   */
  recordRequest(attributes: MetricAttributes): void {
    this.requestCounter.add(1, attributes);
  }
  
  /**
   * Record request duration
   */
  recordRequestDuration(durationMs: number, attributes: MetricAttributes): void {
    this.requestDurationHistogram.record(durationMs, attributes);
  }
  
  /**
   * Record an error
   */
  recordError(errorType: string, attributes: MetricAttributes): void {
    this.errorCounter.add(1, { ...attributes, error_type: errorType });
  }
  
  /**
   * Record node execution
   */
  recordNodeExecution(node: string, durationMs: number, attributes: MetricAttributes): void {
    this.nodeExecutionCounter.add(1, { ...attributes, node });
    this.nodeExecutionHistogram.record(durationMs, { ...attributes, node });
  }
  
  /**
   * Record action execution
   */
  recordActionExecution(action: string, durationMs: number, success: boolean, attributes: MetricAttributes): void {
    this.actionExecutionCounter.add(1, { ...attributes, action, success: success.toString() });
    this.actionExecutionHistogram.record(durationMs, { ...attributes, action });
    
    if (!success) {
      this.errorCounter.add(1, { ...attributes, action, error_type: 'action_failure' });
    }
  }
  
  /**
   * Record UDL call
   */
  recordUDLCall(method: string, durationMs: number, cacheHit: boolean, attributes: MetricAttributes): void {
    this.udlCallCounter.add(1, { 
      ...attributes, 
      udl_method: method, 
      cache_status: cacheHit ? 'hit' : 'miss' 
    });
    this.udlCallHistogram.record(durationMs, { ...attributes, udl_method: method });
  }
  
  /**
   * Record model latency
   */
  recordModelLatency(model: string, latencyMs: number, tokenCount: number): void {
    this.modelLatencyHistogram.record(latencyMs, { model });
    
    // Update token usage
    const current = this.tokenUsage.get(model) || 0;
    this.tokenUsage.set(model, current + tokenCount);
  }
  
  /**
   * Session management
   */
  startSession(sessionId: string): void {
    this.activeSessions.add(sessionId);
  }
  
  endSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }
  
  /**
   * Business metrics
   */
  recordCartConversion(converted: boolean): void {
    this.cartConversions.total++;
    if (converted) {
      this.cartConversions.converted++;
    }
  }
  
  recordSearchResult(successful: boolean): void {
    this.searchMetrics.total++;
    if (successful) {
      this.searchMetrics.successful++;
    }
  }
  
  recordB2BQuote(attributes: MetricAttributes): void {
    this.b2bQuoteCounter.add(1, attributes);
  }
  
  /**
   * API metrics
   */
  recordChatRequest(attributes: MetricAttributes & { status?: string }): void {
    this.chatRequestCounter.add(1, attributes);
  }
  
  recordChatProcessingTime(durationMs: number, attributes: MetricAttributes): void {
    this.chatProcessingHistogram.record(durationMs, attributes);
  }
  
  recordRateLimitCheck(attributes: MetricAttributes & { clientId?: string }): void {
    this.rateLimitCheckCounter.add(1, attributes);
  }
  
  /**
   * Time an operation and record metrics
   */
  async timeOperation<T>(
    metricName: string,
    operation: () => Promise<T>,
    attributes: MetricAttributes = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      // Record based on metric name
      if (metricName.includes('node')) {
        this.recordNodeExecution(attributes.node || 'unknown', duration, attributes);
      } else if (metricName.includes('action')) {
        this.recordActionExecution(attributes.action || 'unknown', duration, true, attributes);
      } else if (metricName.includes('udl')) {
        this.recordUDLCall(attributes.udl_method || 'unknown', duration, false, attributes);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (metricName.includes('action')) {
        this.recordActionExecution(attributes.action || 'unknown', duration, false, attributes);
      }
      
      throw error;
    }
  }
}

// Export singleton metrics collector
export const metrics = new MetricsCollector();

/**
 * Metrics middleware for Express/Next.js
 */
export function metricsMiddleware(req: any, res: any, next: any): void {
  const startTime = performance.now();
  
  // Track request
  metrics.recordRequest({
    environment: process.env.NODE_ENV
  });
  
  // Wrap response end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = performance.now() - startTime;
    
    metrics.recordRequestDuration(duration, {
      environment: process.env.NODE_ENV
    });
    
    // Record errors
    if (res.statusCode >= 400) {
      metrics.recordError(
        res.statusCode >= 500 ? 'server_error' : 'client_error',
        { environment: process.env.NODE_ENV }
      );
    }
    
    return originalEnd.apply(res, args);
  };
  
  next();
}