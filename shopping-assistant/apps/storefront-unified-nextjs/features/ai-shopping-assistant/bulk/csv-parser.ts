import { parse } from 'csv-parse';
import { z } from 'zod';
import type { Readable } from 'stream';

/**
 * CSV row schema for B2B bulk orders
 */
export const bulkOrderRowSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
  referenceId: z.string().optional(),
  priority: z.enum(['high', 'normal', 'low']).optional().default('normal')
});

export type BulkOrderRow = z.infer<typeof bulkOrderRowSchema>;

/**
 * CSV parsing result
 */
export interface CSVParseResult {
  success: boolean;
  rows: BulkOrderRow[];
  errors: CSVParseError[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    totalQuantity: number;
    uniqueSkus: number;
  };
}

/**
 * CSV parsing error
 */
export interface CSVParseError {
  row: number;
  column?: string;
  value?: string;
  message: string;
}

/**
 * CSV parser configuration
 */
export interface CSVParserConfig {
  maxRows?: number;
  skipHeader?: boolean;
  delimiter?: string;
  encoding?: BufferEncoding;
  validateSku?: (sku: string) => Promise<boolean>;
}

/**
 * Parses CSV content for B2B bulk orders
 */
export class CSVBulkOrderParser {
  private config: Required<CSVParserConfig>;

  constructor(config: CSVParserConfig = {}) {
    this.config = {
      maxRows: config.maxRows || 1000,
      skipHeader: config.skipHeader ?? true,
      delimiter: config.delimiter || ',',
      encoding: config.encoding || 'utf-8',
      validateSku: config.validateSku || (() => Promise.resolve(true))
    };
  }

  /**
   * Parse CSV from string content
   */
  async parseString(content: string): Promise<CSVParseResult> {
    const errors: CSVParseError[] = [];
    const validRows: BulkOrderRow[] = [];
    let rowCount = 0;

    return new Promise((resolve, reject) => {
      parse(content, {
        delimiter: this.config.delimiter,
        columns: this.config.skipHeader ? true : false,
        skip_empty_lines: true,
        encoding: this.config.encoding,
        max_record_size: 1024, // 1KB per row max
        relax_quotes: true,
        trim: true
      })
        .on('data', async (row) => {
          rowCount++;
          
          // Check max rows limit
          if (rowCount > this.config.maxRows) {
            errors.push({
              row: rowCount,
              message: `Exceeded maximum row limit of ${this.config.maxRows}`
            });
            return;
          }

          // Validate row
          const validationResult = await this.validateRow(row, rowCount);
          if (validationResult.success) {
            validRows.push(validationResult.data);
          } else {
            errors.push(...validationResult.errors);
          }
        })
        .on('error', (err) => {
          reject(new Error(`CSV parsing failed: ${err.message}`));
        })
        .on('end', () => {
          resolve(this.createResult(validRows, errors, rowCount));
        });
    });
  }

  /**
   * Parse CSV from stream
   */
  async parseStream(stream: Readable): Promise<CSVParseResult> {
    const errors: CSVParseError[] = [];
    const validRows: BulkOrderRow[] = [];
    let rowCount = 0;

    return new Promise((resolve, reject) => {
      stream
        .pipe(
          parse({
            delimiter: this.config.delimiter,
            columns: this.config.skipHeader ? true : false,
            skip_empty_lines: true,
            encoding: this.config.encoding,
            max_record_size: 1024,
            relax_quotes: true,
            trim: true
          })
        )
        .on('data', async (row) => {
          rowCount++;
          
          if (rowCount > this.config.maxRows) {
            errors.push({
              row: rowCount,
              message: `Exceeded maximum row limit of ${this.config.maxRows}`
            });
            return;
          }

          const validationResult = await this.validateRow(row, rowCount);
          if (validationResult.success) {
            validRows.push(validationResult.data);
          } else {
            errors.push(...validationResult.errors);
          }
        })
        .on('error', (err) => {
          reject(new Error(`CSV parsing failed: ${err.message}`));
        })
        .on('end', () => {
          resolve(this.createResult(validRows, errors, rowCount));
        });
    });
  }

  /**
   * Parse CSV from Buffer
   */
  async parseBuffer(buffer: Buffer): Promise<CSVParseResult> {
    const content = buffer.toString(this.config.encoding);
    return this.parseString(content);
  }

  /**
   * Validate a single row
   */
  private async validateRow(
    row: Record<string, string>,
    rowNumber: number
  ): Promise<{ success: true; data: BulkOrderRow } | { success: false; errors: CSVParseError[] }> {
    const errors: CSVParseError[] = [];

    try {
      // Normalize column names (case-insensitive)
      const normalizedRow: Record<string, string> = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim();
        normalizedRow[normalizedKey] = row[key];
      });

      // Map common variations
      const mappedRow = {
        sku: normalizedRow.sku || normalizedRow.product || normalizedRow.item || normalizedRow.code || '',
        quantity: normalizedRow.quantity || normalizedRow.qty || normalizedRow.amount || '0',
        notes: normalizedRow.notes || normalizedRow.note || normalizedRow.comments || '',
        referenceId: normalizedRow.reference || normalizedRow.ref || normalizedRow.id || '',
        priority: normalizedRow.priority || 'normal'
      };

      // Validate with Zod
      const validated = bulkOrderRowSchema.parse(mappedRow);

      // Additional SKU validation
      if (this.config.validateSku) {
        const isValidSku = await this.config.validateSku(validated.sku);
        if (!isValidSku) {
          errors.push({
            row: rowNumber,
            column: 'sku',
            value: validated.sku,
            message: `Invalid SKU: ${validated.sku}`
          });
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => ({
          row: rowNumber,
          column: e.path.join('.'),
          value: String(e.input || ''),
          message: e.message
        })));
      } else {
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown validation error'
        });
      }
      return { success: false, errors };
    }
  }

  /**
   * Create parsing result summary
   */
  private createResult(
    validRows: BulkOrderRow[],
    errors: CSVParseError[],
    totalRows: number
  ): CSVParseResult {
    const uniqueSkus = new Set(validRows.map(r => r.sku)).size;
    const totalQuantity = validRows.reduce((sum, row) => sum + row.quantity, 0);

    return {
      success: errors.length === 0,
      rows: validRows,
      errors,
      summary: {
        totalRows,
        validRows: validRows.length,
        errorRows: errors.filter(e => e.row !== undefined).length,
        totalQuantity,
        uniqueSkus
      }
    };
  }
}

/**
 * Helper function to detect CSV delimiter
 */
export function detectDelimiter(sample: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const counts = delimiters.map(d => ({
    delimiter: d,
    count: (sample.match(new RegExp(d, 'g')) || []).length
  }));
  
  return counts.reduce((a, b) => a.count > b.count ? a : b).delimiter;
}

/**
 * Helper to generate CSV template
 */
export function generateCSVTemplate(): string {
  const headers = ['SKU', 'Quantity', 'Notes', 'Reference', 'Priority'];
  const examples = [
    ['PROD-001', '100', 'For warehouse A', 'PO-2024-001', 'high'],
    ['PROD-002', '50', 'Rush order', 'PO-2024-001', 'high'],
    ['PROD-003', '200', '', 'PO-2024-002', 'normal']
  ];
  
  return [
    headers.join(','),
    ...examples.map(row => row.join(','))
  ].join('\n');
}