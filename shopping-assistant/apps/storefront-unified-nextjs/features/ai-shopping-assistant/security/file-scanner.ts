import { createHash } from 'crypto';
import { getAuditLogger, AuditEventType } from './audit-logger';

/**
 * File scan result
 */
export interface FileScanResult {
  safe: boolean;
  threats: FileThreat[];
  metadata: FileMetadata;
}

/**
 * File threat information
 */
export interface FileThreat {
  type: 'malware' | 'suspicious_pattern' | 'invalid_type' | 'oversized' | 'encrypted';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  pattern?: string;
}

/**
 * File metadata
 */
export interface FileMetadata {
  filename: string;
  size: number;
  mimeType: string;
  hash: string;
  extension: string;
  magicNumber?: string;
}

/**
 * File scanner configuration
 */
export interface FileScannerConfig {
  maxFileSizeMB?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  enableDeepScan?: boolean;
}

/**
 * Secure file scanner for uploads
 */
export class FileScanner {
  private readonly config: Required<FileScannerConfig>;
  private readonly auditLogger = getAuditLogger();

  // Known malicious patterns in files
  private readonly maliciousPatterns = {
    // Executable signatures
    executable: [
      { pattern: /^MZ/, description: 'Windows executable' },
      { pattern: /^ELF/, description: 'Linux executable' },
      { pattern: /^FeedFace|^CeFaEdFe/, description: 'Mac executable' }
    ],
    // Script signatures
    scripts: [
      { pattern: /<\?php/i, description: 'PHP script' },
      { pattern: /#!\/usr\/bin\/(perl|python|ruby|bash|sh)/, description: 'Shell script' },
      { pattern: /<script[^>]*>/i, description: 'JavaScript in file' }
    ],
    // Malware signatures (simplified examples)
    malware: [
      { pattern: /EICAR-STANDARD-ANTIVIRUS-TEST-FILE/, description: 'EICAR test virus' },
      { pattern: /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}/, description: 'EICAR signature' }
    ],
    // Archive bombs
    compression: [
      { pattern: /^PK[\x03\x04]/, description: 'ZIP archive' },
      { pattern: /^Rar!/, description: 'RAR archive' },
      { pattern: /^7z\xBC\xAF/, description: '7z archive' }
    ]
  };

  // Safe file signatures
  private readonly safeSignatures: Record<string, string[]> = {
    'text/csv': ['', '73,65,75,2C,71,75,61,6E,74,69,74,79'], // "sku,quantity"
    'text/plain': ['', '53,4B,55'], // "SKU"
    'application/vnd.ms-excel': ['D0,CF,11,E0,A1,B1,1A,E1'], // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['50,4B,03,04'] // XLSX
  };

  constructor(config: FileScannerConfig = {}) {
    this.config = {
      maxFileSizeMB: config.maxFileSizeMB || 5,
      allowedMimeTypes: config.allowedMimeTypes || ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      allowedExtensions: config.allowedExtensions || ['.csv', '.txt', '.xls', '.xlsx'],
      enableDeepScan: config.enableDeepScan ?? true
    };
  }

  /**
   * Scan a file for threats
   */
  async scanFile(
    file: File | Buffer,
    filename: string,
    userId?: string
  ): Promise<FileScanResult> {
    const threats: FileThreat[] = [];
    
    // Get file metadata
    const metadata = await this.extractMetadata(file, filename);

    // Check file size
    if (metadata.size > this.config.maxFileSizeMB * 1024 * 1024) {
      threats.push({
        type: 'oversized',
        severity: 'medium',
        description: `File size (${(metadata.size / 1024 / 1024).toFixed(2)}MB) exceeds limit of ${this.config.maxFileSizeMB}MB`
      });
    }

    // Check file extension
    if (!this.isAllowedExtension(metadata.extension)) {
      threats.push({
        type: 'invalid_type',
        severity: 'high',
        description: `File extension '${metadata.extension}' is not allowed`
      });
    }

    // Check MIME type
    if (!this.isAllowedMimeType(metadata.mimeType)) {
      threats.push({
        type: 'invalid_type',
        severity: 'high',
        description: `MIME type '${metadata.mimeType}' is not allowed`
      });
    }

    // Deep scan if enabled
    if (this.config.enableDeepScan && threats.length === 0) {
      const content = file instanceof File ? await file.arrayBuffer() : file;
      const deepScanThreats = await this.deepScan(Buffer.from(content), metadata);
      threats.push(...deepScanThreats);
    }

    // Log security event if threats found
    if (threats.length > 0) {
      await this.auditLogger.logSecurityEvent(
        AuditEventType.MALICIOUS_PAYLOAD_DETECTED,
        {
          userId,
          action: 'file_upload',
          threatDetails: {
            filename: metadata.filename,
            threats: threats.map(t => ({
              type: t.type,
              severity: t.severity,
              description: t.description
            })),
            metadata
          },
          blocked: true
        }
      );
    }

    return {
      safe: threats.length === 0,
      threats,
      metadata
    };
  }

