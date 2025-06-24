import { z } from 'zod';
import type { ActionDefinition, StateUpdateCommand } from '../types/action-definition';
import { CSVBulkOrderParser } from '../bulk/csv-parser';
import { BulkOrderProcessor, createBulkOperationCommands } from '../bulk/bulk-processor';
import { B2BAlternativeSuggester, type ProductAttributes } from '../bulk/alternative-suggester';
import type { CommerceState } from '../state';

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
 * Bulk order action for B2B customers - Using Alokai UDL properly
 * This version properly integrates with Alokai's Unified Data Layer
 */
export const bulkOrderWithUDLAction: ActionDefinition = {
  id: 'bulk_order_udl',
  name: 'Process Bulk Order (UDL)',
  description: 'Process bulk orders with proper Alokai UDL integration for alternatives',
  category: 'b2b',
  parameters: bulkOrderSchema,
  requiredPermissions: ['cart:write', 'product:read'],
  rateLimit: {
    maxCalls: 10,
    windowMs: 60000
  },
  b2bOnly: true,
  security: {
    validateInput: true,
    maxPayloadSize: 5 * 1024 * 1024
  }
};

/**
 * Implementation using proper Alokai UDL integration
 */
export async function executeBulkOrderWithUDL(
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
            // Use Alokai UDL to validate SKU
            const product = await context.sdk.unified.getProductDetails({ sku });
            return !!product;
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
    } else if (params.items) {
      items = params.items.map(item => ({
        ...item,
        priority: params.priority
      }));
    }

    // Initialize alternative suggester
    const suggester = new B2BAlternativeSuggester({
      maxSuggestions: 3,
      minSimilarity: 0.6,
      enableCrossBrand: true,
      priceTolerancePercent: 30
    });

    // Create processor with UDL integration
    const processor = new BulkOrderProcessor({
      batchSize: 10,
      maxConcurrent: 3,
      enableAlternatives: params.enableAlternatives,
      progressCallback: context.progressCallback,
      
      // Use Alokai UDL for availability check
      checkAvailability: async (sku) => {
        try {
          const product = await context.sdk.unified.getProductDetails({ sku });
          
          // Check if we have inventory data
          const available = product.sku && (!product.availableForOrder || product.availableForOrder === true);
          const quantity = product.quantityLimit || 1000; // Default high quantity if not specified
          
          return {
            sku,
            available,
            quantity,
            price: product.price?.value?.centAmount ? product.price.value.centAmount / 100 : 0,
            name: product.name || sku
          };
        } catch (error) {
          return {
            sku,
            available: false,
            quantity: 0,
            price: 0,
            name: sku
          };
        }
      },
      
      // Use custom method for finding alternatives with Alokai integration
      findAlternatives: async (sku) => {
        if (!params.enableAlternatives) return [];

        try {
          // First, try to use the custom method if available
          if (context.sdk.customExtension?.findSimilarProducts) {
            const similarProducts = await context.sdk.customExtension.findSimilarProducts({
              sku,
              maxResults: 5,
              includeOutOfStock: false,
              mode: 'b2b'
            });

            return similarProducts.map((result: any) => ({
              sku: result.product.sku,
              name: result.product.name,
              similarity: result.similarity,
              availability: 'in_stock' as const,
              price: result.product.price?.value?.centAmount 
                ? result.product.price.value.centAmount / 100 
                : undefined,
              reason: result.reasons.join(', ')
            }));
          }

          // Fallback: Use UDL search with intelligent filtering
          const originalProduct = await context.sdk.unified.getProductDetails({ sku });
          
          if (!originalProduct) return [];

          // Convert UDL product to our ProductAttributes format
          const originalAttributes: ProductAttributes = {
            sku: originalProduct.sku || sku,
            name: originalProduct.name || '',
            category: originalProduct.categories?.map((c: any) => c.name) || [],
            brand: originalProduct.brand || undefined,
            attributes: {
              // Extract relevant attributes from the product
              ...(originalProduct.attributes || {}),
              // Add any custom fields
              ...(originalProduct.$custom || {})
            },
            price: originalProduct.price?.value?.centAmount 
              ? originalProduct.price.value.centAmount / 100 
              : 0,
            availability: 'out_of_stock',
            tags: originalProduct.tags || []
          };

          // Search for products in the same category
          const categoryId = originalProduct.categories?.[0]?.id;
          if (!categoryId) return [];

          const searchResults = await context.sdk.unified.searchProducts({
            categoryId,
            limit: 20, // Get more to filter
            filter: [
              { 
                attribute: 'availableForOrder',
                in: ['true']
              }
            ]
          });

          // Convert search results to ProductAttributes
          const candidateAttributes: ProductAttributes[] = searchResults.products
            .filter((p: any) => p.sku !== sku)
            .map((p: any) => ({
              sku: p.sku || '',
              name: p.name || '',
              category: p.categories?.map((c: any) => c.name) || [],
              brand: p.brand || undefined,
              attributes: {
                ...(p.attributes || {}),
                ...(p.$custom || {})
              },
              price: p.price?.value?.centAmount 
                ? p.price.value.centAmount / 100 
                : 0,
              availability: 'in_stock' as const,
              tags: p.tags || []
            }));

          // Use our intelligent suggester
          const suggestions = await suggester.findAlternatives(
            originalAttributes,
            candidateAttributes,
            items.find(i => i.sku === sku)?.quantity
          );

          return suggestions;
        } catch (error) {
          console.error(`Error finding alternatives for ${sku}:`, error);
          return [];
        }
      },
      
      // Use Alokai UDL for cart operations
      addToCart: async (items) => {
        // Get current cart
        const cart = await context.sdk.unified.getCart();
        
        // Add items to cart using UDL
        for (const item of items) {
          await context.sdk.unified.addCartLineItem({
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
    const result = await processor.processBulkOrder(items);

    // Create state update commands
    commands.push(...createBulkOperationCommands(result));

    // Add result messages
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