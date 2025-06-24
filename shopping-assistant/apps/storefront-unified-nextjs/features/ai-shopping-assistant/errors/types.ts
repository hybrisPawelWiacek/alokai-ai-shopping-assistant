/**
 * Error types and base classes for AI Shopping Assistant
 * Provides structured error handling with proper categorization
 */

import { z } from 'zod';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for proper classification
 */
export enum ErrorCategory {
  // User errors
  USER_INPUT = 'user_input',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  
  // System errors
  SYSTEM = 'system',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  
  // Integration errors
  UDL = 'udl',
  EXTERNAL_API = 'external_api',
  MODEL = 'model',
  
  // Business logic errors
  BUSINESS_RULE = 'business_rule',
  WORKFLOW = 'workflow',
  STATE = 'state',
  
  // Data errors
  DATA_INTEGRITY = 'data_integrity',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict'
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  NONE = 'none',
  RETRY = 'retry',
  RETRY_WITH_BACKOFF = 'retry_with_backoff',
  FALLBACK = 'fallback',
  CIRCUIT_BREAK = 'circuit_break',
  COMPENSATE = 'compensate',
  IGNORE = 'ignore',
  USER_INTERVENTION = 'user_intervention'
}

/**
 * Error context interface
 */
export interface ErrorContext {
  sessionId?: string;
  userId?: string;
  mode?: 'b2c' | 'b2b';
  action?: string;
  node?: string;
  requestId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Error details interface
 */
export interface ErrorDetails {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;
  context: ErrorContext;
  originalError?: Error;
  stack?: string;
  retryable: boolean;
  userMessage?: string;
  technicalDetails?: Record<string, any>;
}

/**
 * Base error class for AI Shopping Assistant
 */
export abstract class AIAssistantError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly recoveryStrategy: RecoveryStrategy;
  public readonly context: ErrorContext;
  public readonly retryable: boolean;
  public readonly userMessage?: string;
  public readonly technicalDetails?: Record<string, any>;
  public readonly originalError?: Error;
  
  constructor(details: Partial<ErrorDetails>) {
    super(details.message || 'An error occurred');
    
    this.name = this.constructor.name;
    this.code = details.code || 'UNKNOWN_ERROR';
    this.category = details.category || ErrorCategory.SYSTEM;
    this.severity = details.severity || ErrorSeverity.MEDIUM;
    this.recoveryStrategy = details.recoveryStrategy || RecoveryStrategy.NONE;
    this.context = details.context || { timestamp: new Date() };
    this.retryable = details.retryable ?? false;
    this.userMessage = details.userMessage;
    this.technicalDetails = details.technicalDetails;
    this.originalError = details.originalError;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Convert to error details object
   */
  toDetails(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      recoveryStrategy: this.recoveryStrategy,
      context: this.context,
      originalError: this.originalError,
      stack: this.stack,
      retryable: this.retryable,
      userMessage: this.userMessage,
      technicalDetails: this.technicalDetails
    };
  }
  
  /**
   * Check if error is of specific type
   */
  static isType<T extends AIAssistantError>(
    error: unknown,
    errorClass: new (...args: any[]) => T
  ): error is T {
    return error instanceof errorClass;
  }
}

/**
 * User input validation error
 */
export class ValidationError extends AIAssistantError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      recoveryStrategy: RecoveryStrategy.USER_INTERVENTION,
      retryable: false,
      ...details
    });
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AIAssistantError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'AUTHENTICATION_ERROR',
      message,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.USER_INTERVENTION,
      retryable: false,
      ...details
    });
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AIAssistantError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'AUTHORIZATION_ERROR',
      message,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.NONE,
      retryable: false,
      ...details
    });
  }
}

/**
 * Network error
 */
export class NetworkError extends AIAssistantError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'NETWORK_ERROR',
      message,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
      retryable: true,
      ...details
    });
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends AIAssistantError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'TIMEOUT_ERROR',
      message,
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY,
      retryable: true,
      ...details
    });
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AIAssistantError {
  public readonly retryAfter?: number;
  
  constructor(message: string, retryAfter?: number, details?: Partial<ErrorDetails>) {
    super({
      code: 'RATE_LIMIT_ERROR',
      message,
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
      retryable: true,
      ...details
    });
    
    this.retryAfter = retryAfter;
  }
}

/**
 * UDL integration error
 */
export class UDLError extends AIAssistantError {
  public readonly udlMethod?: string;
  
