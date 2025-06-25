import { getAuditLogger, AuditEventType } from './audit-logger';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

/**
 * Bulk operation status
 */
export enum BulkOperationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK'
}

/**
 * Bulk operation item
 */
export interface BulkOperationItem {
  sku: string;
  quantity: number;
  price?: number;
  status: 'pending' | 'success' | 'failed';
  error?: string;
  orderId?: string;
  timestamp?: number;
}

/**
 * Bulk operation record
 */
export interface BulkOperationRecord {
  id: string;
  userId: string;
  accountId: string;
  status: BulkOperationStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  totalValue: number;
  items: BulkOperationItem[];
  metadata: {
    filename?: string;
    fileHash?: string;
    ipAddress?: string;
    userAgent?: string;
    notes?: string;
  };
  rollbackData?: {
    orderIds: string[];
    reversalIds?: string[];
    rollbackAt?: number;
    rollbackBy?: string;
    reason?: string;
  };
}

/**
 * Operation history configuration
 */
export interface OperationHistoryConfig {
  storageDir?: string;
  retentionDays?: number;
  maxRecordsPerUser?: number;
  enableAutoRollback?: boolean;
  rollbackWindowHours?: number;
}

/**
 * Bulk operation history service
 */
export class BulkOperationHistory {
  private readonly config: Required<OperationHistoryConfig>;
  private readonly auditLogger = getAuditLogger();
  private readonly recordCache = new Map<string, BulkOperationRecord>();

  constructor(config: OperationHistoryConfig = {}) {
    this.config = {
      storageDir: config.storageDir || process.env.BULK_HISTORY_DIR || './bulk-operation-history',
      retentionDays: config.retentionDays || 90,
      maxRecordsPerUser: config.maxRecordsPerUser || 1000,
      enableAutoRollback: config.enableAutoRollback ?? true,
      rollbackWindowHours: config.rollbackWindowHours || 24
    };

    this.initializeStorage();
  }

  /**
   * Create a new bulk operation record
   */
  async createOperation(
    userId: string,
    accountId: string,
    items: Array<{ sku: string; quantity: number; price?: number }>,
    metadata?: Record<string, any>
  ): Promise<string> {
    const operationId = this.generateOperationId();
    
    const record: BulkOperationRecord = {
      id: operationId,
      userId,
      accountId,
      status: BulkOperationStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalItems: items.length,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      totalValue: items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0),
      items: items.map(item => ({
        ...item,
        status: 'pending' as const
      })),
      metadata: metadata || {}
    };

    await this.saveRecord(record);
    this.recordCache.set(operationId, record);

    await this.auditLogger.logEvent(AuditEventType.BULK_UPLOAD_START, {
      userId,
      accountId,
      action: 'bulk_operation.create',
      resource: operationId,
      result: 'success',
      details: {
        totalItems: record.totalItems,
        totalValue: record.totalValue
      }
    });

