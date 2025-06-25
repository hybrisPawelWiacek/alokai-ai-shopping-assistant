import { CSVBulkOrderParser, type BulkOrderRow, type CSVParseResult, type CSVParseError } from './csv-parser';
import { getAuditLogger, AuditEventType } from '../security/audit-logger';
import { z } from 'zod';

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  safe: boolean;
  threats: SecurityThreat[];
  sanitizedRows?: BulkOrderRow[];
}

/**
 * Security threat detected in CSV
 */
export interface SecurityThreat {
  row: number;
  column: string;
  threatType: 'sql_injection' | 'script_injection' | 'path_traversal' | 'command_injection' | 'excessive_length' | 'invalid_encoding';
  value: string;
  message: string;
}

/**
 * Enhanced CSV parser with security features
 */
export class SecureCSVBulkOrderParser extends CSVBulkOrderParser {
  private readonly auditLogger = getAuditLogger();
  
  // Security patterns
  private readonly threatPatterns = {
    sql_injection: [
      /(\b)(union|select|insert|update|delete|drop|create|alter|exec|execute|script|declare|cast|convert)(\s)/gi,
      /(\b)(table|database|schema|column|procedure|function|trigger|view)(\s)/gi,
      /(--|\/\*|\*\/|;|'|")/g,
      /(\b)(xp_|sp_|sys\.|information_schema)/gi
    ],
    script_injection: [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on(load|error|click|mouse|key|submit|focus|blur)=/gi,
      /<[^>]+\s+[^>]*\bon[a-z]+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ],
    path_traversal: [
      /\.\.[\/\\]/g,
      /\.\.%2[fF]/g,
      /\.\.%5[cC]/g,
      /%2e%2e[\/\\]/gi,
      /\/etc\/(passwd|shadow|hosts)/gi,
      /[cC]:\\.*\\system32/gi
    ],
    command_injection: [
      /[;&|`$(){}[\]<>]/g,
      /\$\(.*\)/g,
      /`.*`/g,
      /\|\|/g,
      /&&/g,
      /\n|\r/g
    ]
  };

  // Maximum field lengths
  private readonly maxFieldLengths = {
    sku: 100,
    notes: 500,
    referenceId: 100,
    priority: 10
  };

  /**
   * Parse CSV with security validation
   */
  async parseStringSecure(
    content: string,
    userId?: string,
    accountId?: string
  ): Promise<CSVParseResult & { securityThreats?: SecurityThreat[] }> {
    // First, validate the entire content
    const contentThreats = this.validateContent(content);
    if (contentThreats.length > 0) {
      await this.auditLogger.logSecurityEvent(
        AuditEventType.MALICIOUS_PAYLOAD_DETECTED,
        {
          userId,
          action: 'csv_upload',
          threatDetails: {
            threatCount: contentThreats.length,
            threats: contentThreats.slice(0, 5) // Log first 5 threats
          },
          blocked: true
        }
      );

      return {
        success: false,
        rows: [],
        errors: contentThreats.map(t => ({
          row: 0,
          column: 'content',
          message: `Security threat detected: ${t.message}`
        })),
        summary: {
          totalRows: 0,
          validRows: 0,
          errorRows: 0,
          totalQuantity: 0,
          uniqueSkus: 0
        },
        securityThreats: contentThreats
      };
    }

    // Parse with base parser
    const result = await super.parseString(content);

    // Validate each row for security threats
    const securityValidation = await this.validateRowsSecurity(result.rows);
    
    if (!securityValidation.safe) {
      await this.auditLogger.logSecurityEvent(
        AuditEventType.MALICIOUS_PAYLOAD_DETECTED,
        {
          userId,
          action: 'csv_row_validation',
          threatDetails: {
            threatCount: securityValidation.threats.length,
            threats: securityValidation.threats
          },
          blocked: true
        }
      );

      // Add security errors to result
      const securityErrors: CSVParseError[] = securityValidation.threats.map(t => ({
        row: t.row,
        column: t.column,
        value: t.value,
        message: t.message
      }));

      return {
        ...result,
        success: false,
        errors: [...result.errors, ...securityErrors],
        securityThreats: securityValidation.threats
      };
    }

    // Return sanitized result
    return {
      ...result,
      rows: securityValidation.sanitizedRows || result.rows
    };
  }

  /**
   * Validate entire content for threats
   */
  private validateContent(content: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // Check content size (max 5MB)
    if (content.length > 5 * 1024 * 1024) {
      threats.push({
        row: 0,
        column: 'content',
        threatType: 'excessive_length',
        value: `${content.length} bytes`,
        message: 'Content exceeds maximum allowed size of 5MB'
      });
    }

    // Check for binary content
    if (this.containsBinaryData(content)) {
      threats.push({
        row: 0,
        column: 'content',
        threatType: 'invalid_encoding',
        value: 'binary data detected',
        message: 'CSV contains binary data'
      });
    }

    return threats;
  }

  /**
   * Validate rows for security threats
   */
  private async validateRowsSecurity(rows: BulkOrderRow[]): Promise<SecurityValidationResult> {
    const threats: SecurityThreat[] = [];
    const sanitizedRows: BulkOrderRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;
      let hasThreats = false;

      // Check each field
      for (const [field, value] of Object.entries(row)) {
        if (typeof value !== 'string') continue;

        // Check field length
        const maxLength = this.maxFieldLengths[field as keyof typeof this.maxFieldLengths];
        if (maxLength && value.length > maxLength) {
          threats.push({
            row: rowNumber,
            column: field,
            threatType: 'excessive_length',
            value: value.substring(0, 50) + '...',
            message: `Field exceeds maximum length of ${maxLength} characters`
          });
          hasThreats = true;
        }

        // Check for threat patterns
        for (const [threatType, patterns] of Object.entries(this.threatPatterns)) {
          for (const pattern of patterns) {
            if (pattern.test(value)) {
              threats.push({
                row: rowNumber,
                column: field,
                threatType: threatType as SecurityThreat['threatType'],
                value: value.substring(0, 50),
                message: `Potential ${threatType.replace('_', ' ')} detected`
              });
              hasThreats = true;
              break;
            }
          }
        }
      }

      // Add sanitized row if no threats
      if (!hasThreats) {
        sanitizedRows.push(this.sanitizeRow(row));
      }
    }

    return {
      safe: threats.length === 0,
      threats,
      sanitizedRows
    };
  }

  /**
   * Sanitize a row
   */
  private sanitizeRow(row: BulkOrderRow): BulkOrderRow {
    return {
      sku: this.sanitizeString(row.sku, 'alphanumeric'),
      quantity: row.quantity,
      notes: row.notes ? this.sanitizeString(row.notes, 'text') : undefined,
      referenceId: row.referenceId ? this.sanitizeString(row.referenceId, 'alphanumeric') : undefined,
      priority: row.priority
    };
  }

  /**
   * Sanitize string based on type
   */
  private sanitizeString(input: string, type: 'alphanumeric' | 'text'): string {
    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    if (type === 'alphanumeric') {
      // Keep only alphanumeric, dash, underscore
      sanitized = sanitized.replace(/[^a-zA-Z0-9\-_]/g, '');
    } else {
      // For text, escape HTML entities
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }

    return sanitized;
  }

  /**
   * Check if content contains binary data
   */
  private containsBinaryData(content: string): boolean {
    // Check for null bytes
    if (content.includes('\0')) return true;

    // Check for excessive control characters
    const controlChars = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
    if (controlChars && controlChars.length > content.length * 0.01) {
      return true;
    }

    // Check for invalid UTF-8 sequences
    try {
      Buffer.from(content, 'utf8').toString('utf8');
    } catch {
      return true;
    }

    return false;
  }

  /**
   * Validate CSV headers for required columns
   */
  async validateHeaders(headers: string[]): Promise<{
    valid: boolean;
    missingColumns: string[];
    extraColumns: string[];
  }> {
    const requiredColumns = ['sku', 'quantity'];
    const allowedColumns = ['sku', 'quantity', 'notes', 'reference', 'priority'];

    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    const missingColumns = requiredColumns.filter(
      col => !normalizedHeaders.some(h => h.includes(col))
    );

    const extraColumns = normalizedHeaders.filter(
      h => !allowedColumns.some(allowed => h.includes(allowed))
    );

    return {
      valid: missingColumns.length === 0,
      missingColumns,
      extraColumns
    };
  }

  /**
   * Generate secure CSV export
   */
  generateSecureCSV(rows: BulkOrderRow[]): string {
    const headers = ['SKU', 'Quantity', 'Notes', 'Reference', 'Priority'];
    const sanitizedRows = rows.map(row => this.sanitizeRow(row));
    
    const csvRows = [
      headers.join(','),
      ...sanitizedRows.map(row => [
        this.escapeCSVField(row.sku),
        row.quantity.toString(),
        this.escapeCSVField(row.notes || ''),
        this.escapeCSVField(row.referenceId || ''),
        row.priority || 'normal'
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  /**
   * Escape CSV field
   */
  private escapeCSVField(field: string): string {
    // If field contains comma, newline, or quotes, wrap in quotes
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      // Escape quotes by doubling them
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}