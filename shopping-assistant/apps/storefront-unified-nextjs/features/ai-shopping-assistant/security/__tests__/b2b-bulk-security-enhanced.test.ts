import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { 
  getAuditLogger,
  getB2BAuthorization,
  getFileScanner,
  getVirusScanner,
  getBulkOperationHistory,
  getSecurityAlertService,
  SecurityAlertType,
  AlertSeverity,
  AuditEventType,
  BulkOperationStatus,
  VirusScanProvider
} from '../index';
import { promises as fs } from 'fs';
import path from 'path';

describe('B2B Bulk Operations Security Suite', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for tests
    tempDir = path.join(process.cwd(), 'temp-test', Date.now().toString());
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Virus Scanner Integration', () => {
    it('should detect malicious patterns in files', async () => {
      const scanner = getVirusScanner({
        provider: VirusScanProvider.HYBRID,
        tempDir
      });

      // Create a file with EICAR test string
      const eicarTest = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
      const testFile = Buffer.from(eicarTest);

      const result = await scanner.scanFile(testFile, 'test-virus.txt', 'test-user');

      expect(result.clean).toBe(false);
      expect(result.threats.length).toBeGreaterThan(0);
      expect(result.threats[0].type).toBe('malware');
    });

    it('should pass clean CSV files', async () => {
      const scanner = getVirusScanner({
        provider: VirusScanProvider.HYBRID,
        tempDir
      });

      const cleanCSV = 'sku,quantity,notes\nPROD-001,10,Test order\nPROD-002,5,Another item';
      const testFile = Buffer.from(cleanCSV);

      const result = await scanner.scanFile(testFile, 'clean.csv', 'test-user');

      expect(result.clean).toBe(true);
      expect(result.threats).toHaveLength(0);
    });
  });

  describe('Bulk Operation History', () => {
    it('should track operation lifecycle', async () => {
      const history = getBulkOperationHistory();
      
      // Create operation
      const operationId = await history.createOperation(
        'test-user',
        'test-account',
        [
          { sku: 'PROD-001', quantity: 10, price: 100 },
          { sku: 'PROD-002', quantity: 5, price: 200 }
        ],
        { filename: 'test.csv', notes: 'Test bulk order' }
      );

      expect(operationId).toBeTruthy();

      // Update progress
      await history.updateProgress(operationId, {
        sku: 'PROD-001',
        success: true,
        orderId: 'ORD-123'
      });

      // Get record
      const record = await history.getRecord(operationId);
      expect(record).toBeTruthy();
      expect(record?.processedItems).toBe(1);
      expect(record?.successfulItems).toBe(1);
      expect(record?.status).toBe(BulkOperationStatus.PROCESSING);

      // Complete operation
      await history.updateProgress(operationId, {
        sku: 'PROD-002',
        success: true,
        orderId: 'ORD-124'
      });

      const completedRecord = await history.getRecord(operationId);
      expect(completedRecord?.status).toBe(BulkOperationStatus.COMPLETED);
      expect(completedRecord?.processedItems).toBe(2);
      expect(completedRecord?.successfulItems).toBe(2);
    });

    it('should support rollback operations', async () => {
      const history = getBulkOperationHistory();
      
      // Create and complete operation
      const operationId = await history.createOperation(
        'test-user',
        'test-account',
        [{ sku: 'PROD-001', quantity: 10, price: 100 }]
      );

      await history.updateProgress(operationId, {
        sku: 'PROD-001',
        success: true,
        orderId: 'ORD-125'
      });

      // Mock SDK for rollback
      const mockSdk = {
        unified: {
          cancelOrder: jest.fn().mockResolvedValue({
            success: true,
            reversalId: 'REV-001'
          })
        }
      };

      // Check rollback eligibility
      const eligibility = await history.checkRollbackEligibility(operationId);
      expect(eligibility.eligible).toBe(true);

      // Perform rollback
      const rollbackResult = await history.rollbackOperation(
        operationId,
        'admin-user',
        'Customer requested cancellation',
        mockSdk
      );

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.reversedItems).toBe(1);
      expect(mockSdk.unified.cancelOrder).toHaveBeenCalledWith({
        orderId: 'ORD-125',
        reason: 'Bulk operation rollback: Customer requested cancellation'
      });

      // Verify operation status updated
      const rolledBackRecord = await history.getRecord(operationId);
      expect(rolledBackRecord?.status).toBe(BulkOperationStatus.ROLLED_BACK);
    });

    it('should list user operations with filters', async () => {
      const history = getBulkOperationHistory();
      
      // Create multiple operations
      for (let i = 0; i < 3; i++) {
        await history.createOperation(
          'test-user',
          'test-account',
          [{ sku: `PROD-${i}`, quantity: 1, price: 10 }]
        );
      }

      // List operations
      const operations = await history.listUserOperations('test-user', {
        limit: 2
      });

      expect(operations).toHaveLength(2);
      expect(operations[0].createdAt).toBeGreaterThan(operations[1].createdAt);
    });
  });

  describe('Security Alert Service', () => {
    it('should detect and alert on security patterns', async () => {
      const alertService = getSecurityAlertService();
      
      // Set up alert listener
      const alerts: any[] = [];
      alertService.on('alert', (alert) => {
        alerts.push(alert);
      });

      // Simulate multiple auth failures (credential stuffing pattern)
      for (let i = 0; i < 6; i++) {
        await alertService.monitorEvent({
          eventType: AuditEventType.AUTH_FAILURE,
          userId: 'attacker',
          ipAddress: '192.168.1.100'
        });
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe(SecurityAlertType.CREDENTIAL_STUFFING);
      expect(alerts[0].severity).toBe(AlertSeverity.HIGH);
    });

    it('should analyze user patterns for suspicious activity', async () => {
      const alertService = getSecurityAlertService();
      const auditLogger = getAuditLogger();

      // Create suspicious pattern
      const userId = 'suspicious-user';
      
      // Log various suspicious events
      await auditLogger.logEvent(AuditEventType.AUTH_FAILURE, {
        userId,
        action: 'login',
        result: 'failure'
      });

      await auditLogger.logEvent(AuditEventType.RATE_LIMIT_EXCEEDED, {
        userId,
        action: 'api_call',
        result: 'failure'
      });

      await auditLogger.logEvent(AuditEventType.MALICIOUS_PAYLOAD_DETECTED, {
        userId,
        action: 'file_upload',
        result: 'failure'
      });

      // Analyze patterns
      const analysis = await alertService.analyzePatterns(userId, 60);

      expect(analysis.suspicious).toBe(true);
      expect(analysis.patterns).toContain('Malicious payload attempts');
      expect(analysis.riskScore).toBeGreaterThan(50);
    });

    it('should trigger alerts for bulk operation attacks', async () => {
      const alertService = getSecurityAlertService();
      
      const alerts: any[] = [];
      alertService.on('alert', (alert) => {
        alerts.push(alert);
      });

      // Simulate malicious payload detection pattern
      for (let i = 0; i < 4; i++) {
        await alertService.monitorEvent({
          eventType: AuditEventType.MALICIOUS_PAYLOAD_DETECTED,
          userId: 'attacker',
          ipAddress: '10.0.0.1',
          details: {
            payload: `<script>alert('xss')</script>`,
            attemptNumber: i + 1
          }
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe(SecurityAlertType.BULK_ATTACK);
      expect(alerts[0].severity).toBe(AlertSeverity.CRITICAL);
      expect(alerts[0].details.recommendedActions).toContain('Temporarily disable bulk operations');
    });
  });

  describe('Audit Logger Compliance', () => {
    it('should maintain tamper-proof audit trail', async () => {
      const auditLogger = getAuditLogger();
      
      // Log series of events
      const eventIds: string[] = [];
      
      for (let i = 0; i < 5; i++) {
        const id = await auditLogger.logEvent(AuditEventType.BULK_UPLOAD_START, {
          userId: 'test-user',
          accountId: 'test-account',
          action: 'bulk_upload',
          result: 'success',
          details: { itemCount: i + 1 }
        });
        eventIds.push(id);
      }

      // Verify integrity
      const integrityCheck = await auditLogger.verifyIntegrity();
      
      expect(integrityCheck.valid).toBe(true);
      expect(integrityCheck.errors).toHaveLength(0);
      expect(integrityCheck.entriesChecked).toBeGreaterThanOrEqual(5);
    });

    it('should generate compliance reports', async () => {
      const auditLogger = getAuditLogger();
      
      // Create various events
      await auditLogger.logEvent(AuditEventType.AUTH_SUCCESS, {
        userId: 'user1',
        action: 'login',
        result: 'success'
      });

      await auditLogger.logSecurityEvent(AuditEventType.MALICIOUS_PAYLOAD_DETECTED, {
        userId: 'attacker',
        action: 'upload',
        threatDetails: { type: 'xss' },
        blocked: true
      });

      await auditLogger.logEvent(AuditEventType.BULK_UPLOAD_SUCCESS, {
        userId: 'user2',
        action: 'bulk_order',
        result: 'success',
        affectedRecords: 100
      });

      // Generate report
      const report = await auditLogger.generateComplianceReport(
        new Date(Date.now() - 3600000), // 1 hour ago
        new Date()
      );

      expect(report.summary.totalEvents).toBeGreaterThanOrEqual(3);
      expect(report.summary.securityEvents).toBeGreaterThanOrEqual(1);
      expect(report.summary.bulkOperations.total).toBeGreaterThanOrEqual(1);
      expect(report.integrityCheck.valid).toBe(true);
    });
  });

  describe('B2B Authorization with Business Rules', () => {
    it('should enforce order limits based on role', async () => {
      const b2bAuth = getB2BAuthorization();
      
      const buyerContext = {
        userId: 'buyer-001',
        accountId: 'account-001',
        role: 'BUYER',
        permissions: [b2bAuth.B2BPermission.BULK_ORDER_CREATE]
      };

      // Test within limits
      const withinLimits = await b2bAuth.authorizeBulkOperation(buyerContext, {
        type: 'create' as const,
        orderValue: 4000,
        itemCount: 50
      });

      expect(withinLimits.allowed).toBe(true);

      // Test exceeding limits
      const exceedingLimits = await b2bAuth.authorizeBulkOperation(buyerContext, {
        type: 'create' as const,
        orderValue: 6000, // Exceeds single order limit of 5000
        itemCount: 50
      });

      expect(exceedingLimits.allowed).toBe(false);
      expect(exceedingLimits.reason).toContain('single order limit');
    });

    it('should validate SKU patterns for B2B', async () => {
      const b2bAuth = getB2BAuthorization();
      
      process.env.B2B_SKU_PATTERN = '^[A-Z0-9-]+$';
      
      const context = {
        userId: 'user-001',
        accountId: 'account-001',
        role: 'BUYER' as const,
        permissions: []
      };

      // Valid SKUs
      const validResult = await b2bAuth.validateSKUPatterns(context, [
        'PROD-001',
        'ITEM-XYZ-123',
        'B2B-SPECIAL'
      ]);

      expect(validResult.valid).toBe(true);
      expect(validResult.invalidSKUs).toHaveLength(0);

      // Invalid SKUs
      const invalidResult = await b2bAuth.validateSKUPatterns(context, [
        'prod_001', // lowercase
        'ITEM@123', // special char
        'B2B ITEM'  // space
      ]);

      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.invalidSKUs).toHaveLength(3);
    });
  });

  describe('End-to-End Security Flow', () => {
    it('should handle complete secure bulk upload flow', async () => {
      // Initialize all services
      const auditLogger = getAuditLogger();
      const fileScanner = getFileScanner();
      const virusScanner = getVirusScanner({ tempDir });
      const b2bAuth = getB2BAuthorization();
      const operationHistory = getBulkOperationHistory();
      const alertService = getSecurityAlertService();

      // Monitor alerts
      const alerts: any[] = [];
      alertService.on('alert', (alert) => alerts.push(alert));

      // Simulate file upload
      const csvContent = 'sku,quantity,price\nPROD-001,10,100\nPROD-002,5,200';
      const file = Buffer.from(csvContent);

      // Step 1: File security scan
      const fileScan = await fileScanner.scanFile(file, 'order.csv', 'test-user');
      expect(fileScan.safe).toBe(true);

      // Step 2: Virus scan
      const virusScan = await virusScanner.scanFile(file, 'order.csv', 'test-user');
      expect(virusScan.clean).toBe(true);

      // Step 3: B2B authorization
      const userContext = {
        userId: 'test-user',
        accountId: 'test-account',
        role: 'PURCHASING_MANAGER' as const,
        permissions: [
          b2bAuth.B2BPermission.BULK_ORDER_CREATE,
          b2bAuth.B2BPermission.BULK_ORDER_APPROVE
        ]
      };

      const authResult = await b2bAuth.authorizeBulkOperation(userContext, {
        type: 'create' as const,
        orderValue: 1500,
        itemCount: 2
      });
      expect(authResult.allowed).toBe(true);

      // Step 4: Create operation record
      const operationId = await operationHistory.createOperation(
        userContext.userId,
        userContext.accountId,
        [
          { sku: 'PROD-001', quantity: 10, price: 100 },
          { sku: 'PROD-002', quantity: 5, price: 200 }
        ],
        { filename: 'order.csv' }
      );

      // Step 5: Process items
      await operationHistory.updateProgress(operationId, {
        sku: 'PROD-001',
        success: true,
        orderId: 'ORD-001'
      });

      await operationHistory.updateProgress(operationId, {
        sku: 'PROD-002',
        success: true,
        orderId: 'ORD-002'
      });

      // Step 6: Update statistics
      await b2bAuth.updateOrderStats(userContext.accountId, 1500);

      // Verify audit trail
      const auditEntries = await auditLogger.queryLogs({
        userId: userContext.userId,
        eventType: AuditEventType.BULK_UPLOAD_SUCCESS
      });

      expect(auditEntries.length).toBeGreaterThan(0);

      // Verify no security alerts
      expect(alerts).toHaveLength(0);

      // Verify operation completed
      const finalRecord = await operationHistory.getRecord(operationId);
      expect(finalRecord?.status).toBe(BulkOperationStatus.COMPLETED);
      expect(finalRecord?.successfulItems).toBe(2);
    });
  });
});