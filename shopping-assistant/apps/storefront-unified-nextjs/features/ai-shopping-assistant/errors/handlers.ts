/**
 * Error handlers for different error types
 * Implements recovery strategies and error processing
 */

import { Loggers } from '../observability/logger';
import { metrics } from '../observability/metrics';
import { traced } from '../observability/telemetry';
import {
  AIAssistantError,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  ErrorContext,
  ValidationError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  UDLError,
  ModelError,
  BusinessRuleError,
  WorkflowError,
  StateError,
  NotFoundError,
  type Result,
  ok,
  err
} from './types';

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  backoffMultiplier?: number;
  maxRetryDelayMs?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerResetMs?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  onError?: (error: AIAssistantError) => void;
}

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  failures: number;
  lastFailure?: Date;
  isOpen: boolean;
  nextRetry?: Date;
}

/**
 * Main error handler class
 */
export class ErrorHandler {
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  
  constructor(private config: ErrorHandlerConfig = {}) {
    this.config = {
      maxRetries: 3,
      retryDelayMs: 1000,
      backoffMultiplier: 2,
      maxRetryDelayMs: 30000,
      circuitBreakerThreshold: 5,
      circuitBreakerResetMs: 60000,
      enableLogging: true,
      enableMetrics: true,
      ...config
    };
  }
  
  /**
   * Handle error with appropriate recovery strategy
   */
  async handle<T>(
    error: unknown,
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<Result<T>> {
    const aiError = this.normalizeError(error, context);
    
    // Log error
    if (this.config.enableLogging) {
      this.logError(aiError);
    }
    
    // Record metrics
    if (this.config.enableMetrics) {
      this.recordErrorMetrics(aiError);
    }
    
    // Execute custom error handler
    if (this.config.onError) {
      this.config.onError(aiError);
    }
    
    // Apply recovery strategy
    return this.applyRecoveryStrategy(aiError, operation);
  }
  
  /**
   * Normalize any error to AIAssistantError
   */
  private normalizeError(error: unknown, context?: Partial<ErrorContext>): AIAssistantError {
    if (error instanceof AIAssistantError) {
      // Update context if provided
      if (context) {
        error.context = { ...error.context, ...context };
      }
      return error;
    }
    
    // Handle specific error types
    if (error instanceof TypeError) {
      return new ValidationError(error.message, {
        originalError: error,
        context: { timestamp: new Date(), ...context }
      });
    }
    
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        return new NetworkError(error.message, {
          originalError: error,
          context: { timestamp: new Date(), ...context }
        });
      }
      
      if (error.message.includes('timeout')) {
        return new TimeoutError(error.message, {
          originalError: error,
          context: { timestamp: new Date(), ...context }
        });
      }
      
      // Default to system error
      return new AIAssistantError({
        code: 'SYSTEM_ERROR',
        message: error.message,
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        recoveryStrategy: RecoveryStrategy.RETRY,
        retryable: true,
        originalError: error,
        context: { timestamp: new Date(), ...context }
      });
    }
    
