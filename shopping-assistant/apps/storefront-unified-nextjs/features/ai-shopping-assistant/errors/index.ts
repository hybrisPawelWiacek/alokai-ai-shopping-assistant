/**
 * Error handling framework exports
 * Provides comprehensive error management for AI Shopping Assistant
 */

// Error types and base classes
export * from './types';
export {
  AIAssistantError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  UDLError,
  ModelError,
  BusinessRuleError,
  WorkflowError,
  StateError,
  NotFoundError,
  ConflictError,
  DataIntegrityError,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  type ErrorContext,
  type ErrorDetails,
  type Result,
  ok,
  err,
  isError,
  ErrorDetailsSchema
} from './types';

// Error handlers
export * from './handlers';
export {
  ErrorHandler,
  globalErrorHandler,
  HandleErrors,
  withErrorHandling,
  createErrorBoundary,
  validateInput,
  createUDLError,
  createModelError,
  type ErrorHandlerConfig
} from './handlers';

// Recovery strategies
export * from './recovery';
export {
  RecoveryManager,
  recoveryManager,
  StateRecovery,
  CompensationStrategies,
  WithRecovery,
  type RecoveryContext,
  type RecoveryPolicy
} from './recovery';

// Error reporting
export * from './reporting';
export {
  ErrorReporter,
  errorReporter,
  ErrorMessageBuilders,
  reportAndGenerateMessage,
  type ErrorMessageTemplate,
  type ErrorReport,
  type ErrorReporterConfig
} from './reporting';

// Error boundaries
export * from './boundaries';
export {
  GraphErrorBoundary,
  globalErrorBoundary,
  createSafeNode,
  executeSafeGraph,
  errorRecoveryNode,
  createErrorAwareEdge,
  errorBoundaryMiddleware,
  type ErrorBoundaryConfig,
  type NodeResult
} from './boundaries';

/**
 * Convenience function to initialize error handling
 */
export interface ErrorHandlingConfig {
  handler?: ErrorHandlerConfig;
  reporter?: ErrorReporterConfig;
  boundary?: ErrorBoundaryConfig;
}

export function initializeErrorHandling(config: ErrorHandlingConfig = {}): {
  handler: ErrorHandler;
  reporter: ErrorReporter;
  boundary: GraphErrorBoundary;
} {
  // Initialize components with config
  const handler = new ErrorHandler(config.handler);
  const reporter = new ErrorReporter(config.reporter);
  const boundary = new GraphErrorBoundary(config.boundary);
  
  // Set up global error handler
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const error = new AIAssistantError({
        code: 'UNHANDLED_REJECTION',
        message: event.reason?.message || 'Unhandled promise rejection',
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.CRITICAL,
        recoveryStrategy: RecoveryStrategy.NONE,
        retryable: false,
        originalError: event.reason instanceof Error ? event.reason : undefined,
        context: { timestamp: new Date() }
      });
      
      reporter.reportError(error, 'Unhandled promise rejection');
    });
  }
  
  return { handler, reporter, boundary };
}

/**
 * Error handling best practices
 * 
 * 1. Always use specific error types:
 *    - throw new ValidationError('Invalid input') 
 *    - throw new UDLError('Failed to fetch products', 'searchProducts')
 * 
 * 2. Provide context:
 *    - Include sessionId, userId, mode in error context
 *    - Add technical details for debugging
 * 
 * 3. Use recovery strategies:
 *    - Network errors: RETRY_WITH_BACKOFF
 *    - Model errors: FALLBACK
 *    - Business errors: USER_INTERVENTION
 * 
 * 4. Generate user-friendly messages:
 *    - Use reportAndGenerateMessage() for user-facing errors
 *    - Provide suggested actions when possible
 * 
 * 5. Wrap critical operations:
 *    - Use withErrorHandling() for async operations
 *    - Use createSafeNode() for LangGraph nodes
 *    - Use executeSafeGraph() for graph execution
 * 
 * 6. Monitor and report:
 *    - All errors are automatically logged and metriced
 *    - Use error reporter for tracking patterns
 *    - Set up alerts for critical errors
 */