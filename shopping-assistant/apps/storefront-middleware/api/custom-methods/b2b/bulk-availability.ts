import { type IntegrationContext } from "../../../types";
import { getNormalizers } from "@vsf-enterprise/unified-api-sapcc/udl";
import type { CheckBulkAvailabilityArgs, BulkAvailabilityResponse, WarehouseAvailability } from './types';

/**
 * Check bulk availability across warehouses and production
 */
export async function checkBulkAvailability(
  context: IntegrationContext,
  args: CheckBulkAvailabilityArgs
): Promise<BulkAvailabilityResponse> {
  const { productId, quantity, deliveryDate, warehouseIds } = args;
  
  try {
    // IMPORTANT: Always use normalizers when fetching data from context.api
    // This ensures UDL consistency across all backends
    const { normalizeCustomer, normalizeProduct } = getNormalizers(context);
    
    // Validate B2B authorization
    const rawCustomer = await context.api.getCustomer();
    const customer = normalizeCustomer(rawCustomer);
    
    if (!customer.organizationId) {
      throw new Error('Bulk availability check is only available for B2B customers');
    }
    
    // Get product details with stock information
    const rawProduct = await context.api.getProduct({ code: productId });
    if (!rawProduct) {
      throw new Error(`Product ${productId} not found`);
    }
    const product = normalizeProduct(rawProduct);
    
    // Get stock information from normalized product
    // Note: UDL normalized product has quantityLimit for stock
    const currentStock = product.quantityLimit || 0;
    const inStockStatus = currentStock > 0 ? 'inStock' : 'outOfStock';
    
    // TODO: Real integration with warehouse management system
    // const warehouseService = await context.getApiClient("wms");
    // const availability = await warehouseService.api.checkBulkAvailability({
    //   sku: productId,
    //   quantity: quantity,
    //   deliveryDate: deliveryDate,
    //   warehouseIds: warehouseIds
    // });
    
    // Mock implementation with realistic warehouse data
    const warehouses: WarehouseAvailability[] = [
      {
        id: 'WH-001',
        name: 'Main Distribution Center',
        quantity: Math.floor(currentStock * 0.6),
        location: 'Dallas, TX'
      },
      {
        id: 'WH-002',
        name: 'East Coast Warehouse',
        quantity: Math.floor(currentStock * 0.3),
        location: 'Newark, NJ'
      },
      {
        id: 'WH-003',
        name: 'West Coast Warehouse',
        quantity: Math.floor(currentStock * 0.1),
        location: 'Los Angeles, CA'
      }
    ].filter(wh => !warehouseIds || warehouseIds.includes(wh.id));
    
    const availableNow = warehouses.reduce((sum, wh) => sum + wh.quantity, 0);
    const shortfall = Math.max(0, quantity - availableNow);
    
    // Calculate production options if needed
    const productionNeeded = shortfall > 0;
    const productionLeadTime = calculateProductionLeadTime(shortfall);
    const productionDate = new Date();
    productionDate.setDate(productionDate.getDate() + productionLeadTime);
    
    // Generate fulfillment alternatives
    const alternatives = [];
    
    if (availableNow > 0 && shortfall > 0) {
      // Split shipment option
      alternatives.push({
        splitShipment: true,
        shipments: [
          {
            quantity: availableNow,
            estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            source: 'warehouse' as const
          },
          {
            quantity: shortfall,
            estimatedDate: productionDate.toISOString(),
            source: 'production' as const
          }
        ]
      });
    }
    
    // Full production option
    if (productionNeeded) {
      alternatives.push({
        splitShipment: false,
        shipments: [{
          quantity: quantity,
          estimatedDate: productionDate.toISOString(),
          source: 'production' as const
        }]
      });
    }
    
    return {
      productId,
      requestedQuantity: quantity,
      availableNow,
      totalAvailable: availableNow + (currentStock > 0 ? 999999 : 0), // Assume unlimited production capacity if in stock
      availability: {
        immediate: {
          quantity: availableNow,
          warehouses: warehouses.filter(wh => wh.quantity > 0)
        },
        production: {
          quantity: shortfall,
          leadTime: productionLeadTime,
          estimatedDate: productionDate.toISOString()
        },
        alternatives
      }
    };
    
  } catch (error) {
    console.error('Error in checkBulkAvailability:', error);
    throw error;
  }
}

function calculateProductionLeadTime(quantity: number): number {
  // Simple calculation based on quantity
  if (quantity < 100) return 7;
  if (quantity < 500) return 10;
  if (quantity < 1000) return 14;
  if (quantity < 5000) return 21;
  return 28;
}