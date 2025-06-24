/**
 * Observability layer exports
 * Provides comprehensive monitoring, logging, tracing, and profiling
 */

// Telemetry and tracing
export * from './telemetry';
export { initializeTelemetry, traced, createAISpan, traceLangGraphNode, traceUDLCall, TraceContext, telemetryMiddleware } from './telemetry';

// Structured logging
export * from './logger';
export { logger, Loggers, StructuredLogger, ComponentLogger, CorrelationContext } from './logger';

// Metrics collection
export * from './metrics';
export { metrics, initializeMetrics, MetricsCollector, metricsMiddleware } from './metrics';

// LangGraph instrumentation
export * from './langgraph-instrumentation';
export { instrumentNode, instrumentGraph, instrumentTool, instrumentModelCall, InstrumentedNodes } from './langgraph-instrumentation';

// Context propagation
export * from './context-propagation';
export { ContextExtractor, ContextInjector, AsyncContextManager, preserveContext, PreserveContext, TracePropagation, contextPropagationMiddleware } from './context-propagation';

// Dashboard configuration
export * from './dashboard-config';
export { GrafanaDashboardConfig, PrometheusAlertRules, exportGrafanaDashboard, exportPrometheusRules } from './dashboard-config';

// Performance profiling
export * from './profiler';
export { PerformanceProfiler, CPUProfiler, PerformanceMonitor, Profile, globalProfiler, PerfUtils } from './profiler';

// Convenience initialization function
import { initializeTelemetry } from './telemetry';
import { initializeMetrics } from './metrics';
import { logger } from './logger';

export interface ObservabilityConfig {
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
  telemetry?: {
    enabled?: boolean;
    endpoint?: string;
    consoleExport?: boolean;
  };
  metrics?: {
    enabled?: boolean;
    endpoint?: string;
    exportInterval?: number;
  };
  logging?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    format?: 'json' | 'pretty';
  };
}

/**
 * Initialize all observability components
 */
export async function initializeObservability(config: ObservabilityConfig = {}): Promise<{
  shutdown: () => Promise<void>;
}> {
  const {
    serviceName = 'ai-shopping-assistant',
    serviceVersion = '1.0.0',
    environment = process.env.NODE_ENV || 'development',
    telemetry = {},
    metrics: metricsConfig = {},
    logging = {}
  } = config;

  // Initialize telemetry
  let telemetryProvider;
  if (telemetry.enabled !== false) {
    telemetryProvider = initializeTelemetry({
      serviceName,
      serviceVersion,
      environment,
      otlpEndpoint: telemetry.endpoint,
      enableConsoleExport: telemetry.consoleExport
    });
  }

  // Initialize metrics
  let metricsProvider;
  if (metricsConfig.enabled !== false) {
    metricsProvider = initializeMetrics({
      serviceName,
      serviceVersion,
      environment,
      otlpEndpoint: metricsConfig.endpoint,
      exportIntervalMillis: metricsConfig.exportInterval
    });
  }

  // Configure logging
  logger['config'].minLevel = logging.level || 'info';
  logger['config'].outputFormat = logging.format || (environment === 'production' ? 'json' : 'pretty');

  // Log initialization
  logger.info('Observability', 'Observability layer initialized', {
    serviceName,
    serviceVersion,
    environment,
    telemetryEnabled: telemetry.enabled !== false,
    metricsEnabled: metricsConfig.enabled !== false,
    logLevel: logging.level || 'info'
  });

  // Return shutdown function
  return {
    shutdown: async () => {
      logger.info('Observability', 'Shutting down observability layer');
      
      // Shutdown telemetry
      if (telemetryProvider) {
        await telemetryProvider.shutdown();
      }
      
      // Shutdown metrics
      if (metricsProvider) {
        await metricsProvider.shutdown();
      }
      
      logger.info('Observability', 'Observability layer shutdown complete');
    }
  };
}

/**
 * Express/Next.js middleware that combines all observability middleware
 */
export function observabilityMiddleware(req: any, res: any, next: any): void {
  // Apply all middleware in order
  contextPropagationMiddleware(req, res, () => {
    telemetryMiddleware(req, res, () => {
      metricsMiddleware(req, res, next);
    });
  });
}