import { z } from 'zod';
import type { ActionDefinition, StateUpdateCommand } from '../types/action-definition';
import { CSVBulkOrderParser } from '../bulk/csv-parser';
import { BulkOrderProcessor, createBulkOperationCommands } from '../bulk/bulk-processor';
import { B2BAlternativeSuggester, type ProductAttributes } from '../bulk/alternative-suggester';
import type { CommerceState } from '../state';
import { mockCustomExtension } from '../mocks/custom-extension-mock';

/**
 * Bulk order action parameters
 */
const bulkOrderSchema = z.object({
  csvContent: z.string().optional(),
  items: z.array(z.object({
    sku: z.string(),
    quantity: z.number().positive()
  })).optional(),
  enableAlternatives: z.boolean().default(true),
  priority: z.enum(['high', 'normal', 'low']).default('normal')
});

/**
 * Bulk order action for B2B customers
 * Processes CSV uploads or direct item lists with intelligent batching
 */
export const bulkOrderAction: ActionDefinition = {
  id: 'bulk_order',
  name: 'Process Bulk Order',
  description: 'Process bulk orders from CSV or item list with automatic batching and alternative suggestions',
  category: 'b2b',
  parameters: bulkOrderSchema,
  requiredPermissions: ['cart:write', 'product:read'],
  rateLimit: {
    maxCalls: 10,
    windowMs: 60000 // 10 bulk operations per minute
  },
  b2bOnly: true,
  security: {
    validateInput: true,
    maxPayloadSize: 5 * 1024 * 1024 // 5MB max for CSV
  }
};

/**
 * Implementation of bulk order processing
 */
