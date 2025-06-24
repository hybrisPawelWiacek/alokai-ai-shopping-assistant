import { NextResponse } from 'next/server';

/**
 * Error types
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle known API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          type: error.type,
          message: error.message,
          details: error.details
        }
      },
      { status: error.statusCode }
    );
  }

  // Handle timeout errors
  if (error instanceof Error && error.name === 'AbortError') {
    return NextResponse.json(
      {
        error: {
          type: ErrorType.TIMEOUT_ERROR,
          message: 'Request timeout'
        }
      },
      { status: 408 }
    );
  }

  // Handle network errors
  if (error instanceof Error && error.message.includes('fetch')) {
    return NextResponse.json(
      {
        error: {
          type: ErrorType.SERVICE_UNAVAILABLE,
          message: 'Service temporarily unavailable'
        }
      },
      { status: 503 }
    );
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  // Return generic error for unknown cases
  return NextResponse.json(
    {
      error: {
        type: ErrorType.INTERNAL_ERROR,
        message: 'An unexpected error occurred'
      }
    },
    { status: 500 }
  );
}

/**
 * Create error boundary wrapper
 */
export function withErrorBoundary<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}

/**
 * Validation error helper
 */
export function validationError(message: string, details?: any): ApiError {
  return new ApiError(
    ErrorType.VALIDATION_ERROR,
    message,
    400,
    details
  );
}

/**
 * Authentication error helper
 */
export function authenticationError(message = 'Authentication required'): ApiError {
  return new ApiError(
    ErrorType.AUTHENTICATION_ERROR,
    message,
    401
  );
}

/**
 * Authorization error helper
 */
export function authorizationError(message = 'Access denied'): ApiError {
  return new ApiError(
    ErrorType.AUTHORIZATION_ERROR,
    message,
    403
  );
}

/**
 * Rate limit error helper
 */
export function rateLimitError(retryAfter: number): ApiError {
  return new ApiError(
    ErrorType.RATE_LIMIT_ERROR,
    'Rate limit exceeded',
    429,
    { retryAfter }
  );
}

/**
 * Service unavailable error helper
 */
export function serviceUnavailableError(message = 'Service temporarily unavailable'): ApiError {
  return new ApiError(
    ErrorType.SERVICE_UNAVAILABLE,
    message,
    503
  );
}