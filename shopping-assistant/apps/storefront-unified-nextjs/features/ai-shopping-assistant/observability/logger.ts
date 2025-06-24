import { context, trace } from '@opentelemetry/api';
import type { LogEntry } from '../types/action-definition';

/**
 * Structured logging system with OpenTelemetry context propagation
 * Provides consistent logging across the AI assistant with trace correlation
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  sessionId?: string;
  userId?: string;
  mode?: 'b2c' | 'b2b';
  action?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: any;
}

export interface StructuredLogEntry extends LogEntry {
  traceId?: string;
  spanId?: string;
  serviceName: string;
  version: string;
  environment: string;
  context: LogContext;
}

/**
 * Log level priorities for filtering
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Logger configuration
 */
export interface LoggerConfig {
  serviceName?: string;
  version?: string;
  environment?: string;
  minLevel?: LogLevel;
  outputFormat?: 'json' | 'pretty';
  includeStackTrace?: boolean;
  contextExtractor?: () => LogContext;
  transports?: LogTransport[];
}

/**
 * Log transport interface
 */
export interface LogTransport {
  name: string;
  log(entry: StructuredLogEntry): void | Promise<void>;
}

/**
 * Console transport
 */
class ConsoleTransport implements LogTransport {
  name = 'console';
  
  constructor(private format: 'json' | 'pretty' = 'json') {}
  
  log(entry: StructuredLogEntry): void {
    if (this.format === 'json') {
      console.log(JSON.stringify(entry));
    } else {
      const { timestamp, level, component, message, metadata, context, traceId } = entry;
      const prefix = `[${timestamp}] ${level.toUpperCase()} [${component}]`;
      const traceInfo = traceId ? ` [trace:${traceId.slice(-8)}]` : '';
      
      console.log(`${prefix}${traceInfo} ${message}`, {
        context,
        metadata
      });
    }
  }
}

/**
 * Structured logger implementation
 */
export class StructuredLogger {
  private config: Required<LoggerConfig>;
  private transports: LogTransport[];
  
  constructor(config: LoggerConfig = {}) {
    this.config = {
      serviceName: config.serviceName || 'ai-shopping-assistant',
      version: config.version || '1.0.0',
      environment: config.environment || process.env.NODE_ENV || 'development',
      minLevel: config.minLevel || 'info',
      outputFormat: config.outputFormat || 'json',
      includeStackTrace: config.includeStackTrace ?? (process.env.NODE_ENV !== 'production'),
      contextExtractor: config.contextExtractor || (() => ({})),
      transports: config.transports || []
    };
    
    // Add default console transport if no transports provided
    this.transports = this.config.transports.length > 0 
      ? this.config.transports 
      : [new ConsoleTransport(this.config.outputFormat)];
  }
  
  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }
  
  /**
   * Extract trace context from OpenTelemetry
   */
  private getTraceContext(): { traceId?: string; spanId?: string } {
    const span = trace.getActiveSpan();
    if (!span) return {};
    
    const spanContext = span.spanContext();
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId
    };
  }
  
  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    component: string,
    message: string,
    metadata?: Record<string, any>
  ): StructuredLogEntry {
    const traceContext = this.getTraceContext();
    const customContext = this.config.contextExtractor();
    
    return {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      metadata: metadata || {},
      serviceName: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      context: {
        ...customContext,
        traceId: traceContext.traceId,
        spanId: traceContext.spanId
      }
    };
  }
  
  /**
   * Log a message
   */
  private async log(
    level: LogLevel,
    component: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.shouldLog(level)) return;
    
    const entry = this.createLogEntry(level, component, message, metadata);
    
    // Send to all transports
    await Promise.all(
      this.transports.map(transport => {
        try {
          return transport.log(entry);
        } catch (error) {
          console.error(`Error in log transport ${transport.name}:`, error);
        }
      })
    );
  }
  
  /**
   * Log methods
   */
  debug(component: string, message: string, metadata?: Record<string, any>): void {
    this.log('debug', component, message, metadata);
  }
  
  info(component: string, message: string, metadata?: Record<string, any>): void {
    this.log('info', component, message, metadata);
  }
  
  warn(component: string, message: string, metadata?: Record<string, any>): void {
    this.log('warn', component, message, metadata);
  }
  
  error(component: string, message: string, error?: Error | unknown, metadata?: Record<string, any>): void {
    const errorMetadata: Record<string, any> = { ...metadata };
    
    if (error instanceof Error) {
      errorMetadata.error = {
        name: error.name,
        message: error.message,
        stack: this.config.includeStackTrace ? error.stack : undefined
      };
    } else if (error) {
      errorMetadata.error = error;
    }
    
    this.log('error', component, message, errorMetadata);
  }
  
  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): StructuredLogger {
    const parentExtractor = this.config.contextExtractor;
    
    return new StructuredLogger({
      ...this.config,
      contextExtractor: () => ({
        ...parentExtractor(),
        ...additionalContext
      })
    });
  }
  
  /**
   * Create a logger for a specific component
   */
  forComponent(component: string): ComponentLogger {
    return new ComponentLogger(this, component);
  }
}

/**
 * Component-specific logger
 */
export class ComponentLogger {
  constructor(
    private logger: StructuredLogger,
    private component: string
  ) {}
  
  debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(this.component, message, metadata);
  }
  
  info(message: string, metadata?: Record<string, any>): void {
    this.logger.info(this.component, message, metadata);
  }
  
  warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(this.component, message, metadata);
  }
  
  error(message: string, error?: Error | unknown, metadata?: Record<string, any>): void {
    this.logger.error(this.component, message, error, metadata);
  }
  
  /**
   * Time an operation and log the duration
   */
  async timeOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.info(`${operationName} completed`, {
        ...metadata,
        duration_ms: duration,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.error(`${operationName} failed`, error, {
        ...metadata,
        duration_ms: duration,
        success: false
      });
      
      throw error;
    }
  }
}

/**
 * Correlation ID management
 */
export class CorrelationContext {
  private static readonly CORRELATION_ID_KEY = 'correlationId';
  
  static get(): string | undefined {
    const activeContext = context.active();
    return activeContext.getValue(Symbol.for(this.CORRELATION_ID_KEY)) as string;
  }
  
  static set(correlationId: string): void {
    const activeContext = context.active();
    context.with(
      activeContext.setValue(Symbol.for(this.CORRELATION_ID_KEY), correlationId),
      () => {}
    );
  }
  
  static runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
    const activeContext = context.active();
    return context.with(
      activeContext.setValue(Symbol.for(this.CORRELATION_ID_KEY), correlationId),
      fn
    );
  }
}

/**
 * Default logger instance
 */
export const logger = new StructuredLogger({
  minLevel: (process.env.LOG_LEVEL as LogLevel) || 'info',
  outputFormat: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
  contextExtractor: () => ({
    correlationId: CorrelationContext.get()
  })
});

/**
 * Specialized loggers for different components
 */
export const Loggers = {
  ai: logger.forComponent('AIAssistant'),
  graph: logger.forComponent('LangGraph'),
  action: logger.forComponent('Action'),
  udl: logger.forComponent('UDL'),
  security: logger.forComponent('Security'),
  cache: logger.forComponent('Cache'),
  config: logger.forComponent('Config')
};