export async function executeBulkOrder(
  params: z.infer<typeof bulkOrderSchema>,
  state: CommerceState,
  context: {
    sdk: any;
    progressCallback?: (status: any) => void;
  }
): Promise<StateUpdateCommand[]> {
  const commands: StateUpdateCommand[] = [];

  try {
    // Parse CSV if provided
    let items: Array<{ sku: string; quantity: number; priority?: string }> = [];
    
    if (params.csvContent) {
      const parser = new CSVBulkOrderParser({
        maxRows: 1000,
        validateSku: async (sku) => {
          try {
            // TODO: Replace with context.sdk.unified.getProductDetails({ sku })
            // For now, mock validation
            return sku.startsWith('SKU-') || sku.startsWith('PROD-');
          } catch {
            return false;
          }
        }
      });

      const parseResult = await parser.parseString(params.csvContent);
      
      if (!parseResult.success) {
        commands.push({
          type: 'add_message',
          path: [],
          value: {
            type: 'error',
            content: `CSV parsing failed with ${parseResult.errors.length} errors`,
            metadata: { errors: parseResult.errors }
          }
        });
        return commands;
      }

      items = parseResult.rows.map(row => ({
        sku: row.sku,
        quantity: row.quantity,
        priority: row.priority
      }));

      // Add parsing summary
      commands.push({
        type: 'add_metadata',
        path: ['csvParsing'],
        value: parseResult.summary
      });
    } else if (params.items) {
      items = params.items.map(item => ({
        ...item,
        priority: params.priority
      }));
    } else {
      throw new Error('Either csvContent or items must be provided');
    }

    // Create processor
    const processor = new BulkOrderProcessor({
      batchSize: 10,
      maxConcurrent: 3,
      enableAlternatives: params.enableAlternatives,
      progressCallback: context.progressCallback,
      checkAvailability: async (sku) => {
        // TODO: Replace with context.sdk.unified.getProductDetails({ sku })
        // Mock product data following UDL structure
        const mockAvailable = !sku.includes('OUT');
        const mockQuantity = mockAvailable ? Math.floor(Math.random() * 500) + 100 : 0;
        
        return {
          sku,
          available: mockAvailable,
          quantity: mockQuantity,
          price: 99.99 + Math.random() * 100,
          name: `Product ${sku}`
        };
      },
      findAlternatives: async (sku) => {
        // Use custom extension for finding alternatives
        // TODO: Replace with context.sdk.customExtension.findSimilarProducts()
        const alternatives = await mockCustomExtension.findSimilarProducts({
          sku,
          maxResults: 5,
          includeOutOfStock: false,
          mode: 'b2b'
        });

        // If custom method works, use it
        if (alternatives.length > 0) {
          return alternatives.map(alt => ({
            sku: alt.product.sku,
            name: alt.product.name,
            similarity: alt.similarity,
            availability: alt.product.availability || 'in_stock' as 'in_stock' | 'limited' | 'out_of_stock',
            price: alt.product.price?.value?.amount || alt.product.price?.regular?.amount,
            reason: alt.reasons.join(', ')
          }));
        }

        // Fallback: Use intelligent suggester with mock data
        const suggester = new B2BAlternativeSuggester({
          maxSuggestions: 3,
          minSimilarity: 0.6,
          enableCrossBrand: true,
          priceTolerancePercent: 30
        });

        // Mock original product following UDL structure
        const originalProduct: ProductAttributes = {
          sku,
          name: `Product ${sku}`,
          category: ['Electronics', 'Components'],
          brand: 'TechBrand',
          attributes: {
            power: '100W',
            voltage: '220V',
            certification: 'CE'
          },
          price: 150,
          availability: 'out_of_stock',
          tags: ['industrial', 'professional']
        };

        // Mock candidate products
        const mockCandidates: ProductAttributes[] = [
          {
            sku: `ALT-${sku}-1`,
            name: `Alternative for ${sku} - Premium`,
            category: ['Electronics', 'Components'],
            brand: 'TechBrand',
            attributes: {
              power: '120W',
              voltage: '220V',
              certification: 'CE'
            },
            price: 180,
            availability: 'in_stock',
            tags: ['industrial', 'professional', 'premium']
          },
          {
            sku: `ALT-${sku}-2`,
            name: `Alternative for ${sku} - Value`,
            category: ['Electronics', 'Components'],
            brand: 'ValueBrand',
            attributes: {
              power: '100W',
              voltage: '220V',
              certification: 'CE'
            },
            price: 120,
            availability: 'in_stock',
            tags: ['industrial', 'value']
          }
        ];

        const suggestions = await suggester.findAlternatives(
          originalProduct,
          mockCandidates,
          100 // bulk quantity
        );

        return suggestions;
      },
      addToCart: async (items) => {
        // Add items to cart using UDL
        // TODO: Replace with proper cart operations
        for (const item of items) {
          // In real implementation, use:
          // await context.sdk.unified.addCartLineItem({
          //   product: { productId: item.sku, sku: item.sku, quantity: item.quantity }
          // });
          
          // For now, mock the operation
          console.log(`Mock: Adding ${item.quantity} units of ${item.sku} to cart`);
        }
      }
    });

    // Process bulk order
    const result = await processor.processBulkOrder(items);

    // Create state update commands
    commands.push(...createBulkOperationCommands(result));

    // Add success message with alternatives if any
    if (result.success) {
      commands.push({
        type: 'add_message',
        path: [],
        value: {
          type: 'success',
          content: `Successfully added ${result.itemsAdded} items to cart (${result.totalQuantity} units, $${result.totalValue.toFixed(2)} total)`
        }
      });
    } else {
      const alternativeCount = result.suggestions.size;
      commands.push({
        type: 'add_message',
        path: [],
        value: {
          type: 'warning',
          content: `Processed ${result.itemsProcessed} items: ${result.itemsAdded} added, ${result.itemsFailed} failed${alternativeCount > 0 ? ` (${alternativeCount} alternatives available)` : ''}`,
          metadata: {
            errors: result.errors,
            suggestions: Array.from(result.suggestions.entries())
          }
        }
      });
    }

    // Update mode to B2B if not already
    if (state.mode !== 'b2b') {
      commands.push({
        type: 'update_mode',
        path: [],
        value: 'b2b'
      });
    }

    // Log activity
    commands.push({
      type: 'add_activity',
      path: [],
      value: {
        type: 'bulk_order',
        timestamp: new Date().toISOString(),
        details: {
          source: params.csvContent ? 'csv' : 'direct',
          itemCount: items.length,
          successCount: result.itemsAdded,
          failureCount: result.itemsFailed,
          totalValue: result.totalValue,
          processingTime: result.processingTime
        }
      }
    });

  } catch (error) {
    commands.push({
      type: 'add_message',
      path: [],
      value: {
        type: 'error',
        content: `Bulk order processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    });
  }

  return commands;
}