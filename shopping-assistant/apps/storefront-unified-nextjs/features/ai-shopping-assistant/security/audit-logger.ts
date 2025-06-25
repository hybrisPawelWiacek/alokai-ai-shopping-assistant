import { createHash, createHmac, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Audit event types for B2B operations
 */
export enum AuditEventType {
  // Authentication events
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTH_B2B_REQUIRED = 'AUTH_B2B_REQUIRED',
  
  // Bulk operation events
  BULK_UPLOAD_START = 'BULK_UPLOAD_START',
  BULK_UPLOAD_SUCCESS = 'BULK_UPLOAD_SUCCESS',
  BULK_UPLOAD_FAILURE = 'BULK_UPLOAD_FAILURE',
  BULK_VALIDATION_FAILURE = 'BULK_VALIDATION_FAILURE',
  
  // Security events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  MALICIOUS_PAYLOAD_DETECTED = 'MALICIOUS_PAYLOAD_DETECTED',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  
  // Business rule events
  ORDER_LIMIT_EXCEEDED = 'ORDER_LIMIT_EXCEEDED',
  CREDIT_LIMIT_EXCEEDED = 'CREDIT_LIMIT_EXCEEDED',
  INVALID_SKU_PATTERN = 'INVALID_SKU_PATTERN'
}

/**
 * Audit event severity levels
 */
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  accountId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource?: string;
  result: 'success' | 'failure';
  details?: Record<string, any>;
  errorMessage?: string;
  affectedRecords?: number;
  dataIntegrity?: {
    checksum: string;
    previousEntryId?: string;
  };
}

/**
 * Signed audit log entry with integrity protection
 */
export interface SignedAuditLogEntry extends AuditLogEntry {
  signature: string;
  signatureAlgorithm: string;
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  logDirectory?: string;
  rotationSizeMB?: number;
  retentionDays?: number;
  signatureSecret?: string;
  enableConsoleOutput?: boolean;
}

/**
 * Secure audit logger for B2B operations
 */
export class AuditLogger {
  private readonly config: Required<AuditLoggerConfig>;
  private currentLogFile: string;
  private logFileHandle?: fs.FileHandle;
  private previousEntryId?: string;

  constructor(config: AuditLoggerConfig = {}) {
    this.config = {
      logDirectory: config.logDirectory || process.env.AUDIT_LOG_DIR || './audit-logs',
      rotationSizeMB: config.rotationSizeMB || 100,
      retentionDays: config.retentionDays || 365,
      signatureSecret: config.signatureSecret || process.env.AUDIT_SECRET || this.generateSecret(),
      enableConsoleOutput: config.enableConsoleOutput ?? (process.env.NODE_ENV === 'development')
    };
    
    this.currentLogFile = this.getCurrentLogFileName();
    this.initializeLogger();
  }

  /**
   * Log an audit event
   */
  async logEvent(
    eventType: AuditEventType,
    data: {
      userId?: string;
      sessionId?: string;
      accountId?: string;
      ipAddress?: string;
      userAgent?: string;
      action: string;
      resource?: string;
      result: 'success' | 'failure';
      details?: Record<string, any>;
      errorMessage?: string;
      affectedRecords?: number;
    }
  ): Promise<string> {
    const entry: AuditLogEntry = {
      id: this.generateEntryId(),
      timestamp: Date.now(),
      eventType,
      severity: this.determineSeverity(eventType, data.result),
      ...data,
      dataIntegrity: {
        checksum: '',
        previousEntryId: this.previousEntryId
      }
    };

    // Calculate checksum
    entry.dataIntegrity!.checksum = this.calculateChecksum(entry);

    // Sign the entry
    const signedEntry = this.signEntry(entry);

    // Write to log
    await this.writeEntry(signedEntry);

    // Update previous entry ID for chaining
    this.previousEntryId = entry.id;

    // Console output for development
    if (this.config.enableConsoleOutput) {
      console.log('[AUDIT]', {
        eventType,
        severity: entry.severity,
        action: data.action,
        result: data.result,
        userId: data.userId
      });
    }

    return entry.id;
  }

