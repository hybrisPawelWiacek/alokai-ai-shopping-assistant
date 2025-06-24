import type { BulkProcessingStatus } from './bulk-processor';

/**
 * Progress update event for streaming
 */
export interface ProgressUpdateEvent {
  type: 'progress';
  data: {
    status: BulkProcessingStatus;
    percentage: number;
    message: string;
    phase: 'parsing' | 'validating' | 'processing' | 'finalizing';
  };
}

/**
 * Item processed event
 */
export interface ItemProcessedEvent {
  type: 'item_processed';
  data: {
    sku: string;
    success: boolean;
    quantity: number;
    error?: string;
    alternative?: {
      sku: string;
      name: string;
      reason: string;
    };
  };
}

/**
 * Batch completed event
 */
export interface BatchCompletedEvent {
  type: 'batch_completed';
  data: {
    batchNumber: number;
    totalBatches: number;
    itemsInBatch: number;
    successCount: number;
    failureCount: number;
  };
}

/**
 * Completion event
 */
export interface CompletionEvent {
  type: 'completed';
  data: {
    success: boolean;
    totalProcessed: number;
    totalAdded: number;
    totalFailed: number;
    processingTime: number;
    totalValue: number;
    hasAlternatives: boolean;
  };
}

export type BulkProgressEvent = 
  | ProgressUpdateEvent 
  | ItemProcessedEvent 
  | BatchCompletedEvent 
  | CompletionEvent;

/**
 * Creates a progress stream for bulk operations
 */
export class BulkProgressStreamer {
  private encoder = new TextEncoder();
  private startTime = Date.now();
  private lastUpdate = 0;
  private updateInterval = 100; // ms between updates

  /**
   * Create a readable stream for progress updates
   */
  createProgressStream(): ReadableStream<Uint8Array> {
    let controller: ReadableStreamDefaultController;

    return new ReadableStream({
      start(ctrl) {
        controller = ctrl;
      },

      cancel() {
        // Cleanup if needed
      }
    });
  }

  /**
   * Send progress update (throttled)
   */
  sendProgress(
    controller: ReadableStreamDefaultController,
    status: BulkProcessingStatus,
    phase: 'parsing' | 'validating' | 'processing' | 'finalizing'
  ): void {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) {
      return; // Throttle updates
    }
    this.lastUpdate = now;

    const percentage = status.totalItems > 0 
      ? Math.round((status.processedItems / status.totalItems) * 100)
      : 0;

    const message = this.getProgressMessage(phase, status);

    const event: ProgressUpdateEvent = {
      type: 'progress',
      data: {
        status,
        percentage,
        message,
        phase
      }
    };

    this.sendEvent(controller, event);
  }

  /**
   * Send item processed event
   */
  sendItemProcessed(
    controller: ReadableStreamDefaultController,
    result: {
      sku: string;
      success: boolean;
      quantity: number;
      error?: string;
      alternative?: { sku: string; name: string; reason: string };
    }
  ): void {
    const event: ItemProcessedEvent = {
      type: 'item_processed',
      data: result
    };

    this.sendEvent(controller, event);
  }

  /**
   * Send batch completed event
   */
  sendBatchCompleted(
    controller: ReadableStreamDefaultController,
    batchInfo: {
      batchNumber: number;
      totalBatches: number;
      itemsInBatch: number;
      successCount: number;
      failureCount: number;
    }
  ): void {
    const event: BatchCompletedEvent = {
      type: 'batch_completed',
      data: batchInfo
    };

    this.sendEvent(controller, event);
  }

  /**
   * Send completion event
   */
  sendCompletion(
    controller: ReadableStreamDefaultController,
    result: {
      success: boolean;
      totalProcessed: number;
      totalAdded: number;
      totalFailed: number;
      totalValue: number;
      hasAlternatives: boolean;
    }
  ): void {
    const processingTime = Date.now() - this.startTime;

    const event: CompletionEvent = {
      type: 'completed',
      data: {
        ...result,
        processingTime
      }
    };

    this.sendEvent(controller, event);
    controller.close();
  }

  /**
   * Send SSE formatted event
   */
  private sendEvent(
    controller: ReadableStreamDefaultController,
    event: BulkProgressEvent
  ): void {
    const sseData = this.formatSSE(event);
    controller.enqueue(this.encoder.encode(sseData));
  }

  /**
   * Format event as SSE
   */
  private formatSSE(event: BulkProgressEvent): string {
    return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  }

  /**
   * Get human-readable progress message
   */
  private getProgressMessage(
    phase: 'parsing' | 'validating' | 'processing' | 'finalizing',
    status: BulkProcessingStatus
  ): string {
    switch (phase) {
      case 'parsing':
        return 'Parsing CSV file...';
      
      case 'validating':
        return `Validating ${status.totalItems} items...`;
      
      case 'processing':
        const eta = status.estimatedTimeRemaining > 0
          ? ` (ETA: ${this.formatTime(status.estimatedTimeRemaining)})`
          : '';
        return `Processing batch ${status.currentBatch}/${status.totalBatches}${eta}`;
      
      case 'finalizing':
        return 'Finalizing order...';
      
      default:
        return 'Processing...';
    }
  }

  /**
   * Format time in human-readable format
   */
  private formatTime(ms: number): string {
    if (ms < 1000) return 'less than a second';
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return remainingSeconds > 0 
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }
}

/**
 * Client-side progress consumer (for reference)
 */
export async function* consumeProgressStream(
  response: Response
): AsyncGenerator<BulkProgressEvent, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep last incomplete line in buffer
      buffer = lines.pop() || '';

      let eventType = '';
      let eventData = '';
      
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7);
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6);
        } else if (line === '' && eventType && eventData) {
          // Empty line signals end of event
          yield {
            type: eventType as any,
            data: JSON.parse(eventData)
          };
          eventType = '';
          eventData = '';
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}