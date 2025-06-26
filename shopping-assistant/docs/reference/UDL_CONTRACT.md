# UDL as a Contract: Bridging Frontend and E-commerce Platforms

## Overview

The Unified Data Layer (UDL) acts as a **contract** between your frontend application and various e-commerce platforms. This contract ensures that regardless of which e-commerce backend you use (SAP Commerce Cloud, Magento, commercetools, etc.), your frontend code remains the same.

Think of UDL as a universal adapter - you write your code once against the UDL interfaces, and it works with any supported e-commerce platform.

> **Related Documentation**: 
> - [SAPCC Specific Data Access Guide](./SAPCC_SPECIFIC_DATA_ACCESS.md) - Accessing platform-specific data
> - [UDL Comprehensive Guide](./UDL_COMPREHENSIVE_GUIDE.md) - Navigate all UDL documentation
> - [Full UDL Technical Reference](../unified-data-model/) - Detailed specifications

## The Contract Concept

### What Makes UDL a Contract?

1. **Standardized Interfaces**: UDL defines TypeScript interfaces for all e-commerce entities
2. **Guaranteed Methods**: Every platform must implement the same set of operations
3. **Consistent Data Shape**: Data always comes in the same format, regardless of source
4. **Platform Independence**: Frontend never knows (or cares) which backend it's talking to

```typescript
// This is the contract - your frontend only knows about these interfaces
interface SfProduct {
  id: SfId;
  sku: Maybe<string>;
  name: Maybe<string>;
  slug: string;
  price: Maybe<SfDiscountablePrice>;
  // ... other standardized fields
}

// Your frontend code - works with ANY backend
const product = await sdk.unified.getProductDetails({ id: "123" });
console.log(product.name); // Always works, regardless of backend
```

## Method Signatures: The Contract's Operations

UDL defines a standard set of operations that every e-commerce platform must support:

### Product Operations
```typescript
// Search products - same signature for all platforms
searchProducts(params: {
  search?: string;
  categoryId?: string;
  filters?: Record<string, string[]>;
  page?: number;
  pageSize?: number;
}): Promise<{
  products: SfProduct[];
  pagination: SfPagination;
  facets: SfFacet[];
}>

// Get product details - consistent across platforms
getProductDetails(params: {
  id: string;
  sku?: string;
}): Promise<SfProduct>
```

### Cart Operations
```typescript
// Add to cart - unified interface
addCartLineItem(params: {
  cartId?: string;
  productId: string;
  sku?: string;
  quantity: number;
}): Promise<SfCart>

// Update cart - same for all backends
updateCartLineItem(params: {
  cartId: string;
  lineItemId: string;
  quantity: number;
}): Promise<SfCart>
```

### Customer Operations
```typescript
// Get customer - standardized response
getCustomer(): Promise<{
  customer: SfCustomer | null;
}>

// Update customer - consistent interface
updateCustomer(params: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<SfCustomer>
```

## How SAPCC Implements the Contract

SAP Commerce Cloud fulfills the UDL contract through normalizers that transform its native data structures:

### Example: Product Normalization

```typescript
// SAPCC's native product structure
interface SapccProduct {
  code: string;
  name: string;
  price: { value: number; currencyIso: string };
  images: Array<{ url: string; format: string }>;
  stock: { stockLevel: number };
  averageRating: number;
  numberOfReviews: number;
}

// Normalizer fulfills the contract by transforming SAPCC data to UDL format
import { getNormalizers } from "@vsf-enterprise/unified-api-sapcc/udl";

export async function searchProducts(context, args) {
  // 1. Call SAPCC native API
  const sapccResponse = await context.api.searchProducts({
    query: args.search,
    pageSize: args.pageSize,
    currentPage: args.page
  });
  
  // 2. Get the normalizer for this platform
  const { normalizeProduct, normalizeFacet, normalizePagination } = getNormalizers(context);
  
  // 3. Transform SAPCC data to fulfill the UDL contract
  return {
    products: sapccResponse.products.map(p => normalizeProduct(p)),
    facets: sapccResponse.facets.map(f => normalizeFacet(f)),
    pagination: normalizePagination(sapccResponse.pagination)
  };
}
```

### Example: Cart Operations

```typescript
// SAPCC's implementation of addCartLineItem
export const addCartLineItem = async (context, args) => {
  const { normalizeCart } = getNormalizers(context);
  
  // SAPCC-specific API call
  const { data: orgCartEntries } = await context.api.doAddOrgCartEntries({
    cartId: args.cartId,
    orderEntryList: {
      orderEntries: [{
        quantity: args.quantity,
        product: { code: args.sku }
      }]
    }
  });
  
  // Fetch updated cart
  const { data: cart } = await context.api.getCart({ cartId: args.cartId });
  
  // Normalize to fulfill UDL contract
  return normalizeCart(cart);
};
```

## The Normalizer Pattern

Normalizers are the key to fulfilling the UDL contract. They act as adapters between platform-specific data and the standardized UDL format:

### Anatomy of a Normalizer