  /**
   * Log a security event with high severity
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    threat: {
      userId?: string;
      ipAddress?: string;
      action: string;
      threatDetails: Record<string, any>;
      blocked: boolean;
    }
  ): Promise<string> {
    return this.logEvent(eventType, {
      userId: threat.userId,
      ipAddress: threat.ipAddress,
      action: threat.action,
      result: threat.blocked ? 'failure' : 'success',
      details: {
        ...threat.threatDetails,
        securityAction: threat.blocked ? 'BLOCKED' : 'ALLOWED',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Verify log integrity
   */
  async verifyIntegrity(startDate?: Date, endDate?: Date): Promise<{
    valid: boolean;
    errors: string[];
    entriesChecked: number;
  }> {
    const errors: string[] = [];
    let entriesChecked = 0;
    let previousId: string | undefined;

    try {
      const entries = await this.readEntries(startDate, endDate);
      
      for (const entry of entries) {
        entriesChecked++;
        
        // Verify signature
        if (!this.verifySignature(entry)) {
          errors.push(`Invalid signature for entry ${entry.id}`);
        }

        // Verify checksum
        const expectedChecksum = this.calculateChecksum(entry);
        if (entry.dataIntegrity?.checksum !== expectedChecksum) {
          errors.push(`Invalid checksum for entry ${entry.id}`);
        }

        // Verify chain
        if (previousId && entry.dataIntegrity?.previousEntryId !== previousId) {
          errors.push(`Broken chain at entry ${entry.id}`);
        }

        previousId = entry.id;
      }

      return {
        valid: errors.length === 0,
        errors,
        entriesChecked
      };
    } catch (error) {
      errors.push(`Failed to verify integrity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        errors,
        entriesChecked
      };
    }
  }

  /**
   * Query audit logs
   */
  async queryLogs(
    filters: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      eventType?: AuditEventType;
      severity?: AuditSeverity;
      result?: 'success' | 'failure';
    }
  ): Promise<SignedAuditLogEntry[]> {
    const entries = await this.readEntries(filters.startDate, filters.endDate);
    
    return entries.filter(entry => {
      if (filters.userId && entry.userId !== filters.userId) return false;
      if (filters.eventType && entry.eventType !== filters.eventType) return false;
      if (filters.severity && entry.severity !== filters.severity) return false;
      if (filters.result && entry.result !== filters.result) return false;
      return true;
    });
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: Record<string, any>;
    securityEvents: SignedAuditLogEntry[];
    integrityCheck: { valid: boolean; errors: string[] };
  }> {
    const entries = await this.readEntries(startDate, endDate);
    const securityEvents = entries.filter(e => 
      e.severity === AuditSeverity.ERROR || 
      e.severity === AuditSeverity.CRITICAL
    );

    const summary = {
      totalEvents: entries.length,
      securityEvents: securityEvents.length,
      failedAuthentications: entries.filter(e => 
        e.eventType === AuditEventType.AUTH_FAILURE
      ).length,
      rateLimitViolations: entries.filter(e => 
        e.eventType === AuditEventType.RATE_LIMIT_EXCEEDED
      ).length,
      maliciousPayloads: entries.filter(e => 
        e.eventType === AuditEventType.MALICIOUS_PAYLOAD_DETECTED
      ).length,
      bulkOperations: {
        total: entries.filter(e => 
          e.eventType.startsWith('BULK_')
        ).length,
        successful: entries.filter(e => 
          e.eventType === AuditEventType.BULK_UPLOAD_SUCCESS
        ).length,
        failed: entries.filter(e => 
          e.eventType === AuditEventType.BULK_UPLOAD_FAILURE
        ).length
      }
    };

    const integrityCheck = await this.verifyIntegrity(startDate, endDate);

    return {
      summary,
      securityEvents,
      integrityCheck
    };
  }

  /**
   * Initialize the logger
   */
  private async initializeLogger(): Promise<void> {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.config.logDirectory, { recursive: true });
      
      // Open current log file
      const logPath = path.join(this.config.logDirectory, this.currentLogFile);
      this.logFileHandle = await fs.open(logPath, 'a');
      
      // Load previous entry ID for chaining
      await this.loadPreviousEntryId();
      
      // Schedule log rotation
      this.scheduleRotation();
      
      // Schedule retention cleanup
      this.scheduleRetentionCleanup();
    } catch (error) {
      console.error('Failed to initialize audit logger:', error);
      throw error;
    }
  }

  /**
   * Sign an audit log entry
   */
  private signEntry(entry: AuditLogEntry): SignedAuditLogEntry {
    const dataToSign = JSON.stringify({
      ...entry,
      signature: undefined
    });
    
    const signature = createHmac('sha256', this.config.signatureSecret)
      .update(dataToSign)
      .digest('hex');

    return {
      ...entry,
      signature,
      signatureAlgorithm: 'HMAC-SHA256'
    };
  }

  /**
   * Verify entry signature
   */
  private verifySignature(entry: SignedAuditLogEntry): boolean {
    const { signature, signatureAlgorithm, ...data } = entry;
    
    if (signatureAlgorithm !== 'HMAC-SHA256') {
      return false;
    }

    const dataToSign = JSON.stringify(data);
    const expectedSignature = createHmac('sha256', this.config.signatureSecret)
      .update(dataToSign)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Calculate entry checksum
   */
  private calculateChecksum(entry: AuditLogEntry): string {
    const data = JSON.stringify({
      ...entry,
      dataIntegrity: {
        ...entry.dataIntegrity,
        checksum: undefined
      }
    });
    
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Write entry to log file
   */
  private async writeEntry(entry: SignedAuditLogEntry): Promise<void> {
    if (!this.logFileHandle) {
      throw new Error('Log file not initialized');
    }

    const line = JSON.stringify(entry) + '\n';
    await this.logFileHandle.write(line, null, 'utf8');
    
    // Check if rotation is needed
    const stats = await this.logFileHandle.stat();
    if (stats.size > this.config.rotationSizeMB * 1024 * 1024) {
      await this.rotateLog();
    }
  }

  /**
   * Read entries from log files
   */
  private async readEntries(
    startDate?: Date,
    endDate?: Date
  ): Promise<SignedAuditLogEntry[]> {
    const entries: SignedAuditLogEntry[] = [];
    const logFiles = await this.getLogFiles(startDate, endDate);

    for (const file of logFiles) {
      const content = await fs.readFile(
        path.join(this.config.logDirectory, file),
        'utf8'
      );
      
      const lines = content.trim().split('\n');
      for (const line of lines) {
        if (line) {
          try {
            const entry = JSON.parse(line) as SignedAuditLogEntry;
            if (this.isInDateRange(entry.timestamp, startDate, endDate)) {
              entries.push(entry);
            }
          } catch (error) {
            console.error('Failed to parse audit log entry:', error);
          }
        }
      }
    }

    return entries.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Determine event severity
   */
  private determineSeverity(eventType: AuditEventType, result: 'success' | 'failure'): AuditSeverity {
    // Critical security events
    if ([
      AuditEventType.MALICIOUS_PAYLOAD_DETECTED,
      AuditEventType.UNAUTHORIZED_ACCESS
    ].includes(eventType)) {
      return AuditSeverity.CRITICAL;
    }

    // Error events
    if (result === 'failure' || [
      AuditEventType.AUTH_FAILURE,
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditEventType.CREDIT_LIMIT_EXCEEDED
    ].includes(eventType)) {
      return AuditSeverity.ERROR;
    }

    // Warning events
    if ([
      AuditEventType.FILE_SIZE_EXCEEDED,
      AuditEventType.ORDER_LIMIT_EXCEEDED,
      AuditEventType.INVALID_SKU_PATTERN
    ].includes(eventType)) {
      return AuditSeverity.WARNING;
    }

    return AuditSeverity.INFO;
  }

  /**
   * Generate unique entry ID
   */
  private generateEntryId(): string {
    return `${Date.now()}-${randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate secret if not provided
   */
  private generateSecret(): string {
    const secret = randomBytes(32).toString('hex');
    console.warn('Generated random audit secret. Set AUDIT_SECRET environment variable for production.');
    return secret;
  }

  /**
   * Get current log file name
   */
  private getCurrentLogFileName(): string {
    const date = new Date();
    return `audit-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
  }

  /**
   * Get log files in date range
   */
  private async getLogFiles(startDate?: Date, endDate?: Date): Promise<string[]> {
    const files = await fs.readdir(this.config.logDirectory);
    return files
      .filter(f => f.startsWith('audit-') && f.endsWith('.log'))
      .filter(f => {
        const match = f.match(/audit-(\d{4})-(\d{2})-(\d{2})\.log/);
        if (!match) return false;
        
        const fileDate = new Date(`${match[1]}-${match[2]}-${match[3]}`);
        if (startDate && fileDate < startDate) return false;
        if (endDate && fileDate > endDate) return false;
        return true;
      })
      .sort();
  }

  /**
   * Check if timestamp is in date range
   */
  private isInDateRange(timestamp: number, startDate?: Date, endDate?: Date): boolean {
    if (startDate && timestamp < startDate.getTime()) return false;
    if (endDate && timestamp > endDate.getTime()) return false;
    return true;
  }

  /**
   * Load previous entry ID for chaining
   */
  private async loadPreviousEntryId(): Promise<void> {
    try {
      const entries = await this.readEntries();
      if (entries.length > 0) {
        this.previousEntryId = entries[entries.length - 1].id;
      }
    } catch {
      // No previous entries
    }
  }

  /**
   * Rotate log file
   */
  private async rotateLog(): Promise<void> {
    if (this.logFileHandle) {
      await this.logFileHandle.close();
    }

    this.currentLogFile = this.getCurrentLogFileName();
    const logPath = path.join(this.config.logDirectory, this.currentLogFile);
    this.logFileHandle = await fs.open(logPath, 'a');
  }

  /**
   * Schedule log rotation check
   */
  private scheduleRotation(): void {
    // Check every hour
    setInterval(() => {
      const newFileName = this.getCurrentLogFileName();
      if (newFileName !== this.currentLogFile) {
        this.rotateLog().catch(console.error);
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Schedule retention cleanup
   */
  private scheduleRetentionCleanup(): void {
    // Run daily
    setInterval(async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
        
        const files = await fs.readdir(this.config.logDirectory);
        for (const file of files) {
          const match = file.match(/audit-(\d{4})-(\d{2})-(\d{2})\.log/);
          if (match) {
            const fileDate = new Date(`${match[1]}-${match[2]}-${match[3]}`);
            if (fileDate < cutoffDate) {
              await fs.unlink(path.join(this.config.logDirectory, file));
            }
          }
        }
      } catch (error) {
        console.error('Failed to cleanup old audit logs:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Close the logger
   */
  async close(): Promise<void> {
    if (this.logFileHandle) {
      await this.logFileHandle.close();
    }
  }
}

// Singleton instance
let auditLogger: AuditLogger | null = null;

/**
 * Get or create audit logger instance
 */
export function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    auditLogger = new AuditLogger();
  }
  return auditLogger;
}