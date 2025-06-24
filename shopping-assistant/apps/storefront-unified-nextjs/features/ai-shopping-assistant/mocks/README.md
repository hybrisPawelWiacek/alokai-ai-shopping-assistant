# Mock Implementation Guide

This directory contains mock implementations that follow Alokai's Unified Data Layer (UDL) patterns. These mocks enable development without backend dependencies while ensuring compatibility with the real SDK.

## Overview

All mock implementations are structured to match the exact response format of Alokai's SDK methods. When the backend is ready, you can replace mock calls with real SDK calls with minimal code changes.

## Key Files

- `mock-sdk-factory.ts` - Centralized factory for creating mock SDK instances
- `custom-extension-mock.ts` - Mock implementations of custom B2B methods
- `../types/mock-responses.ts` - TypeScript interfaces matching UDL response structures

## Usage

### 1. Search Implementation

```typescript
// Current mock usage
const searchResults = await performSearch(params, context);

// Replace with real SDK
const searchResults = await context.sdk.unified.searchProducts(params);
```

### 2. B2B Custom Methods

```typescript
// Current mock usage
import { mockCustomExtension } from './mocks/custom-extension-mock';
const pricing = await mockCustomExtension.getBulkPricing(params);

// Replace with real SDK
const pricing = await sdk.customExtension.getBulkPricing(params);
```

### 3. Alternative Product Suggestions

```typescript
// Current mock usage
const alternatives = await mockCustomExtension.findSimilarProducts(params);

// Replace with real SDK
const alternatives = await sdk.customExtension.findSimilarProducts(params);
```

## Mock Data Structure

All mocks follow the exact UDL structure:

### Product Structure
```typescript
{
  id: string;
  sku: string;
  name: string;
  price: {
    value: { amount: number, currency: string },
    regular: { amount: number, currency: string },
    special?: { amount: number, currency: string }
  };
  // ... other UDL fields
}
```

### Search Response
```typescript
{
  products: Product[];
  pagination: { page, perPage, total, totalPages };
  facets: Facet[];
}
```

## Migration Checklist

When migrating to real SDK:

1. **Search & Product Details**
   - [ ] Replace `performSearch()` with `sdk.unified.searchProducts()`
   - [ ] Replace `fetchProductDetails()` with `sdk.unified.getProductDetails()`

2. **B2B Operations**
   - [ ] Replace `mockCustomExtension.getBulkPricing()` with `sdk.customExtension.getBulkPricing()`
   - [ ] Replace `mockCustomExtension.checkBulkAvailability()` with `sdk.customExtension.checkBulkAvailability()`
   - [ ] Replace all other mock custom methods

3. **Cart Operations**
   - [ ] Verify cart operations use `sdk.unified.*` methods (already implemented correctly)

4. **Alternative Suggestions**
   - [ ] Implement `findSimilarProducts` in middleware
   - [ ] Update bulk order action to use real custom extension

## TODO Comments

All mock implementations include TODO comments showing the exact SDK method to use:

```typescript
// TODO: Replace with context.sdk.unified.searchProducts(params)
```

## Testing

The mock implementations include:
- Realistic delays (50-200ms)
- Proper error scenarios
- B2B/B2C mode differentiation
- Pagination and filtering logic

## Benefits

1. **Type Safety**: All mocks use proper TypeScript interfaces
2. **Easy Migration**: One-line replacements when backend is ready
3. **Realistic Behavior**: Includes delays, filtering, and error scenarios
4. **Development Speed**: No backend dependencies for frontend development