  /**
   * Extract file metadata
   */
  private async extractMetadata(file: File | Buffer, filename: string): Promise<FileMetadata> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const size = file instanceof File ? file.size : buffer.length;
    const mimeType = file instanceof File ? file.type : 'application/octet-stream';
    
    // Calculate hash
    const hash = createHash('sha256').update(buffer).digest('hex');
    
    // Extract extension
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    
    // Get magic number (first 8 bytes)
    const magicNumber = buffer.length >= 8 
      ? buffer.subarray(0, 8).toString('hex').toUpperCase()
      : undefined;

    return {
      filename,
      size,
      mimeType,
      hash,
      extension,
      magicNumber
    };
  }

  /**
   * Perform deep content scan
   */
  private async deepScan(buffer: Buffer, metadata: FileMetadata): Promise<FileThreat[]> {
    const threats: FileThreat[] = [];
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024 * 100)); // First 100KB

    // Check for malicious patterns
    for (const [category, patterns] of Object.entries(this.maliciousPatterns)) {
      for (const { pattern, description } of patterns) {
        if (pattern.test(content)) {
          threats.push({
            type: category === 'malware' ? 'malware' : 'suspicious_pattern',
            severity: category === 'malware' ? 'critical' : 'high',
            description,
            pattern: pattern.toString()
          });
        }
      }
    }

    // Check for encrypted content
    if (this.isEncrypted(buffer)) {
      threats.push({
        type: 'encrypted',
        severity: 'medium',
        description: 'File appears to be encrypted or contains high entropy data'
      });
    }

    // Validate magic number matches MIME type
    if (metadata.magicNumber && !this.validateMagicNumber(metadata.mimeType, metadata.magicNumber)) {
      threats.push({
        type: 'invalid_type',
        severity: 'high',
        description: 'File signature does not match declared MIME type'
      });
    }

    return threats;
  }

  /**
   * Check if file extension is allowed
   */
  private isAllowedExtension(extension: string): boolean {
    return this.config.allowedExtensions.includes(extension.toLowerCase());
  }

  /**
   * Check if MIME type is allowed
   */
  private isAllowedMimeType(mimeType: string): boolean {
    return this.config.allowedMimeTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Check if content appears encrypted (high entropy)
   */
  private isEncrypted(buffer: Buffer): boolean {
    // Simple entropy calculation
    const bytes = Array.from(buffer.subarray(0, Math.min(buffer.length, 1024)));
    const frequency: Record<number, number> = {};
    
    for (const byte of bytes) {
      frequency[byte] = (frequency[byte] || 0) + 1;
    }

    let entropy = 0;
    const len = bytes.length;
    
    for (const count of Object.values(frequency)) {
      if (count > 0) {
        const probability = count / len;
        entropy -= probability * Math.log2(probability);
      }
    }

    // High entropy (> 7.5 bits) suggests encryption or compression
    return entropy > 7.5;
  }

  /**
   * Validate magic number matches MIME type
   */
  private validateMagicNumber(mimeType: string, magicNumber: string): boolean {
    const expectedSignatures = this.safeSignatures[mimeType];
    if (!expectedSignatures) return true; // Unknown type, can't validate

    // Empty signature is valid for text files
    if (expectedSignatures.includes('')) return true;

    // Check if magic number matches any expected signature
    return expectedSignatures.some(sig => 
      magicNumber.startsWith(sig.replace(/,/g, ''))
    );
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename: string): string {
    // Remove path components
    const basename = filename.split(/[/\\]/).pop() || 'unnamed';
    
    // Remove dangerous characters
    return basename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '_')
      .substring(0, 255); // Max filename length
  }

  /**
   * Generate safe storage path
   */
  generateSafeStoragePath(filename: string, userId?: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedName = this.sanitizeFilename(filename);
    const userPath = userId ? `${userId}/` : '';
    
    return `uploads/${userPath}${timestamp}-${randomId}-${sanitizedName}`;
  }
}

// Singleton instance
let fileScanner: FileScanner | null = null;

/**
 * Get or create file scanner instance
 */
export function getFileScanner(config?: FileScannerConfig): FileScanner {
  if (!fileScanner) {
    fileScanner = new FileScanner(config);
  }
  return fileScanner;
}