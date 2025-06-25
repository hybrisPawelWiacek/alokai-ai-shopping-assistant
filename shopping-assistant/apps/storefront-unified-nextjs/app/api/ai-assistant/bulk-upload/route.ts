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
import { getAuditLogger, AuditEventType } from '@/features/ai-shopping-assistant/security/audit-logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    // Rate limiting for bulk operations (stricter limits)
    const clientId = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimiter.check(clientId, {
      maxRequests: 10,
      windowMs: 300000 // 5 minutes
    });
    
    if (!rateLimitResult.allowed) {
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

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.isAuthenticated || !authResult.isB2B) {
      return new Response(
        JSON.stringify({ error: 'B2B authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    userId = authResult.userId;

    // Parse request
    const contentType = request.headers.get('content-type') || '';
    let csvContent: string;
    let enableAlternatives = true;
    let priority = 'normal';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file || !file.name.endsWith('.csv')) {
        return new Response(
          JSON.stringify({ error: 'Valid CSV file required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: 'File size exceeds 5MB limit' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      csvContent = await file.text();
      enableAlternatives = formData.get('enableAlternatives') !== 'false';
      priority = (formData.get('priority') as string) || 'normal';
    } else {
      const body = await request.json();
      csvContent = body.csvContent;
      enableAlternatives = body.enableAlternatives !== false;
      priority = body.priority || 'normal';
    }

    // Initialize SDK
    const sdk = getSdk();

    // Parse CSV
    const parser = new CSVBulkOrderParser({
      maxRows: 1000,
      validateSku: async (sku) => {
        try {
          const product = await sdk.unified.getProductDetails({ sku });
          return !!product;
        } catch {
          return false;
        }
      }
    });

    const parseResult = await parser.parseString(csvContent);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: 'CSV parsing failed',
          details: parseResult.errors
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Set up streaming response
    const streamer = new BulkProgressStreamer();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Start processing in background
    (async () => {
      try {
        // Send initial progress
        await writer.write(encoder.encode(
          `event: progress\ndata: ${JSON.stringify({
            phase: 'parsing',
            percentage: 0,
            message: 'Starting bulk order processing...',
            totalItems: parseResult.rows.length
          })}\n\n`
        ));

        // Initialize processor
        const processor = new BulkOrderProcessor({
          batchSize: 10,
          maxConcurrent: 3,
          enableAlternatives,
          progressCallback: async (status: BulkProcessingStatus) => {
            // Stream progress updates
            const progress = {
              phase: 'processing',
              percentage: Math.round((status.processedItems / status.totalItems) * 100),
              message: `Processing batch ${status.currentBatch}/${status.totalBatches}`,
              ...status
            };
            
            await writer.write(encoder.encode(
              `event: progress\ndata: ${JSON.stringify(progress)}\n\n`
            ));
          },
          checkAvailability: async (sku) => {
            const product = await sdk.unified.getProductDetails({ sku });
            return {
              sku,
              available: product.availableForOrder !== false,
              quantity: product.quantityLimit || 1000,
              price: product.price?.value?.centAmount ? product.price.value.centAmount / 100 : 0,
              name: product.name || sku
            };
          },
          findAlternatives: async (sku) => {
            if (!enableAlternatives) return [];
            
            // Use alternative suggester with UDL
            const suggester = new B2BAlternativeSuggester({
              maxSuggestions: 3,
              minSimilarity: 0.6,
              enableCrossBrand: true,
              priceTolerancePercent: 30
            });

            // Implementation would use UDL search as shown in bulk-order-with-udl.action.ts
            return [];
          },
          addToCart: async (items) => {
            const cart = await sdk.unified.getCart();
            for (const item of items) {
              await sdk.unified.addCartLineItem({
                cartId: cart.id,
                product: {
                  productId: item.sku,
                  sku: item.sku,
                  quantity: item.quantity
                }
              });
            }
          }
        });

        // Process bulk order
        const result = await processor.processBulkOrder(parseResult.rows);

        // Send completion event
        await writer.write(encoder.encode(
          `event: completed\ndata: ${JSON.stringify({
            success: result.success,
            totalProcessed: result.itemsProcessed,
            totalAdded: result.itemsAdded,
            totalFailed: result.itemsFailed,
            totalValue: result.totalValue,
            processingTime: result.processingTime,
            hasAlternatives: result.suggestions.size > 0,
            alternatives: Array.from(result.suggestions.entries())
          })}\n\n`
        ));

        // Log completion
        logger.info('Bulk order completed', {
          userId,
          itemsProcessed: result.itemsProcessed,
          itemsAdded: result.itemsAdded,
          processingTime: result.processingTime,
          duration: Date.now() - startTime
        });

      } catch (error) {
        // Send error event
        await writer.write(encoder.encode(
          `event: error\ndata: ${JSON.stringify({
            error: error instanceof Error ? error.message : 'Processing failed'
          })}\n\n`
        ));

        logger.error('Bulk order failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId,
          duration: Date.now() - startTime
        });
      } finally {
        await writer.close();
      }
    })();

    // Return streaming response
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable Nginx buffering
      }
    });

  } catch (error) {
    logger.error('Bulk upload request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      duration: Date.now() - startTime
    });

    return new Response(
      JSON.stringify({
        error: 'Bulk upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Health check for bulk upload service
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'bulk-upload',
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}