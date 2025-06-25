import type { BulkOrderRow } from './csv-parser';
import type { StateUpdateCommand } from '../types/action-definition';
import { BulkRetryHandler, BulkOperationCircuitBreaker } from './retry-handler';

/**
 * Bulk processing status
 */
export interface BulkProcessingStatus {
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  currentBatch: number;
  totalBatches: number;
  startTime: number;
  estimatedTimeRemaining: number;
  errors: BulkProcessingError[];
}

/**
 * Bulk processing error
 */
export interface BulkProcessingError {
  sku: string;
  quantity: number;
  error: string;
  suggestion?: AlternativeSuggestion;
}

/**
 * Alternative product suggestion
 */
export interface AlternativeSuggestion {
  sku: string;
  name: string;
  similarity: number;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  price?: number;
  reason: string;
}

/**
 * Bulk processing result
 */
export interface BulkProcessingResult {
  success: boolean;
  itemsProcessed: number;
  itemsAdded: number;
  itemsFailed: number;
  totalQuantity: number;
  totalValue: number;
  processingTime: number;
  errors: BulkProcessingError[];
  suggestions: Map<string, AlternativeSuggestion[]>;
}

/**
 * Product availability check result
 */
export interface ProductAvailability {
  sku: string;
  available: boolean;
  quantity: number;
  price: number;
  name: string;
}

/**
 * Bulk processor configuration
 */
export interface BulkProcessorConfig {
  batchSize: number;
  maxConcurrent: number;
  enableAlternatives: boolean;
  progressCallback?: (status: BulkProcessingStatus) => void;
  checkAvailability: (sku: string) => Promise<ProductAvailability>;
  findAlternatives: (sku: string) => Promise<AlternativeSuggestion[]>;
  addToCart: (items: { sku: string; quantity: number }[]) => Promise<void>;
}

/**
 * Processes bulk orders with intelligent batching and alternative suggestions
 */
export class BulkOrderProcessor {
  private retryHandler: BulkRetryHandler;
  private circuitBreaker: BulkOperationCircuitBreaker;