```typescript
function normalizeProduct(
  context: NormalizerContext,
  sapccProduct: SapccProduct  // Platform-specific input
): SfProduct {                 // UDL contract output
  return {
    // Map SAPCC fields to UDL fields
    id: sapccProduct.code,
    sku: sapccProduct.code,
    name: sapccProduct.name,
    slug: slugify(sapccProduct.code, sapccProduct.name),
    
    // Transform nested data
    price: {
      value: {
        amount: sapccProduct.price.value,
        currency: sapccProduct.price.currencyIso,
        precisionAmount: String(sapccProduct.price.value * 100)
      },
      regularPrice: { /* ... */ },
      isDiscounted: false
    },
    
    // Map availability
    quantityLimit: sapccProduct.stock?.stockLevel || null,
    
    // Transform ratings
    rating: sapccProduct.numberOfReviews > 0 ? {
      average: sapccProduct.averageRating,
      count: sapccProduct.numberOfReviews
    } : null,
    
    // ... other field mappings
  };
}
```

### Key Normalizer Rules

1. **Always Return UDL Format**: Output must match the contract interface exactly
2. **Handle Missing Data**: Use `null` or default values for missing fields
3. **Transform Complex Structures**: Nested objects must also follow UDL format
4. **Maintain Type Safety**: TypeScript ensures contract compliance

## Platform Switching: The Contract in Action

The true power of the UDL contract is demonstrated when switching e-commerce platforms:

### Before: Without UDL Contract
```typescript
// Frontend tightly coupled to SAPCC
const product = await sapccApi.getProduct(productCode);
const price = product.price.value; // SAPCC-specific field
const stock = product.stock.stockLevel; // SAPCC-specific structure

// Switching to Magento requires rewriting ALL frontend code
const product = await magentoApi.products.get(productId);
const price = product.price[0].amount.value; // Different structure!
const stock = product.extension_attributes.stock_item.qty; // Completely different!
```

### After: With UDL Contract
```typescript
// Frontend uses UDL contract
const product = await sdk.unified.getProductDetails({ id: productId });
const price = product.price?.value.amount; // Same for ALL platforms
const stock = product.quantityLimit; // Consistent interface

// Switching platforms requires ONLY configuration change:
// 1. Update middleware.config.ts
import { sapccConfig } from "./integrations/sapcc"; // Remove this
import { magentoConfig } from "./integrations/magento"; // Add this

// 2. Update the config
export const config = {
  integrations: {
    commerce: magentoConfig, // Changed from sapccConfig
  }
};

// Frontend code remains EXACTLY the same!
```

## Custom Extensions and the Contract

When adding custom functionality, you must maintain the contract:

### Adding Custom Fields
```typescript
// Extend the contract with custom fields
const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [{
      normalizeProduct(context, input) {
        return {
          // Custom fields go in $custom to maintain contract
          description: input.description,
          customAttribute: input.customData?.value
        };
      }
    }]
  }
});

// Frontend accesses custom fields through $custom
const product = await sdk.unified.getProductDetails({ id: "123" });
console.log(product.$custom.description); // Access custom fields
```

### Creating Custom Methods
```typescript
// Custom methods must use normalizers to maintain contract
export async function findSimilarProducts(context, args) {
  const { normalizeProduct } = getNormalizers(context);
  
  // Fetch data using platform-specific API
  const rawProducts = await context.api.searchSimilar(args.sku);
  
  // ALWAYS normalize to maintain contract
  return {
    products: rawProducts.map(p => normalizeProduct(p)),
    similarity: calculateSimilarity(rawProducts)
  };
}
```

## Contract Guarantees

The UDL contract provides these guarantees to frontend developers:

### 1. **Data Shape Consistency**
- `product.id` is always a string
- `product.price` always has `value.amount` and `value.currency`
- `cart.lineItems` is always an array of `SfCartLineItem`

### 2. **Method Availability**
- `searchProducts()` works on every platform
- `addCartLineItem()` has the same parameters everywhere
- Error handling is consistent across platforms

### 3. **Type Safety**
- TypeScript ensures contract compliance
- Auto-completion works consistently
- Type errors catch contract violations

### 4. **Null Safety**
- Optional fields use `Maybe<T>` type
- Null checks are consistent: `product.rating?.average`
- No platform-specific null handling needed

## Benefits of the Contract Approach

1. **Platform Independence**: Write once, run on any e-commerce platform
2. **Reduced Migration Cost**: Switching platforms is a configuration change
3. **Consistent Developer Experience**: Same APIs regardless of backend
4. **Type Safety**: Contract violations caught at compile time
5. **Testability**: Mock the contract, not specific platforms
6. **Maintainability**: Changes to backend don't affect frontend

## Summary

The UDL acts as a binding contract that:
- **Defines** standard interfaces for all e-commerce data
- **Guarantees** consistent method signatures across platforms
- **Ensures** data shape consistency through normalizers
- **Enables** platform switching without frontend changes
- **Provides** type safety and developer confidence

By adhering to this contract, your frontend application becomes truly platform-agnostic, allowing you to focus on building features rather than handling platform differences.

## Extending Beyond the Contract

While the UDL contract covers most common e-commerce operations, you may need access to platform-specific features. The contract is designed to be extended:

- **Custom Fields**: Add platform-specific data via the `$custom` property
- **Custom Methods**: Create new operations for platform-specific features
- **Raw API Access**: Access the underlying platform API when needed

📚 **Learn More**: See [SAPCC Specific Data Access Guide](./SAPCC_SPECIFIC_DATA_ACCESS.md) for detailed examples of extending the UDL contract with SAPCC-specific features while maintaining compatibility.