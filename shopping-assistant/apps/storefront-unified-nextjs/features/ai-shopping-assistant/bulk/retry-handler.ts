import type { BulkOrderRow } from './csv-parser';
import type { BulkProcessingError, ProductAvailability } from './bulk-processor';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  finalDelay: number;
}

/**
 * Default retry configuration for bulk operations
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'rate_limit',
    'temporary_failure',
    'stock_update_in_progress'
  ]
};

/**
 * Handles retry logic for bulk operations with exponential backoff
 */
export class BulkRetryHandler {
  constructor(private config: RetryConfig = DEFAULT_RETRY_CONFIG) {}

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: { sku?: string; operation?: string }
  ): Promise<RetryResult<T>> {
    let lastError: Error | undefined;
    let delay = this.config.initialDelay;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          result,
          attempts: attempt,
          finalDelay: delay
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          return {
            success: false,
            error: lastError,
            attempts: attempt,
            finalDelay: delay
          };
        }

        // Don't retry on last attempt
        if (attempt === this.config.maxAttempts) {
          break;
        }

        // Log retry attempt
        console.log(`Retry attempt ${attempt}/${this.config.maxAttempts} for ${context?.operation || 'operation'} ${context?.sku || ''}. Waiting ${delay}ms...`);

        // Wait before retry
        await this.delay(delay);

        // Calculate next delay with exponential backoff
        delay = Math.min(delay * this.config.backoffMultiplier, this.config.maxDelay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: this.config.maxAttempts,
      finalDelay: delay
    };
  }

  /**
   * Batch retry for multiple items with partial success handling
   */
  async batchRetryWithPartialSuccess<T>(
    items: BulkOrderRow[],
    operation: (item: BulkOrderRow) => Promise<T>,
    onItemComplete?: (item: BulkOrderRow, result: RetryResult<T>) => void
  ): Promise<{
    successful: Array<{ item: BulkOrderRow; result: T }>;
    failed: Array<{ item: BulkOrderRow; error: Error; attempts: number }>;
    partiallySuccessful: boolean;
  }> {
    const successful: Array<{ item: BulkOrderRow; result: T }> = [];
    const failed: Array<{ item: BulkOrderRow; error: Error; attempts: number }> = [];

    // Process items with retry
    await Promise.all(
      items.map(async (item) => {
        const result = await this.executeWithRetry(
          () => operation(item),
          { sku: item.sku, operation: 'process_item' }
        );

        if (result.success && result.result) {
          successful.push({ item, result: result.result });
        } else if (result.error) {
          failed.push({ 
            item, 
            error: result.error,
            attempts: result.attempts 
          });
        }

        // Callback for progress tracking
        if (onItemComplete) {
          onItemComplete(item, result);
        }
      })
    );

    return {
      successful,
      failed,
      partiallySuccessful: successful.length > 0 && failed.length > 0
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    return this.config.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create enhanced error with retry context
   */
  createEnhancedError(
    originalError: Error,
    context: {
      sku: string;
      attempts: number;
      lastDelay: number;
      operation: string;
    }
  ): BulkProcessingError {
    return {
      sku: context.sku,
      quantity: 0, // Will be filled by caller
      error: `${originalError.message} (failed after ${context.attempts} attempts)`,
      suggestion: this.generateRecoverySuggestion(originalError, context)
    };
  }

  /**
   * Generate recovery suggestions based on error type
   */
  private generateRecoverySuggestion(
    error: Error,
    context: { sku: string; attempts: number }
  ): any {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('rate_limit')) {
      return {
        action: 'retry_later',
        message: 'Rate limit reached. Try again in a few minutes.',
        retryAfter: 300000 // 5 minutes
      };
    }

    if (errorMessage.includes('stock') || errorMessage.includes('availability')) {
      return {
        action: 'check_alternatives',
        message: 'Product availability issue. Check for alternatives.',
        checkAlternatives: true
      };
    }

    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return {
        action: 'retry_batch',
        message: 'Network issue. Retry this batch of items.',
        retryBatch: true
      };
    }

    if (context.attempts >= 3) {
      return {
        action: 'manual_review',
        message: 'Multiple failures. This item needs manual review.',
        requiresManualReview: true
      };
    }

    return {
      action: 'contact_support',
      message: 'Unexpected error. Contact support if issue persists.'
    };
  }
}

/**
 * Circuit breaker for preventing cascading failures
 */
export class BulkOperationCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  /**
   * Check if circuit breaker allows operation
   */
  canProceed(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }

    // half-open state
    return true;
  }

  /**
   * Record success
   */
  recordSuccess(): void {
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.failures = 0;
    }
  }

  /**
   * Record failure
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus(): {
    state: string;
    failures: number;
    canProceed: boolean;
    nextRetryTime?: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      canProceed: this.canProceed(),
      nextRetryTime: this.state === 'open' 
        ? this.lastFailureTime + this.timeout 
        : undefined
    };
  }
}