    // Handle non-Error objects
    return new AIAssistantError({
      code: 'UNKNOWN_ERROR',
      message: String(error),
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.NONE,
      retryable: false,
      context: { timestamp: new Date(), ...context }
    });
  }
  
  /**
   * Apply recovery strategy based on error type
   */
  private async applyRecoveryStrategy<T>(
    error: AIAssistantError,
    operation: () => Promise<T>
  ): Promise<Result<T>> {
    switch (error.recoveryStrategy) {
      case RecoveryStrategy.RETRY:
        return this.retryOperation(error, operation);
        
      case RecoveryStrategy.RETRY_WITH_BACKOFF:
        return this.retryWithBackoff(error, operation);
        
      case RecoveryStrategy.CIRCUIT_BREAK:
        return this.applyCircuitBreaker(error, operation);
        
      case RecoveryStrategy.FALLBACK:
        return this.applyFallback(error);
        
      case RecoveryStrategy.COMPENSATE:
        return this.compensate(error);
        
      case RecoveryStrategy.IGNORE:
        Loggers.ai.warn('Ignoring error as per recovery strategy', {
          error: error.code,
          message: error.message
        });
        return ok(undefined as any);
        
      case RecoveryStrategy.USER_INTERVENTION:
      case RecoveryStrategy.NONE:
      default:
        return err(error);
    }
  }
  
  /**
   * Retry operation with fixed delay
   */
  private async retryOperation<T>(
    error: AIAssistantError,
    operation: () => Promise<T>,
    attempt = 1
  ): Promise<Result<T>> {
    if (!error.retryable || attempt > this.config.maxRetries!) {
      return err(error);
    }
    
    await this.delay(this.config.retryDelayMs!);
    
    try {
      const result = await operation();
      return ok(result);
    } catch (retryError) {
      const normalizedError = this.normalizeError(retryError, error.context);
      return this.retryOperation(normalizedError, operation, attempt + 1);
    }
  }
  
  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    error: AIAssistantError,
    operation: () => Promise<T>,
    attempt = 1
  ): Promise<Result<T>> {
    if (!error.retryable || attempt > this.config.maxRetries!) {
      return err(error);
    }
    
    const delay = Math.min(
      this.config.retryDelayMs! * Math.pow(this.config.backoffMultiplier!, attempt - 1),
      this.config.maxRetryDelayMs!
    );
    
    // Handle rate limit specific delay
    if (error instanceof RateLimitError && error.retryAfter) {
      await this.delay(error.retryAfter * 1000);
    } else {
      await this.delay(delay);
    }
    
    try {
      const result = await operation();
      return ok(result);
    } catch (retryError) {
      const normalizedError = this.normalizeError(retryError, error.context);
      return this.retryWithBackoff(normalizedError, operation, attempt + 1);
    }
  }
  
  /**
   * Apply circuit breaker pattern
   */
  private async applyCircuitBreaker<T>(
    error: AIAssistantError,
    operation: () => Promise<T>
  ): Promise<Result<T>> {
    const key = `${error.category}:${error.code}`;
    const state = this.circuitBreakers.get(key) || {
      failures: 0,
      isOpen: false
    };
    
    // Check if circuit is open
    if (state.isOpen && state.nextRetry && new Date() < state.nextRetry) {
      return err(new AIAssistantError({
        ...error.toDetails(),
        code: 'CIRCUIT_BREAKER_OPEN',
        message: `Circuit breaker is open. Retry after ${state.nextRetry.toISOString()}`,
        retryable: false
      }));
    }
    
    // Try operation
    try {
      const result = await operation();
      
      // Reset circuit breaker on success
      this.circuitBreakers.delete(key);
      
      return ok(result);
    } catch (operationError) {
      // Increment failure count
      state.failures++;
      state.lastFailure = new Date();
      
      // Open circuit if threshold reached
      if (state.failures >= this.config.circuitBreakerThreshold!) {
        state.isOpen = true;
        state.nextRetry = new Date(Date.now() + this.config.circuitBreakerResetMs!);
      }
      
      this.circuitBreakers.set(key, state);
      
      return err(this.normalizeError(operationError, error.context));
    }
  }
  
  /**
   * Apply fallback strategy
   */
  private async applyFallback<T>(error: AIAssistantError): Promise<Result<T>> {
    // Model errors might have fallback models
    if (error instanceof ModelError) {
      Loggers.ai.info('Applying fallback for model error', {
        originalModel: error.model,
        error: error.code
      });
      
      // Return error for now - actual fallback would be implemented
      // in the specific action handler
      return err(error);
    }
    
    return err(error);
  }
  
  /**
   * Apply compensation strategy
   */
  private async compensate<T>(error: AIAssistantError): Promise<Result<T>> {
    // Workflow and state errors might need compensation
    if (error instanceof WorkflowError || error instanceof StateError) {
      Loggers.ai.info('Applying compensation for error', {
        error: error.code,
        category: error.category
      });
      
      // Return error for now - actual compensation would be implemented
      // in the specific workflow handler
      return err(error);
    }
    
    return err(error);
  }
  
  /**
   * Log error with appropriate level
   */
  private logError(error: AIAssistantError): void {
    const logContext = {
      code: error.code,
      category: error.category,
      severity: error.severity,
      retryable: error.retryable,
      context: error.context,
      technicalDetails: error.technicalDetails
    };
    
    switch (error.severity) {
      case ErrorSeverity.LOW:
        Loggers.ai.info(`Error: ${error.message}`, logContext);
        break;
        
      case ErrorSeverity.MEDIUM:
        Loggers.ai.warn(`Error: ${error.message}`, logContext);
        break;
        
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        Loggers.ai.error(`Error: ${error.message}`, error.originalError || error, logContext);
        break;
    }
  }
  
  /**
   * Record error metrics
   */
  private recordErrorMetrics(error: AIAssistantError): void {
    metrics.recordRequestError({
      error_code: error.code,
      error_category: error.category,
      error_severity: error.severity,
      mode: error.context.mode || 'unknown',
      action: error.context.action || 'unknown'
    });
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandler();

/**
 * Error handler decorators
 */
export function HandleErrors(options?: ErrorHandlerConfig) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const handler = new ErrorHandler(options);
    
    descriptor.value = async function(...args: any[]) {
      const context: Partial<ErrorContext> = {
        action: `${target.constructor.name}.${propertyKey}`,
        timestamp: new Date()
      };
      
      const result = await handler.handle(
        null,
        () => originalMethod.apply(this, args),
        context
      );
      
      if (!result.success) {
        throw result.error;
      }
      
      return result.data;
    };
    
    return descriptor;
  };
}