    return operationId;
  }

  /**
   * Update operation progress
   */
  async updateProgress(
    operationId: string,
    processedItem: {
      sku: string;
      success: boolean;
      orderId?: string;
      error?: string;
    }
  ): Promise<void> {
    const record = await this.getRecord(operationId);
    if (!record) {
      throw new Error(`Operation ${operationId} not found`);
    }

    // Update item status
    const item = record.items.find(i => i.sku === processedItem.sku);
    if (item) {
      item.status = processedItem.success ? 'success' : 'failed';
      item.orderId = processedItem.orderId;
      item.error = processedItem.error;
      item.timestamp = Date.now();
    }

    // Update counters
    record.processedItems++;
    if (processedItem.success) {
      record.successfulItems++;
    } else {
      record.failedItems++;
    }
    record.updatedAt = Date.now();

    // Update status if all items processed
    if (record.processedItems === record.totalItems) {
      record.status = record.failedItems === 0 
        ? BulkOperationStatus.COMPLETED 
        : BulkOperationStatus.FAILED;
      record.completedAt = Date.now();

      // Log completion
      await this.auditLogger.logEvent(
        record.status === BulkOperationStatus.COMPLETED 
          ? AuditEventType.BULK_UPLOAD_SUCCESS
          : AuditEventType.BULK_UPLOAD_FAILURE,
        {
          userId: record.userId,
          accountId: record.accountId,
          action: 'bulk_operation.complete',
          resource: operationId,
          result: record.status === BulkOperationStatus.COMPLETED ? 'success' : 'failure',
          details: {
            totalItems: record.totalItems,
            successfulItems: record.successfulItems,
            failedItems: record.failedItems,
            duration: record.completedAt - record.createdAt
          }
        }
      );
    }

    await this.saveRecord(record);
  }

  /**
   * Get operation record
   */
  async getRecord(operationId: string): Promise<BulkOperationRecord | null> {
    // Check cache first
    if (this.recordCache.has(operationId)) {
      return this.recordCache.get(operationId)!;
    }

    // Load from disk
    try {
      const filePath = this.getRecordPath(operationId);
      const content = await fs.readFile(filePath, 'utf8');
      const record = JSON.parse(content) as BulkOperationRecord;
      
      // Cache for future access
      this.recordCache.set(operationId, record);
      
      return record;
    } catch (error) {
      return null;
    }
  }

  /**
   * List operations for user
   */
  async listUserOperations(
    userId: string,
    filters?: {
      status?: BulkOperationStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<BulkOperationRecord[]> {
    const userDir = path.join(this.config.storageDir, userId);
    
    try {
      const files = await fs.readdir(userDir);
      const operations: BulkOperationRecord[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(userDir, file), 'utf8');
          const record = JSON.parse(content) as BulkOperationRecord;
          
          // Apply filters
          if (filters?.status && record.status !== filters.status) continue;
          if (filters?.startDate && record.createdAt < filters.startDate.getTime()) continue;
          if (filters?.endDate && record.createdAt > filters.endDate.getTime()) continue;
          
          operations.push(record);
        }
      }

      // Sort by creation date (newest first)
      operations.sort((a, b) => b.createdAt - a.createdAt);

      // Apply limit
      if (filters?.limit) {
        return operations.slice(0, filters.limit);
      }

      return operations;
    } catch (error) {
      return [];
    }
  }

  /**
   * Rollback an operation
   */
  async rollbackOperation(
    operationId: string,
    rollbackBy: string,
    reason: string,
    sdk: any // Alokai SDK instance
  ): Promise<{
    success: boolean;
    reversedItems: number;
    errors: string[];
  }> {
    const record = await this.getRecord(operationId);
    if (!record) {
      throw new Error(`Operation ${operationId} not found`);
    }

    // Check if operation can be rolled back
    if (record.status !== BulkOperationStatus.COMPLETED) {
      throw new Error('Only completed operations can be rolled back');
    }

    if (record.rollbackData?.rollbackAt) {
      throw new Error('Operation has already been rolled back');
    }

    // Check rollback window
    const hoursSinceCompletion = (Date.now() - (record.completedAt || 0)) / (1000 * 60 * 60);
    if (hoursSinceCompletion > this.config.rollbackWindowHours) {
      throw new Error(`Rollback window (${this.config.rollbackWindowHours} hours) has expired`);
    }

    const errors: string[] = [];
    const reversalIds: string[] = [];
    let reversedItems = 0;

    // Process rollback for each successful item
    for (const item of record.items) {
      if (item.status === 'success' && item.orderId) {
        try {
          // Cancel/reverse the order through UDL
          const result = await sdk.unified.cancelOrder({
            orderId: item.orderId,
            reason: `Bulk operation rollback: ${reason}`
          });
          
          if (result.success) {
            reversalIds.push(result.reversalId || item.orderId);
            reversedItems++;
          } else {
            errors.push(`Failed to reverse order ${item.orderId}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Error reversing order ${item.orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Update record with rollback information
    record.status = BulkOperationStatus.ROLLED_BACK;
    record.rollbackData = {
      orderIds: record.items.filter(i => i.orderId).map(i => i.orderId!),
      reversalIds,
      rollbackAt: Date.now(),
      rollbackBy,
      reason
    };

    await this.saveRecord(record);

    // Log rollback
    await this.auditLogger.logEvent(AuditEventType.BULK_UPLOAD_SUCCESS, {
      userId: rollbackBy,
      accountId: record.accountId,
      action: 'bulk_operation.rollback',
      resource: operationId,
      result: errors.length === 0 ? 'success' : 'failure',
      details: {
        reversedItems,
        totalItems: record.successfulItems,
        errors: errors.slice(0, 5), // Log first 5 errors
        reason
      }
    });

    return {
      success: errors.length === 0,
      reversedItems,
      errors
    };
  }

  /**
   * Get rollback eligibility
   */
  async checkRollbackEligibility(operationId: string): Promise<{
    eligible: boolean;
    reason?: string;
    hoursRemaining?: number;
  }> {
    const record = await this.getRecord(operationId);
    if (!record) {
      return { eligible: false, reason: 'Operation not found' };
    }

    if (record.status !== BulkOperationStatus.COMPLETED) {
      return { eligible: false, reason: 'Only completed operations can be rolled back' };
    }

    if (record.rollbackData?.rollbackAt) {
      return { eligible: false, reason: 'Operation has already been rolled back' };
    }

    const hoursSinceCompletion = (Date.now() - (record.completedAt || 0)) / (1000 * 60 * 60);
    if (hoursSinceCompletion > this.config.rollbackWindowHours) {
      return { 
        eligible: false, 
        reason: `Rollback window (${this.config.rollbackWindowHours} hours) has expired` 
      };
    }

    return {
      eligible: true,
      hoursRemaining: this.config.rollbackWindowHours - hoursSinceCompletion
    };
  }

  /**
   * Clean up old records
   */
  async cleanupOldRecords(): Promise<number> {
    const cutoffDate = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    try {
      const userDirs = await fs.readdir(this.config.storageDir);
      
      for (const userDir of userDirs) {
        const userPath = path.join(this.config.storageDir, userDir);
        const stat = await fs.stat(userPath);
        
        if (stat.isDirectory()) {
          const files = await fs.readdir(userPath);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(userPath, file);
              const content = await fs.readFile(filePath, 'utf8');
              const record = JSON.parse(content) as BulkOperationRecord;
              
              if (record.createdAt < cutoffDate) {
                await fs.unlink(filePath);
                deletedCount++;
                
                // Remove from cache
                this.recordCache.delete(record.id);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old records:', error);
    }

    return deletedCount;
  }

  /**
   * Initialize storage directory
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.config.storageDir, { recursive: true });
      
      // Schedule cleanup
      setInterval(() => {
        this.cleanupOldRecords().catch(console.error);
      }, 24 * 60 * 60 * 1000); // Daily
    } catch (error) {
      console.error('Failed to initialize operation history storage:', error);
    }
  }

  /**
   * Save record to disk
   */
  private async saveRecord(record: BulkOperationRecord): Promise<void> {
    const filePath = this.getRecordPath(record.id);
    const dir = path.dirname(filePath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf8');
    
    // Update cache
    this.recordCache.set(record.id, record);
  }

  /**
   * Get record file path
   */
  private getRecordPath(operationId: string): string {
    // Extract user ID from operation ID (format: timestamp-userId-random)
    const parts = operationId.split('-');
    const userId = parts[1] || 'unknown';
    
    return path.join(this.config.storageDir, userId, `${operationId}.json`);
  }

  /**
   * Generate operation ID
   */
  private generateOperationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }
}

// Singleton instance
let operationHistory: BulkOperationHistory | null = null;

/**
 * Get or create operation history instance
 */
export function getBulkOperationHistory(): BulkOperationHistory {
  if (!operationHistory) {
    operationHistory = new BulkOperationHistory();
  }
  return operationHistory;
}