  constructor(message: string, udlMethod?: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'UDL_ERROR',
      message,
      category: ErrorCategory.UDL,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.RETRY,
      retryable: true,
      technicalDetails: { udlMethod },
      ...details
    });
    
    this.udlMethod = udlMethod;
  }
}

/**
 * Model error (LLM related)
 */
export class ModelError extends AIAssistantError {
  public readonly model?: string;
  
  constructor(message: string, model?: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'MODEL_ERROR',
      message,
      category: ErrorCategory.MODEL,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      retryable: true,
      technicalDetails: { model },
      ...details
    });
    
    this.model = model;
  }
}

/**
 * Business rule violation error
 */
export class BusinessRuleError extends AIAssistantError {
  public readonly rule?: string;
  
  constructor(message: string, rule?: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'BUSINESS_RULE_ERROR',
      message,
      category: ErrorCategory.BUSINESS_RULE,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.NONE,
      retryable: false,
      technicalDetails: { rule },
      ...details
    });
    
    this.rule = rule;
  }
}

/**
 * Workflow error
 */
export class WorkflowError extends AIAssistantError {
  public readonly workflow?: string;
  public readonly node?: string;
  
  constructor(message: string, workflow?: string, node?: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'WORKFLOW_ERROR',
      message,
      category: ErrorCategory.WORKFLOW,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.COMPENSATE,
      retryable: false,
      technicalDetails: { workflow, node },
      ...details
    });
    
    this.workflow = workflow;
    this.node = node;
  }
}

/**
 * State error
 */
export class StateError extends AIAssistantError {
  public readonly statePath?: string;
  
  constructor(message: string, statePath?: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'STATE_ERROR',
      message,
      category: ErrorCategory.STATE,
      severity: ErrorSeverity.CRITICAL,
      recoveryStrategy: RecoveryStrategy.COMPENSATE,
      retryable: false,
      technicalDetails: { statePath },
      ...details
    });
    
    this.statePath = statePath;
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AIAssistantError {
  public readonly resourceType?: string;
  public readonly resourceId?: string;
  
  constructor(
    message: string,
    resourceType?: string,
    resourceId?: string,
    details?: Partial<ErrorDetails>
  ) {
    super({
      code: 'NOT_FOUND_ERROR',
      message,
      category: ErrorCategory.NOT_FOUND,
      severity: ErrorSeverity.LOW,
      recoveryStrategy: RecoveryStrategy.NONE,
      retryable: false,
      technicalDetails: { resourceType, resourceId },
      ...details
    });
    
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AIAssistantError {
  public readonly conflictType?: string;
  
  constructor(message: string, conflictType?: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'CONFLICT_ERROR',
      message,
      category: ErrorCategory.CONFLICT,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY,
      retryable: true,
      technicalDetails: { conflictType },
      ...details
    });
    
    this.conflictType = conflictType;
  }
}

/**
 * Data integrity error
 */
export class DataIntegrityError extends AIAssistantError {
  public readonly dataPath?: string;
  
  constructor(message: string, dataPath?: string, details?: Partial<ErrorDetails>) {
    super({
      code: 'DATA_INTEGRITY_ERROR',
      message,
      category: ErrorCategory.DATA_INTEGRITY,
      severity: ErrorSeverity.CRITICAL,
      recoveryStrategy: RecoveryStrategy.COMPENSATE,
      retryable: false,
      technicalDetails: { dataPath },
      ...details
    });
    
    this.dataPath = dataPath;
  }
}

/**
 * Error result type for function returns
 */
export type Result<T, E = AIAssistantError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Helper to create success result
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Helper to create error result
 */
export function err<E = AIAssistantError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard for error result
 */
export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Error schemas for validation
 */
export const ErrorDetailsSchema = z.object({
  code: z.string(),
  message: z.string(),
  category: z.nativeEnum(ErrorCategory),
  severity: z.nativeEnum(ErrorSeverity),
  recoveryStrategy: z.nativeEnum(RecoveryStrategy),
  context: z.object({
    sessionId: z.string().optional(),
    userId: z.string().optional(),
    mode: z.enum(['b2c', 'b2b']).optional(),
    action: z.string().optional(),
    node: z.string().optional(),
    requestId: z.string().optional(),
    timestamp: z.date(),
    metadata: z.record(z.any()).optional()
  }),
  retryable: z.boolean(),
  userMessage: z.string().optional(),
  technicalDetails: z.record(z.any()).optional()
});