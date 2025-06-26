# Accessing SAPCC-Specific Data in Alokai

This guide demonstrates how to access platform-specific SAPCC data while maintaining Unified Data Layer (UDL) compatibility.

> **Prerequisites**: Understanding the [UDL Contract](./UDL_CONTRACT.md) is essential before extending it with platform-specific data
> 
> **Additional Resources**:
> - [UDL Comprehensive Guide](./UDL_COMPREHENSIVE_GUIDE.md) - Navigate all UDL documentation
> - [SAPCC Normalizers Reference](../unified-data-model/5.reference/sapcc/normalizers/) - Detailed normalizer documentation
> - [B2B SAPCC Features](../unified-data-model/4.features/4.advanced/4.b2b-sapcc.md) - Advanced B2B functionality

## Table of Contents
1. [Overview](#overview)
2. [Key Patterns](#key-patterns)
3. [Custom Methods with Raw SAPCC Data](#custom-methods-with-raw-sapcc-data)
4. [Extending Normalizers with Custom Fields](#extending-normalizers-with-custom-fields)
5. [Using the $custom Property](#using-the-custom-property)
6. [Accessing SAPCC Classifications](#accessing-sapcc-classifications)
7. [B2B-Specific SAPCC Features](#b2b-specific-sapcc-features)
8. [Best Practices](#best-practices)

## Overview

While Alokai's UDL provides a normalized interface across e-commerce platforms, you sometimes need access to platform-specific features. SAPCC offers several mechanisms:

1. **Raw API Access**: Access SAPCC API before normalization via `context.api`
2. **Custom Fields**: Extend UDL normalizers to include SAPCC-specific fields
3. **$custom Property**: Access custom fields via the `$custom` property in UDL objects
4. **Custom Methods**: Create middleware methods for SAPCC-specific operations

> **Key Principle**: The UDL contract is a **base contract** that you can extend. SAPCC's full API remains available while maintaining UDL compatibility for cross-platform features.

## Key Patterns

### Pattern 1: Access Raw SAPCC Data Before Normalization

```typescript
// In custom methods, you can access raw SAPCC data before normalization
import { getNormalizers } from "@vsf-enterprise/unified-api-sapcc/udl";

export async function customMethod(context: IntegrationContext) {
  // Get raw SAPCC product data
  const rawProduct = await context.api.getProduct({ code: 'SKU123' });
  
  // Access SAPCC-specific fields
  const classifications = rawProduct.classifications; // SAPCC-specific
  const manufacturer = rawProduct.manufacturer;       // SAPCC-specific
  const stockLevel = rawProduct.stock?.stockLevel;   // SAPCC-specific
  
  // Then normalize for UDL compatibility
  const { normalizeProduct } = getNormalizers(context);
  const udlProduct = normalizeProduct(rawProduct);
  
  return {
    product: udlProduct,
    // Include SAPCC-specific data separately if needed
    sapccSpecific: {
      classifications,
      manufacturer,
      stockLevel
    }
  };
}
```

### Pattern 2: Always Normalize When Returning Data

```typescript
// ✅ CORRECT: Always normalize data from context.api
export async function getBulkPricing(context: IntegrationContext, args: any) {
  const { normalizeProduct } = getNormalizers(context);
  
  const rawProduct = await context.api.getProduct({ code: args.productId });
  
  // Return normalized data to maintain UDL contract
  return {
    product: normalizeProduct(rawProduct),
    // Add custom pricing logic here
    bulkPricing: calculateBulkPricing(rawProduct)
  };
}

// ❌ WRONG: Never return raw SAPCC data directly
export async function getBulkPricingWrong(context: IntegrationContext, args: any) {
  const product = await context.api.getProduct({ code: args.productId });
  return product; // This breaks UDL compatibility!
}
```

## Custom Methods with Raw SAPCC Data

### Example: Product Similarity with SAPCC Classifications

From `api/custom-methods/product-similarity.ts`:

```typescript
export async function findSimilarProducts(
  context: IntegrationContext,
  args: { sku: string; maxResults?: number }
) {
  const { normalizeProduct } = getNormalizers(context);
  
  // Get raw SAPCC product with classifications
  const originalProduct = await context.api.getProduct({ code: args.sku });
  
  // Access SAPCC-specific classifications for similarity matching
  const classifications = originalProduct.classifications?.[0]?.features || [];
  
  // Search using SAPCC-specific fields
  const searchResults = await context.api.searchProducts({
    categoryCode: originalProduct.categories?.[0]?.code,
    // Use SAPCC-specific search parameters
    facets: classifications.map(f => f.code),
    pageSize: args.maxResults * 3
  });
  
  // Calculate similarity using SAPCC attributes
  const scoredProducts = searchResults.products.map(candidate => {
    const similarity = calculateSimilarity(
      originalProduct.classifications, 
      candidate.classifications
    );
    
    return {
      // Always return normalized UDL data
      product: normalizeProduct(candidate),
      similarity: similarity.score,
      // Include SAPCC-specific reasons
      reasons: generateReasons(originalProduct, candidate)
    };
  });
  
  return scoredProducts;
}

// Helper to compare SAPCC classifications
function calculateSimilarity(class1: any, class2: any) {
  const attrs1 = class1?.[0]?.features || [];
  const attrs2 = class2?.[0]?.features || [];
  
  // Compare SAPCC feature values
  let matches = 0;
  attrs1.forEach(attr1 => {
    const attr2 = attrs2.find(a => a.code === attr1.code);
    if (attr2 && compareFeatureValues(attr1.featureValues, attr2.featureValues)) {
      matches++;
    }
  });
  
  return { score: matches / Math.max(attrs1.length, 1) };
}
```

## Extending Normalizers with Custom Fields

### Example: Adding SAPCC Fields to UDL Objects

From `integrations/sapcc/extensions/unified.ts`:

```typescript
import { createUnifiedExtension } from '@vsf-enterprise/unified-api-sapcc';
import { normalizerCustomFields } from '@sf-modules-middleware/checkout-b2b';

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [{}, normalizerCustomFields]
  }
});
```

From `sf-modules/checkout-b2b/normalizers/customFields.ts`:

```typescript
import { defineAddCustomFields } from "@vsf-enterprise/unified-api-sapcc";

export const normalizerCustomFields = defineAddCustomFields({
  normalizeCart(_context, input) {
    // Add SAPCC-specific fields to cart.$custom
    return {
      paymentType: input.paymentType,      // SAPCC B2B field
      costCenter: input.costCenter,        // SAPCC B2B field
      purchaseOrderNumber: input.poNumber,  // SAPCC B2B field
    };
  },
  
  normalizeOrder(_context, input) {
    return {
      costCenter: input.costCenter,
      approvalStatus: input.approvalStatus, // SAPCC B2B field
    };
  },
  
  normalizeProduct(_context, input) {
    return {
      // Add SAPCC-specific product fields
      manufacturer: input.manufacturer,
      classifications: input.classifications,
      bulkPricingAvailable: input.volumePrices?.length > 0,
      technicalSpecs: extractTechnicalSpecs(input.classifications)
    };
  }
});

// Helper to extract technical specs from SAPCC classifications
function extractTechnicalSpecs(classifications: any[]) {
  if (!classifications?.length) return {};
  
  const specs = {};
  classifications[0]?.features?.forEach(feature => {
    if (feature.featureValues?.length) {
      specs[feature.code] = feature.featureValues[0].value;
    }
  });
  
  return specs;
}
```

## Using the $custom Property

### In Frontend Components

```typescript
// Access custom fields via $custom property
function ProductDetails({ product }) {
  return (
    <div>
      {/* Standard UDL fields */}
      <h1>{product.name}</h1>
      <p>{product.price.regular.amount}</p>
      
      {/* SAPCC-specific fields via $custom */}
      {product.$custom?.manufacturer && (
        <p>Manufacturer: {product.$custom.manufacturer}</p>
      )}
      
      {product.$custom?.bulkPricingAvailable && (
        <Button>View Bulk Pricing</Button>
      )}
      
      {/* Technical specifications from SAPCC */}
      {product.$custom?.technicalSpecs && (
        <TechnicalSpecs specs={product.$custom.technicalSpecs} />
      )}
    </div>
  );
}
```

### In B2B Checkout

```typescript
// From sf-modules/checkout-b2b/components/checkout.tsx
export default function Checkout() {
  const [cart] = useSfCartState();
  
  // Access SAPCC B2B-specific fields
  const paymentType = cart.$custom?.paymentType?.code;
  const costCenter = cart.$custom?.costCenter;
  
  const formValidationMessages = useMemo(() => {
    const elements = {
      // Standard UDL validation
      shippingAddress: !cart.shippingAddress,
      // SAPCC-specific validation
      paymentType: !cart.$custom?.paymentType?.code,
      costCenter: !cart.$custom?.costCenter?.uid
    };
    
    return { elements };
  }, [cart]);
}
```

## Accessing SAPCC Classifications

### Example: Technical Product Attributes

```typescript
export async function getProductTechnicalSpecs(
  context: IntegrationContext,
  args: { sku: string }
) {
  // Get raw SAPCC product with full classifications
  const rawProduct = await context.api.getProduct({ code: args.sku });
  
  // Extract technical specifications from classifications
  const technicalSpecs = {};
  const features = rawProduct.classifications?.[0]?.features || [];
  
  features.forEach(feature => {
    // Map SAPCC feature codes to readable names
    const specName = mapFeatureCodeToName(feature.code);
    const value = feature.featureValues?.[0]?.value;
    
    if (value) {
      technicalSpecs[specName] = {
        value,
        unit: feature.featureUnit?.symbol,
        // Include original SAPCC code for reference
        sapccCode: feature.code
      };
    }
  });
  
  // Return both normalized product and technical specs
  const { normalizeProduct } = getNormalizers(context);
  
  return {
    product: normalizeProduct(rawProduct),
    technicalSpecs,
    // Include raw classifications if needed for advanced use cases
    rawClassifications: rawProduct.classifications
  };
}

function mapFeatureCodeToName(code: string): string {
  const mapping = {
    'ElectronicsClassification/1.0/42.weight': 'Weight',
    'ElectronicsClassification/1.0/42.dimensions': 'Dimensions',
    'ElectronicsClassification/1.0/42.processor': 'Processor',
    // Add more mappings as needed
  };
  
  return mapping[code] || code;
}
```

## B2B-Specific SAPCC Features

### Example: Accessing B2B Customer Data

```typescript
export async function getB2BCustomerData(context: IntegrationContext) {
  const { normalizeCustomer } = getNormalizers(context);
  
  // Get raw SAPCC B2B customer data
  const rawCustomer = await context.api.getOrgUser({});
  
  // Access SAPCC B2B-specific fields
  const b2bSpecific = {
    // SAPCC B2B fields not in standard UDL
    unit: rawCustomer.unit,
    roles: rawCustomer.roles,
    approvalLimit: rawCustomer.approvalLimit,
    costCenters: rawCustomer.orgUnit?.costCenters || [],
    purchasingUnit: rawCustomer.orgUnit?.uid,
    isApprover: rawCustomer.roles?.includes('b2bapprovergroup'),
    isBuyer: rawCustomer.roles?.includes('b2bbuyergroup')
  };
  
  return {
    // Standard UDL customer
    customer: normalizeCustomer(rawCustomer),
    // SAPCC B2B-specific data
    b2bData: b2bSpecific
  };
}
```

### Example: B2B Bulk Operations

```typescript
export async function checkBulkAvailability(
  context: IntegrationContext,
  args: { items: Array<{ sku: string; quantity: number }> }
) {
  const { normalizeProduct } = getNormalizers(context);
  
  const availabilityResults = await Promise.all(
    args.items.map(async item => {
      // Get raw SAPCC product for stock data
      const rawProduct = await context.api.getProduct({ code: item.sku });
      
      // Access SAPCC-specific stock information
      const sapccStock = {
        stockLevel: rawProduct.stock?.stockLevel || 0,
        stockLevelStatus: rawProduct.stock?.stockLevelStatus,
        // SAPCC-specific: check warehouse stock
        warehouseStock: await checkWarehouseStock(context, rawProduct),
        // SAPCC-specific: future stock (pre-orders)
        futureStock: rawProduct.stock?.futureStock || []
      };
      
      // Calculate availability based on SAPCC data
      const canFulfill = sapccStock.stockLevel >= item.quantity;
      const alternativeWarehouses = findAlternativeWarehouses(
        sapccStock.warehouseStock,
        item.quantity
      );
      
      return {
        sku: item.sku,
        requestedQuantity: item.quantity,
        product: normalizeProduct(rawProduct),
        availability: {
          canFulfill,
          availableQuantity: sapccStock.stockLevel,
          status: sapccStock.stockLevelStatus,
          alternativeWarehouses,
          leadTime: calculateLeadTime(sapccStock, item.quantity)
        }
      };
    })
  );
  
  return { items: availabilityResults };
}

// Helper to check warehouse-specific stock (SAPCC feature)
async function checkWarehouseStock(context: IntegrationContext, product: any) {
  // This would call SAPCC-specific warehouse API
  // For now, return mock data showing the pattern
  return [
    { warehouseCode: 'WH001', stock: 500, location: 'New York' },
    { warehouseCode: 'WH002', stock: 300, location: 'Los Angeles' }
  ];
}
```

## Best Practices

### 1. Always Normalize for UDL Compatibility

```typescript
// ✅ DO: Normalize before returning
export async function customMethod(context: IntegrationContext) {
  const { normalizeProduct, normalizeCart } = getNormalizers(context);
  const rawData = await context.api.someMethod();
  return normalizeProduct(rawData);
}

// ❌ DON'T: Return raw SAPCC data
export async function badMethod(context: IntegrationContext) {
  return await context.api.someMethod(); // Breaks UDL!
}
```

### 2. Use Type Guards for Platform-Specific Features

```typescript
// Check if SAPCC-specific features are available
function hasSAPCCClassifications(product: any): boolean {
  return Array.isArray(product.classifications) && product.classifications.length > 0;
}

export async function processProduct(context: IntegrationContext, sku: string) {
  const rawProduct = await context.api.getProduct({ code: sku });
  
  let technicalSpecs = {};
  if (hasSAPCCClassifications(rawProduct)) {
    technicalSpecs = extractTechnicalSpecs(rawProduct.classifications);
  }
  
  const { normalizeProduct } = getNormalizers(context);
  return {
    product: normalizeProduct(rawProduct),
    technicalSpecs
  };
}
```

### 3. Document SAPCC Dependencies

```typescript
/**
 * Get bulk pricing for B2B customers
 * 
 * @sapcc-specific Uses SAPCC volumePrices and priceRange APIs
 * @sapcc-fields Accesses product.volumePrices, customer.unit.priceList
 */
export async function getBulkPricing(context: IntegrationContext, args: any) {
  // Implementation
}
```

### 4. Graceful Degradation

```typescript
export async function getProductWithSAPCCData(context: IntegrationContext, sku: string) {
  try {
    const rawProduct = await context.api.getProduct({ code: sku });
    const { normalizeProduct } = getNormalizers(context);
    
    // Try to get SAPCC-specific data
    let sapccExtras = {};
    try {
      sapccExtras = {
        classifications: rawProduct.classifications,
        manufacturer: rawProduct.manufacturer,
        averageRating: rawProduct.averageRating
      };
    } catch (error) {
      console.warn('Could not extract SAPCC-specific data:', error);
    }
    
    return {
      product: normalizeProduct(rawProduct),
      platformSpecific: sapccExtras
    };
  } catch (error) {
    throw new Error(`Failed to get product: ${error.message}`);
  }
}
```

### 5. Type Safety for SAPCC Fields

```typescript
// Define types for SAPCC-specific structures
interface SAPCCClassification {
  code: string;
  features: Array<{
    code: string;
    featureValues: Array<{
      value: string;
    }>;
    featureUnit?: {
      symbol: string;
    };
  }>;
}

interface SAPCCProduct extends UDLProduct {
  $custom?: {
    manufacturer?: string;
    classifications?: SAPCCClassification[];
    bulkPricingAvailable?: boolean;
  };
}

// Use typed access
function getManufacturer(product: SAPCCProduct): string | undefined {
  return product.$custom?.manufacturer;
}
```

## Summary

When accessing SAPCC-specific data in Alokai:

1. **Use `context.api`** to access raw SAPCC data in custom methods
2. **Always normalize** with `getNormalizers()` before returning data
3. **Extend normalizers** to add SAPCC fields to `$custom` properties  
4. **Access via `$custom`** in frontend components
5. **Document dependencies** on SAPCC-specific features
6. **Handle gracefully** when SAPCC features aren't available
7. **Maintain type safety** with proper TypeScript interfaces

This approach lets you leverage SAPCC's full capabilities while maintaining UDL compatibility for cross-platform support.