/**
 * Wrap async function with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Partial<ErrorContext>,
  options?: ErrorHandlerConfig
): Promise<Result<T>> {
  const handler = options ? new ErrorHandler(options) : globalErrorHandler;
  
  try {
    const result = await operation();
    return ok(result);
  } catch (error) {
    return handler.handle(error, operation, context);
  }
}

/**
 * Error boundary for LangGraph nodes
 */
export function createErrorBoundary(
  nodeName: string,
  options?: ErrorHandlerConfig
): <T>(operation: () => Promise<T>) => Promise<T> {
  const handler = new ErrorHandler(options);
  
  return traced(`errorBoundary.${nodeName}`, async <T>(operation: () => Promise<T>): Promise<T> => {
    const context: Partial<ErrorContext> = {
      node: nodeName,
      timestamp: new Date()
    };
    
    const result = await handler.handle(null, operation, context);
    
    if (!result.success) {
      // For error boundaries, we need to throw to stop graph execution
      throw result.error;
    }
    
    return result.data;
  });
}

/**
 * Validation error helper
 */
export function validateInput<T>(
  input: unknown,
  validator: (input: unknown) => T,
  errorMessage?: string
): Result<T> {
  try {
    const validated = validator(input);
    return ok(validated);
  } catch (error) {
    return err(new ValidationError(
      errorMessage || (error instanceof Error ? error.message : 'Validation failed'),
      { originalError: error instanceof Error ? error : undefined }
    ));
  }
}

/**
 * UDL error helper
 */
export function createUDLError(
  method: string,
  error: unknown,
  context?: Partial<ErrorContext>
): UDLError {
  const message = error instanceof Error ? error.message : 'UDL operation failed';
  
  return new UDLError(
    `UDL method '${method}' failed: ${message}`,
    method,
    {
      originalError: error instanceof Error ? error : undefined,
      context: { timestamp: new Date(), ...context }
    }
  );
}

/**
 * Model error helper
 */
export function createModelError(
  model: string,
  error: unknown,
  context?: Partial<ErrorContext>
): ModelError {
  const message = error instanceof Error ? error.message : 'Model operation failed';
  
  return new ModelError(
    `Model '${model}' failed: ${message}`,
    model,
    {
      originalError: error instanceof Error ? error : undefined,
      context: { timestamp: new Date(), ...context }
    }
  );
}