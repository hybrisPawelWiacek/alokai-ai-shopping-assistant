/**
 * Error handling utilities for SDK operations
 */

/**
 * Enhanced error types for SDK failures
 */
export class SDKError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'SDKError';
  }
}

export class NetworkError extends SDKError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', 0, details);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends SDKError {
  constructor(message: string, details?: any) {
    super(message, 'AUTH_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends SDKError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends SDKError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends SDKError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Parse SDK errors and return user-friendly messages
 */
export function parseSDKError(error: unknown): {
  userMessage: string;
  technicalMessage: string;
  code: string;
  recoverable: boolean;
} {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      userMessage: 'Unable to connect to our servers. Please check your internet connection and try again.',
      technicalMessage: error.message,
      code: 'NETWORK_ERROR',
      recoverable: true
    };
  }

  // Timeout errors
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      userMessage: 'The request took too long. Please try again.',
      technicalMessage: 'Request timeout',
      code: 'TIMEOUT_ERROR',
      recoverable: true
    };
  }

  // API response errors
  if (error instanceof Error && 'response' in error) {
    const response = (error as any).response;
    const status = response?.status;

    switch (status) {
      case 401:
        return {
          userMessage: 'Your session has expired. Please log in again.',
          technicalMessage: error.message,
          code: 'AUTH_ERROR',
          recoverable: false
        };
      case 403:
        return {
          userMessage: 'You don\'t have permission to perform this action.',
          technicalMessage: error.message,
          code: 'PERMISSION_ERROR',
          recoverable: false
        };
      case 404:
        return {
          userMessage: 'The requested item could not be found.',
          technicalMessage: error.message,
          code: 'NOT_FOUND',
          recoverable: false
        };
      case 429:
        return {
          userMessage: 'Too many requests. Please wait a moment before trying again.',
          technicalMessage: error.message,
          code: 'RATE_LIMIT',
          recoverable: true
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          userMessage: 'Our servers are experiencing issues. Please try again later.',
          technicalMessage: error.message,
          code: 'SERVER_ERROR',
          recoverable: true
        };
    }
  }

  // Validation errors
  if (error instanceof Error && error.message.toLowerCase().includes('validation')) {
    return {
      userMessage: 'The provided information is invalid. Please check and try again.',
      technicalMessage: error.message,
      code: 'VALIDATION_ERROR',
      recoverable: false
    };
  }

  // Generic error
  return {
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalMessage: error instanceof Error ? error.message : 'Unknown error',
    code: 'UNKNOWN_ERROR',
    recoverable: true
  };
}

/**
 * Wrap SDK calls with enhanced error handling
 */
export async function withSDKErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    action: string;
    fallbackMessage?: string;
  }
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const parsed = parseSDKError(error);
    
    // Log technical details
    console.error(`SDK Error in ${context.action}:`, {
      userMessage: parsed.userMessage,
      technicalMessage: parsed.technicalMessage,
      code: parsed.code,
      recoverable: parsed.recoverable,
      originalError: error
    });

    // Throw user-friendly error
    throw new SDKError(
      context.fallbackMessage || parsed.userMessage,
      parsed.code,
      undefined,
      { recoverable: parsed.recoverable }
    );
  }
}

/**
 * Retry logic for recoverable errors
 */
export async function retrySDKOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    backoffMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, backoffMs = 1000, shouldRetry } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const parsed = parseSDKError(error);
      const defaultShouldRetry = parsed.recoverable && parsed.code !== 'AUTH_ERROR';
      const retry = shouldRetry ? shouldRetry(error) : defaultShouldRetry;
      
      if (!retry || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = backoffMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
