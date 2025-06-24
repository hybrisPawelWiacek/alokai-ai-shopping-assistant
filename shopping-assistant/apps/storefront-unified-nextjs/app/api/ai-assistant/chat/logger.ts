/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Logger interface
 */
export interface ILogger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  log(level: string, message: string, metadata?: Record<string, any>): void;
}

/**
 * Simple console logger for development
 */
class ConsoleLogger implements ILogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  debug(message: string, metadata?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.debug(`[AI-ASSISTANT] ${message}`, metadata || '');
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    console.info(`[AI-ASSISTANT] ${message}`, metadata || '');
  }

  warn(message: string, metadata?: Record<string, any>): void {
    console.warn(`[AI-ASSISTANT] ${message}`, metadata || '');
  }

  error(message: string, metadata?: Record<string, any>): void {
    console.error(`[AI-ASSISTANT] ${message}`, metadata || '');
  }

  log(level: string, message: string, metadata?: Record<string, any>): void {
    const logMethod = this[level as keyof ConsoleLogger] as any;
    if (typeof logMethod === 'function') {
      logMethod.call(this, message, metadata);
    } else {
      this.info(message, metadata);
    }
  }
}

/**
 * Structured logger for production (would integrate with logging service)
 */
class StructuredLogger implements ILogger {
  private formatLog(level: string, message: string, metadata?: Record<string, any>): string {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'ai-assistant',
      ...metadata
    };
    return JSON.stringify(log);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(this.formatLog(LogLevel.DEBUG, message, metadata));
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    console.log(this.formatLog(LogLevel.INFO, message, metadata));
  }

  warn(message: string, metadata?: Record<string, any>): void {
    console.log(this.formatLog(LogLevel.WARN, message, metadata));
  }

  error(message: string, metadata?: Record<string, any>): void {
    console.error(this.formatLog(LogLevel.ERROR, message, metadata));
  }

  log(level: string, message: string, metadata?: Record<string, any>): void {
    const logMethod = this[level as keyof StructuredLogger] as any;
    if (typeof logMethod === 'function') {
      logMethod.call(this, message, metadata);
    } else {
      this.info(message, metadata);
    }
  }
}

/**
 * Create logger instance based on environment
 */
function createLogger(): ILogger {
  if (process.env.NODE_ENV === 'production') {
    return new StructuredLogger();
  }
  return new ConsoleLogger();
}

// Export singleton logger instance
export const logger = createLogger();

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  const performanceData = {
    operation,
    duration,
    ...metadata
  };

  if (duration > 1000) {
    logger.warn(`Slow operation: ${operation}`, performanceData);
  } else {
    logger.debug(`Performance: ${operation}`, performanceData);
  }
}

/**
 * Create child logger with context
 */
export function createChildLogger(context: Record<string, any>): ILogger {
  const parentLogger = logger;
  
  return {
    debug: (message: string, metadata?: Record<string, any>) => 
      parentLogger.debug(message, { ...context, ...metadata }),
    info: (message: string, metadata?: Record<string, any>) => 
      parentLogger.info(message, { ...context, ...metadata }),
    warn: (message: string, metadata?: Record<string, any>) => 
      parentLogger.warn(message, { ...context, ...metadata }),
    error: (message: string, metadata?: Record<string, any>) => 
      parentLogger.error(message, { ...context, ...metadata }),
    log: (level: string, message: string, metadata?: Record<string, any>) => 
      parentLogger.log(level, message, { ...context, ...metadata })
  };
}