  constructor(private config: BulkProcessorConfig) {
    this.retryHandler = new BulkRetryHandler({
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'rate_limit', 'temporary_failure']
    });
    this.circuitBreaker = new BulkOperationCircuitBreaker(5, 60000);
  }

  /**
   * Process bulk order rows with progress tracking
   */
  async processBulkOrder(rows: BulkOrderRow[]): Promise<BulkProcessingResult> {
    const startTime = Date.now();
    const errors: BulkProcessingError[] = [];
    const suggestions = new Map<string, AlternativeSuggestion[]>();
    
    // Group by priority
    const priorityGroups = this.groupByPriority(rows);
    
    // Calculate total batches
    const totalBatches = Math.ceil(rows.length / this.config.batchSize);
    let processedItems = 0;
    let successfulItems = 0;
    let totalQuantity = 0;
    let totalValue = 0;

    // Process high priority first
    for (const priority of ['high', 'normal', 'low'] as const) {
      const items = priorityGroups[priority] || [];
      
      // Process in batches
      for (let i = 0; i < items.length; i += this.config.batchSize) {
        const batch = items.slice(i, i + this.config.batchSize);
        const currentBatch = Math.floor(i / this.config.batchSize) + 1;
        
        // Report progress
        if (this.config.progressCallback) {
          const status = this.calculateStatus(
            rows.length,
            processedItems,
            successfulItems,
            errors.length,
            currentBatch,
            totalBatches,
            startTime
          );
          this.config.progressCallback(status);
        }

        // Process batch with concurrency control
        const batchResults = await this.processBatch(batch);
        
        // Aggregate results
        for (const result of batchResults) {
          processedItems++;
          
          if (result.success) {
            successfulItems++;
            totalQuantity += result.quantity;
            totalValue += result.value;
          } else {
            errors.push(result.error);
            
            // Get alternatives if enabled
            if (this.config.enableAlternatives && result.error.suggestion) {
              const alternatives = await this.config.findAlternatives(result.error.sku);
              if (alternatives.length > 0) {
                suggestions.set(result.error.sku, alternatives);
                result.error.suggestion = alternatives[0];
              }
            }
          }
        }
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      success: errors.length === 0,
      itemsProcessed: processedItems,
      itemsAdded: successfulItems,
      itemsFailed: errors.length,
      totalQuantity,
      totalValue,
      processingTime,
      errors,
      suggestions
    };
  }

  /**
   * Process a single batch with concurrency control
   */
  private async processBatch(
    items: BulkOrderRow[]
  ): Promise<Array<{ success: boolean; quantity: number; value: number; error?: BulkProcessingError }>> {
    // Check availability for all items in parallel
    const availabilityChecks = await Promise.all(
      items.map(item => this.checkItemAvailability(item))
    );

    // Separate available and unavailable items
    const available: Array<{ item: BulkOrderRow; availability: ProductAvailability }> = [];
    const unavailable: Array<{ item: BulkOrderRow; error: BulkProcessingError }> = [];

    availabilityChecks.forEach((check, index) => {
      if (check.available) {
        available.push({ item: items[index], availability: check.availability });
      } else {
        unavailable.push({ item: items[index], error: check.error });
      }
    });

    // Add available items to cart in batches
    const results: Array<{ success: boolean; quantity: number; value: number; error?: BulkProcessingError }> = [];

    if (available.length > 0) {
      try {
        // Prepare cart items
        const cartItems = available.map(({ item, availability }) => ({
          sku: item.sku,
          quantity: Math.min(item.quantity, availability.quantity)
        }));

        // Add to cart
        await this.config.addToCart(cartItems);

        // Record successes
        available.forEach(({ item, availability }) => {
          const addedQuantity = Math.min(item.quantity, availability.quantity);
          results.push({
            success: true,
            quantity: addedQuantity,
            value: addedQuantity * availability.price
          });

          // If partial quantity, create error for remaining
          if (addedQuantity < item.quantity) {
            results.push({
              success: false,
              quantity: 0,
              value: 0,
              error: {
                sku: item.sku,
                quantity: item.quantity - addedQuantity,
                error: `Only ${addedQuantity} units available out of ${item.quantity} requested`
              }
            });
          }
        });
      } catch (error) {
        // If cart operation fails, mark all as failed
        available.forEach(({ item }) => {
          results.push({
            success: false,
            quantity: 0,
            value: 0,
            error: {
              sku: item.sku,
              quantity: item.quantity,
              error: 'Failed to add to cart'
            }
          });
        });
      }
    }

    // Add unavailable items to results
    unavailable.forEach(({ error }) => {
      results.push({
        success: false,
        quantity: 0,
        value: 0,
        error
      });
    });

    return results;
  }

  /**
   * Check item availability with retry logic
   */
  private async checkItemAvailability(
    item: BulkOrderRow
  ): Promise<{ available: boolean; availability?: ProductAvailability; error?: BulkProcessingError }> {
    // Check circuit breaker
    if (!this.circuitBreaker.canProceed()) {
      return {
        available: false,
        error: {
          sku: item.sku,
          quantity: item.quantity,
          error: 'Service temporarily unavailable (circuit breaker open)'
        }
      };
    }

    const retryResult = await this.retryHandler.executeWithRetry(
      async () => {
        const availability = await this.config.checkAvailability(item.sku);
        
        if (!availability.available || availability.quantity === 0) {
          throw new Error('Product not available');
        }

        return availability;
      },
      { sku: item.sku, operation: 'check_availability' }
    );

    if (retryResult.success && retryResult.result) {
      this.circuitBreaker.recordSuccess();
      const availability = retryResult.result;

      if (availability.quantity < item.quantity) {
        // Partial availability - will be handled in processBatch
        return {
          available: true,
          availability
        };
      }

      return {
        available: true,
        availability
      };
    } else {
      this.circuitBreaker.recordFailure();
      return {
        available: false,
        error: this.retryHandler.createEnhancedError(
          retryResult.error || new Error('Unknown error'),
          {
            sku: item.sku,
            attempts: retryResult.attempts,
            lastDelay: retryResult.finalDelay,
            operation: 'check_availability'
          }
        )
      };
    }
  }

  /**
   * Group items by priority
   */
  private groupByPriority(rows: BulkOrderRow[]): Record<string, BulkOrderRow[]> {
    return rows.reduce((groups, row) => {
      const priority = row.priority || 'normal';
      if (!groups[priority]) {
        groups[priority] = [];
      }
      groups[priority].push(row);
      return groups;
    }, {} as Record<string, BulkOrderRow[]>);
  }

  /**
   * Calculate processing status
   */
  private calculateStatus(
    totalItems: number,
    processedItems: number,
    successfulItems: number,
    failedItems: number,
    currentBatch: number,
    totalBatches: number,
    startTime: number
  ): BulkProcessingStatus {
    const elapsedTime = Date.now() - startTime;
    const itemsPerMs = processedItems / elapsedTime;
    const remainingItems = totalItems - processedItems;
    const estimatedTimeRemaining = remainingItems / itemsPerMs;

    return {
      totalItems,
      processedItems,
      successfulItems,
      failedItems,
      currentBatch,
      totalBatches,
      startTime,
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
      errors: []
    };
  }
}

/**
 * Create state update commands for bulk operations
 */
export function createBulkOperationCommands(result: BulkProcessingResult): StateUpdateCommand[] {
  const commands: StateUpdateCommand[] = [];

  // Update cart state
  commands.push({
    type: 'update_cart',
    path: ['bulkOrder'],
    value: {
      lastProcessed: new Date().toISOString(),
      itemsAdded: result.itemsAdded,
      totalValue: result.totalValue
    }
  });

  // Add metadata
  commands.push({
    type: 'add_metadata',
    path: ['bulkProcessing'],
    value: {
      processingTime: result.processingTime,
      successRate: result.itemsProcessed > 0 
        ? (result.itemsAdded / result.itemsProcessed) * 100 
        : 0,
      errors: result.errors.length,
      hasAlternatives: result.suggestions.size > 0
    }
  });

  // Add activity log
  commands.push({
    type: 'add_activity',
    path: [],
    value: {
      type: 'bulk_order_processed',
      timestamp: new Date().toISOString(),
      details: {
        itemsProcessed: result.itemsProcessed,
        itemsAdded: result.itemsAdded,
        itemsFailed: result.itemsFailed,
        totalQuantity: result.totalQuantity,
        totalValue: result.totalValue
      }
    }
  });

  return commands;
}