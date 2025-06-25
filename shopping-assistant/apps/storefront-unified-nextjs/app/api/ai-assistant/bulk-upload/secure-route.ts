import { NextRequest } from 'next/server';
import { BulkProgressStreamer } from '@/features/ai-shopping-assistant/bulk/streaming-progress';
import { SecureCSVBulkOrderParser } from '@/features/ai-shopping-assistant/bulk/secure-csv-parser';
import { BulkOrderProcessor, type BulkProcessingStatus } from '@/features/ai-shopping-assistant/bulk/bulk-processor';
import { B2BAlternativeSuggester } from '@/features/ai-shopping-assistant/bulk/alternative-suggester';
import { authenticateUser } from '../chat/auth';
import { rateLimiter } from '../chat/rate-limiter';
import { getSdk } from '@/sdk';
import { logger } from '../chat/logger';
import { getB2BAuthorization, B2BPermission } from '@/features/ai-shopping-assistant/security/b2b-authorization';
import { getFileScanner } from '@/features/ai-shopping-assistant/security/file-scanner';
import { getVirusScanner } from '@/features/ai-shopping-assistant/security/virus-scanner';
import { getAuditLogger, AuditEventType } from '@/features/ai-shopping-assistant/security/audit-logger';
import { getBulkOperationHistory } from '@/features/ai-shopping-assistant/security/bulk-operation-history';
import { getSecurityAlertService } from '@/features/ai-shopping-assistant/security/security-alerts';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;
  let accountId: string | undefined;
  let operationId: string | undefined;

  // Initialize services
  const auditLogger = getAuditLogger();
  const b2bAuth = getB2BAuthorization();
  const fileScanner = getFileScanner();
  const virusScanner = getVirusScanner();
  const operationHistory = getBulkOperationHistory();
  const alertService = getSecurityAlertService({
    enableWebhooks: true,
    webhookUrl: process.env.SECURITY_WEBHOOK_URL,
    enableEmailAlerts: process.env.NODE_ENV === 'production'
  });

  try {
    // Get client info
    const clientId = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Enhanced rate limiting for bulk operations
    const rateLimitResult = await rateLimiter.check(clientId, {
      maxRequests: 10,
      windowMs: 300000 // 5 minutes
    });
    
    if (!rateLimitResult.allowed) {
      // Monitor rate limit abuse
      await alertService.monitorEvent({
        eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
        ipAddress: clientId,
        details: { userAgent, retryAfter: rateLimitResult.retryAfter }
      });

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded for bulk operations',
          retryAfter: rateLimitResult.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        }
      );
    }

    // Authenticate user with B2B requirement
    const authResult = await authenticateUser(request);
    if (!authResult.isAuthenticated || !authResult.isB2B) {
      await auditLogger.logEvent(AuditEventType.AUTH_B2B_REQUIRED, {
        ipAddress: clientId,
        userAgent,
        action: 'bulk_upload.auth',
        result: 'failure',
        errorMessage: authResult.isAuthenticated ? 'B2B access required' : 'Authentication failed'
      });

      return new Response(
        JSON.stringify({ error: 'B2B authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    userId = authResult.userId;
    accountId = authResult.accountId || authResult.userId;

    // Get user context for authorization
    const userContext = {
      userId,
      accountId,
      role: authResult.role || 'BUYER',
      permissions: authResult.permissions || [B2BPermission.BULK_ORDER_CREATE],
      customLimits: authResult.customLimits
    };

    // Check bulk operation permission
    const authorizationResult = await b2bAuth.authorizeBulkOperation(userContext, {
      type: 'create',
      orderValue: 0, // Will be calculated from CSV
      itemCount: 0   // Will be calculated from CSV
    });

    if (!authorizationResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: authorizationResult.reason,
          requiredPermission: authorizationResult.requiredPermission
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Security scan the file
    logger.info('SecureBulkUpload', 'Scanning uploaded file', { 
      filename: file.name,
      size: file.size,
      userId,
      accountId
    });

    // Step 1: Basic file security scan
    const fileScanResult = await fileScanner.scanFile(file, file.name, userId);
    if (!fileScanResult.safe) {
      await alertService.monitorEvent({
        eventType: AuditEventType.MALICIOUS_PAYLOAD_DETECTED,
        userId,
        accountId,
        ipAddress: clientId,
        details: {
          filename: file.name,
          threats: fileScanResult.threats
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'File security check failed',
          threats: fileScanResult.threats
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 2: Virus scan
    const virusScanResult = await virusScanner.scanFile(file, file.name, userId);
    if (!virusScanResult.clean) {
      await alertService.createAlert(
        virusScanResult.infected ? 
          alertService.SecurityAlertType.MALWARE_DETECTED : 
          alertService.SecurityAlertType.SUSPICIOUS_BULK_OPERATION,
        virusScanResult.infected ? 
          alertService.AlertSeverity.CRITICAL : 
          alertService.AlertSeverity.HIGH,
        { userId, accountId, ipAddress: clientId },
        {
          description: `Virus detected in bulk upload: ${file.name}`,
          evidence: {
            filename: file.name,
            threats: virusScanResult.threats,
            scanProvider: virusScanResult.provider
          }
        }
      );

      return new Response(
        JSON.stringify({ 
          error: 'Virus detected in uploaded file',
          threats: virusScanResult.threats
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse CSV with enhanced security
    const csvContent = await file.text();
    const parser = new SecureCSVBulkOrderParser();
    const parseResult = await parser.parseStringSecure(csvContent, userId, accountId);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'CSV parsing failed',
          errors: parseResult.errors,
          securityThreats: parseResult.securityThreats
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate total order value for authorization
    const totalValue = parseResult.rows.reduce((sum, row) => 
      sum + (row.quantity * (row.price || 0)), 0
    );

    // Re-check authorization with actual values
    const finalAuthResult = await b2bAuth.authorizeBulkOperation(userContext, {
      type: 'create',
      orderValue: totalValue,
      itemCount: parseResult.rows.length
    });

    if (!finalAuthResult.allowed) {
      await auditLogger.logEvent(AuditEventType.ORDER_LIMIT_EXCEEDED, {
        userId,
        accountId,
        ipAddress: clientId,
        action: 'bulk_upload.limit_check',
        result: 'failure',
        details: {
          reason: finalAuthResult.reason,
          requestedValue: totalValue,
          limit: finalAuthResult.currentLimit
        }
      });

      return new Response(
        JSON.stringify({ 
          error: finalAuthResult.reason,
          limit: finalAuthResult.currentLimit,
          requested: finalAuthResult.requestedAmount
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate SKU patterns
    const skuValidation = await b2bAuth.validateSKUPatterns(
      userContext,
      parseResult.rows.map(r => r.sku)
    );

    if (!skuValidation.valid) {
      return new Response(
        JSON.stringify({ 
          error: skuValidation.reason,
          invalidSKUs: skuValidation.invalidSKUs
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create operation history record
    operationId = await operationHistory.createOperation(
      userId,
      accountId,
      parseResult.rows.map(row => ({
        sku: row.sku,
        quantity: row.quantity,
        price: row.price
      })),
      {
        filename: file.name,
        fileHash: fileScanResult.metadata.hash,
        ipAddress: clientId,
        userAgent,
        notes: formData.get('notes') as string
      }
    );

    // Initialize streaming response
    const streamer = new BulkProgressStreamer();
    const stream = streamer.getStream();

    // Get SDK instance
    const sdk = getSdk();

    // Initialize bulk processor with enhanced security context
    const processor = new BulkOrderProcessor({
      batchSize: 20,
      maxConcurrent: 5,
      enableAlternatives: true,
      progressCallback: async (status: BulkProcessingStatus) => {
        // Update operation history
        if (status.currentItem) {
          await operationHistory.updateProgress(operationId!, {
            sku: status.currentItem.sku,
            success: status.currentItem.status === 'success',
            orderId: status.currentItem.orderId,
            error: status.currentItem.error
          });
        }

        // Stream progress
        streamer.sendProgress(status);
      },
      checkAvailability: async (sku: string) => {
        const products = await sdk.unified.searchProducts({ 
          search: sku,
          pageSize: 1 
        });
        const product = products.products[0];
        
        return {
          sku,
          available: product?.availableForSale || false,
          quantity: product?.quantityAvailable || 0,
          price: product?.price?.value?.amount || 0,
          name: product?.name || sku
        };
      },
      findAlternatives: async (sku: string, quantity: number) => {
        const suggester = new B2BAlternativeSuggester();
        // Implementation would use sdk.unified.searchProducts with filters
        return [];
      },
      addToCart: async (items) => {
        // Add items to cart through UDL
        for (const item of items) {
          try {
            await sdk.unified.addCartLineItem({
              cartId: userContext.userId, // Simplified - would use real cart ID
              productId: item.sku,
              quantity: item.quantity
            });
          } catch (error) {
            console.error(`Failed to add ${item.sku} to cart:`, error);
            throw error;
          }
        }
      }
    });

    // Process in background
    processor.processBulkOrder(parseResult.rows).then(async (result) => {
      // Send final result
      streamer.sendComplete(result);
      
      // Update B2B order statistics
      await b2bAuth.updateOrderStats(accountId, totalValue);
      
      // Log completion
      logger.info('SecureBulkUpload', 'Bulk upload completed', {
        userId,
        accountId,
        operationId,
        duration: Date.now() - startTime,
        ...result
      });
    }).catch(async (error) => {
      // Log error
      await auditLogger.logEvent(AuditEventType.BULK_UPLOAD_FAILURE, {
        userId,
        accountId,
        action: 'bulk_upload.process',
        result: 'failure',
        resource: operationId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      streamer.sendError(error instanceof Error ? error.message : 'Processing failed');
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Operation-Id': operationId
      }
    });

  } catch (error) {
    // Log error
    await auditLogger.logEvent(AuditEventType.BULK_UPLOAD_FAILURE, {
      userId,
      accountId,
      action: 'bulk_upload',
      result: 'failure',
      resource: operationId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      details: {
        duration: Date.now() - startTime
      }
    });

    logger.error('SecureBulkUpload', 'Bulk upload failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      accountId
    });

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred during bulk upload'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}