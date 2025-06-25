# AI Shopping Assistant Configuration Cookbook

*Version: v1.0*  
*Last Updated: 25 June 2025*

## Table of Contents
1. [Configuration Overview](#configuration-overview)
2. [Basic Configurations](#basic-configurations)
3. [Search Actions](#search-actions)
4. [Cart Management](#cart-management)
5. [Customer Actions](#customer-actions)
6. [B2B Configurations](#b2b-configurations)
7. [Advanced Patterns](#advanced-patterns)
8. [Integration Examples](#integration-examples)

## Configuration Overview

The AI Shopping Assistant uses a configuration-driven approach for defining actions. Each configuration file defines tools that the AI can use to help customers.

### Configuration Structure
```json
{
  "version": "1.0",
  "actions": [
    {
      "id": "unique-action-id",
      "name": "Human Readable Name",
      "description": "What this action does",
      "category": "search|cart|customer|comparison|b2b",
      "enabled": true,
      "parameters": {
        "paramName": {
          "type": "string|number|boolean|array|object",
          "required": true,
          "description": "Parameter description",
          "validation": {
            "pattern": "regex-pattern",
            "min": 0,
            "max": 100
          }
        }
      },
      "udl": {
        "methods": ["unified.searchProducts", "unified.getProductDetails"]
      },
      "intelligence": {
        "suggestions": ["next-action-id"],
        "mode": "b2c|b2b|both"
      }
    }
  ]
}
```

## Basic Configurations

### 1. Simple Product Search
```json
{
  "id": "search-products-basic",
  "name": "Search Products",
  "description": "Search for products by name or keyword",
  "category": "search",
  "parameters": {
    "query": {
      "type": "string",
      "required": true,
      "description": "Search query"
    }
  },
  "udl": {
    "methods": ["unified.searchProducts"]
  }
}
```

### 2. Product Details Lookup
```json
{
  "id": "get-product-details",
  "name": "Get Product Details",
  "description": "Retrieve detailed information about a specific product",
  "category": "search",
  "parameters": {
    "productId": {
      "type": "string",
      "required": true,
      "description": "Product ID or SKU"
    }
  },
  "udl": {
    "methods": ["unified.getProductDetails"]
  }
}
```

## Search Actions

### 3. Advanced Product Search with Filters
```json
{
  "id": "search-products-advanced",
  "name": "Advanced Product Search",
  "description": "Search products with category, price, and attribute filters",
  "category": "search",
  "parameters": {
    "query": {
      "type": "string",
      "required": false,
      "description": "Search query"
    },
    "category": {
      "type": "string",
      "required": false,
      "description": "Category ID or name"
    },
    "priceRange": {
      "type": "object",
      "required": false,
      "properties": {
        "min": { "type": "number" },
        "max": { "type": "number" }
      }
    },
    "attributes": {
      "type": "object",
      "required": false,
      "description": "Product attributes (color, size, etc.)"
    }
  },
  "udl": {
    "methods": ["unified.searchProducts"]
  },
  "intelligence": {
    "suggestions": ["compare-products", "add-to-cart"]
  }
}
```

### 4. Search by Product Attributes
```json
{
  "id": "search-by-attributes",
  "name": "Search by Attributes",
  "description": "Find products by specific attributes like color, size, or material",
  "category": "search",
  "parameters": {
    "attributes": {
      "type": "object",
      "required": true,
      "properties": {
        "color": { "type": "string" },
        "size": { "type": "string" },
        "material": { "type": "string" },
        "brand": { "type": "string" }
      }
    }
  },
  "udl": {
    "methods": ["unified.searchProducts"]
  }
}
```

### 5. Similar Products Search
```json
{
  "id": "find-similar-products",
  "name": "Find Similar Products",
  "description": "Find products similar to a given product",
  "category": "search",
  "parameters": {
    "productId": {
      "type": "string",
      "required": true,
      "description": "Reference product ID"
    },
    "limit": {
      "type": "number",
      "required": false,
      "default": 5,
      "validation": {
        "min": 1,
        "max": 20
      }
    }
  },
  "udl": {
    "methods": ["unified.getProductDetails", "unified.searchProducts"]
  }
}
```

## Cart Management

### 6. Add to Cart
```json
{
  "id": "add-to-cart",
  "name": "Add to Cart",
  "description": "Add a product to the shopping cart",
  "category": "cart",
  "parameters": {
    "productId": {
      "type": "string",
      "required": true,
      "description": "Product ID to add"
    },
    "quantity": {
      "type": "number",
      "required": false,
      "default": 1,
      "validation": {
        "min": 1,
        "max": 99
      }
    },
    "variantId": {
      "type": "string",
      "required": false,
      "description": "Specific variant ID"
    }
  },
  "udl": {
    "methods": ["unified.addCartLineItem"]
  },
  "intelligence": {
    "suggestions": ["view-cart", "checkout"]
  }
}
```

### 7. Update Cart Quantity
```json
{
  "id": "update-cart-quantity",
  "name": "Update Cart Quantity",
  "description": "Change the quantity of an item in the cart",
  "category": "cart",
  "parameters": {
    "lineItemId": {
      "type": "string",
      "required": true,
      "description": "Cart line item ID"
    },
    "quantity": {
      "type": "number",
      "required": true,
      "validation": {
        "min": 0,
        "max": 99
      }
    }
  },
  "udl": {
    "methods": ["unified.updateCartLineItem"]
  }
}
```

### 8. Apply Coupon
```json
{
  "id": "apply-coupon",
  "name": "Apply Coupon",
  "description": "Apply a discount coupon to the cart",
  "category": "cart",
  "parameters": {
    "couponCode": {
      "type": "string",
      "required": true,
      "description": "Coupon or promo code",
      "validation": {
        "pattern": "^[A-Z0-9]{5,15}$"
      }
    }
  },
  "udl": {
    "methods": ["unified.applyCoupon"]
  }
}
```

## Customer Actions

### 9. Get Order History
```json
{
  "id": "get-order-history",
  "name": "Get Order History",
  "description": "Retrieve customer's past orders",
  "category": "customer",
  "parameters": {
    "limit": {
      "type": "number",
      "required": false,
      "default": 10,
      "validation": {
        "min": 1,
        "max": 50
      }
    },
    "status": {
      "type": "string",
      "required": false,
      "enum": ["all", "pending", "shipped", "delivered", "cancelled"]
    }
  },
  "udl": {
    "methods": ["unified.getOrders"]
  }
}
```

### 10. Track Order
```json
{
  "id": "track-order",
  "name": "Track Order",
  "description": "Get tracking information for an order",
  "category": "customer",
  "parameters": {
    "orderId": {
      "type": "string",
      "required": true,
      "description": "Order ID or order number"
    }
  },
  "udl": {
    "methods": ["unified.getOrder"]
  }
}
```

### 11. Update Shipping Address
```json
{
  "id": "update-shipping-address",
  "name": "Update Shipping Address",
  "description": "Update the shipping address for the current order",
  "category": "customer",
  "parameters": {
    "address": {
      "type": "object",
      "required": true,
      "properties": {
        "street": { "type": "string", "required": true },
        "city": { "type": "string", "required": true },
        "state": { "type": "string", "required": true },
        "postalCode": { "type": "string", "required": true },
        "country": { "type": "string", "required": true }
      }
    }
  },
  "udl": {
    "methods": ["unified.setShippingAddress"]
  }
}
```

## B2B Configurations

### 12. Bulk Product Search
```json
{
  "id": "bulk-product-search",
  "name": "Bulk Product Search",
  "description": "Search for multiple products by SKU list",
  "category": "b2b",
  "parameters": {
    "skus": {
      "type": "array",
      "required": true,
      "description": "List of SKUs to search",
      "validation": {
        "maxItems": 100
      }
    }
  },
  "udl": {
    "methods": ["unified.searchProducts"]
  },
  "intelligence": {
    "mode": "b2b"
  }
}
```

### 13. Create Quote
```json
{
  "id": "create-quote",
  "name": "Create Quote",
  "description": "Create a B2B quote from current cart",
  "category": "b2b",
  "parameters": {
    "quoteName": {
      "type": "string",
      "required": true,
      "description": "Name for the quote"
    },
    "validUntil": {
      "type": "string",
      "required": false,
      "description": "Quote expiration date (ISO format)"
    },
    "notes": {
      "type": "string",
      "required": false,
      "description": "Additional notes for the quote"
    }
  },
  "udl": {
    "methods": ["customExtension.createQuote"]
  },
  "intelligence": {
    "mode": "b2b",
    "suggestions": ["share-quote", "convert-to-order"]
  }
}
```

### 14. Process CSV Upload
```json
{
  "id": "process-csv-upload",
  "name": "Process CSV Upload",
  "description": "Process bulk order from CSV file",
  "category": "b2b",
  "parameters": {
    "csvData": {
      "type": "string",
      "required": true,
      "description": "CSV content with SKU and quantity columns"
    },
    "columnMapping": {
      "type": "object",
      "required": false,
      "properties": {
        "sku": { "type": "string", "default": "SKU" },
        "quantity": { "type": "string", "default": "Quantity" }
      }
    }
  },
  "udl": {
    "methods": ["unified.searchProducts", "unified.addCartLineItem"]
  },
  "intelligence": {
    "mode": "b2b"
  }
}
```

### 15. Get Contract Pricing
```json
{
  "id": "get-contract-pricing",
  "name": "Get Contract Pricing",
  "description": "Retrieve B2B contract-specific pricing",
  "category": "b2b",
  "parameters": {
    "productIds": {
      "type": "array",
      "required": true,
      "description": "Product IDs to get pricing for"
    },
    "contractId": {
      "type": "string",
      "required": false,
      "description": "Specific contract ID"
    }
  },
  "udl": {
    "methods": ["customExtension.getContractPricing"]
  },
  "intelligence": {
    "mode": "b2b"
  }
}
```

## Advanced Patterns

### 16. Product Comparison
```json
{
  "id": "compare-products",
  "name": "Compare Products",
  "description": "Compare multiple products side by side",
  "category": "comparison",
  "parameters": {
    "productIds": {
      "type": "array",
      "required": true,
      "description": "List of product IDs to compare",
      "validation": {
        "minItems": 2,
        "maxItems": 4
      }
    },
    "attributes": {
      "type": "array",
      "required": false,
      "description": "Specific attributes to compare",
      "default": ["price", "features", "specifications"]
    }
  },
  "udl": {
    "methods": ["unified.getProductDetails"]
  },
  "intelligence": {
    "suggestions": ["add-to-cart", "find-similar-products"]
  }
}
```

### 17. Smart Reorder
```json
{
  "id": "smart-reorder",
  "name": "Smart Reorder",
  "description": "Reorder items from previous orders with stock checking",
  "category": "customer",
  "parameters": {
    "orderId": {
      "type": "string",
      "required": false,
      "description": "Specific order to reorder from"
    },
    "timeframe": {
      "type": "string",
      "required": false,
      "description": "Timeframe to consider (e.g., 'last-30-days')",
      "default": "last-90-days"
    }
  },
  "udl": {
    "methods": ["unified.getOrders", "unified.checkInventory", "unified.addCartLineItem"]
  },
  "intelligence": {
    "suggestions": ["checkout", "modify-quantities"]
  }
}
```

### 18. Inventory Check
```json
{
  "id": "check-inventory",
  "name": "Check Inventory",
  "description": "Check real-time inventory availability",
  "category": "search",
  "parameters": {
    "productId": {
      "type": "string",
      "required": true,
      "description": "Product ID to check"
    },
    "quantity": {
      "type": "number",
      "required": false,
      "default": 1,
      "description": "Quantity needed"
    },
    "location": {
      "type": "string",
      "required": false,
      "description": "Specific location/warehouse"
    }
  },
  "udl": {
    "methods": ["unified.checkInventory"]
  }
}
```

### 19. Wishlist Management
```json
{
  "id": "add-to-wishlist",
  "name": "Add to Wishlist",
  "description": "Add products to customer's wishlist",
  "category": "customer",
  "parameters": {
    "productId": {
      "type": "string",
      "required": true,
      "description": "Product to add to wishlist"
    },
    "listName": {
      "type": "string",
      "required": false,
      "default": "Default",
      "description": "Wishlist name"
    }
  },
  "udl": {
    "methods": ["customExtension.addToWishlist"]
  }
}
```

### 20. Multi-Store Search
```json
{
  "id": "multi-store-search",
  "name": "Multi-Store Search",
  "description": "Search products across multiple store locations",
  "category": "search",
  "parameters": {
    "query": {
      "type": "string",
      "required": true,
      "description": "Search query"
    },
    "stores": {
      "type": "array",
      "required": false,
      "description": "Specific store IDs to search"
    },
    "radius": {
      "type": "number",
      "required": false,
      "description": "Search radius in miles from user location"
    }
  },
  "udl": {
    "methods": ["customExtension.multiStoreSearch"]
  }
}
```

## Integration Examples

### 21. Complete Configuration File
```json
{
  "version": "1.0",
  "metadata": {
    "name": "E-commerce AI Assistant",
    "description": "Complete configuration for B2C/B2B commerce",
    "author": "Commerce Team",
    "lastUpdated": "2025-06-26"
  },
  "settings": {
    "defaultMode": "b2c",
    "enableB2B": true,
    "maxSuggestions": 3,
    "cacheTimeout": 300,
    "mockMode": false
  },
  "actions": [
    {
      "id": "search-products",
      "name": "Search Products",
      "description": "Search for products with advanced filtering",
      "category": "search",
      "enabled": true,
      "parameters": {
        "query": {
          "type": "string",
          "required": true,
          "description": "Search query"
        },
        "filters": {
          "type": "object",
          "required": false,
          "properties": {
            "category": { "type": "string" },
            "priceRange": {
              "type": "object",
              "properties": {
                "min": { "type": "number" },
                "max": { "type": "number" }
              }
            }
          }
        }
      },
      "udl": {
        "methods": ["unified.searchProducts"]
      },
      "intelligence": {
        "suggestions": ["add-to-cart", "compare-products"],
        "mode": "both"
      },
      "performance": {
        "cache": true,
        "timeout": 5000
      }
    }
  ]
}
```

### 22. Environment-Specific Override
```yaml
# config/production.yaml
version: "1.0"
extends: "base.json"
settings:
  cacheTimeout: 600
  enableDebug: false
actions:
  - id: "search-products"
    performance:
      cache: true
      timeout: 3000
  - id: "process-csv-upload"
    enabled: false  # Disabled in production until tested
```

## Best Practices

### 1. Parameter Validation
Always include validation rules for parameters:
```json
{
  "parameters": {
    "email": {
      "type": "string",
      "required": true,
      "validation": {
        "pattern": "^[\\w.-]+@[\\w.-]+\\.\\w+$"
      }
    }
  }
}
```

### 2. UDL Method Declaration
Always declare required UDL methods:
```json
{
  "udl": {
    "methods": [
      "unified.searchProducts",
      "unified.getProductDetails",
      "unified.checkInventory"
    ]
  }
}
```

### 3. Intelligence Hints
Provide intelligence hints for better suggestions:
```json
{
  "intelligence": {
    "suggestions": ["next-logical-action"],
    "mode": "b2c|b2b|both",
    "priority": "high|medium|low"
  }
}
```

### 4. Error Handling
Include error handling configuration:
```json
{
  "errorHandling": {
    "retry": {
      "enabled": true,
      "maxAttempts": 3,
      "backoff": "exponential"
    },
    "fallback": {
      "action": "show-error-message"
    }
  }
}
```

### 5. Performance Optimization
Configure caching and timeouts:
```json
{
  "performance": {
    "cache": true,
    "cacheKey": "query-${parameters.query}",
    "cacheTTL": 300,
    "timeout": 5000,
    "parallel": true
  }
}
```

## Configuration Loading

### Dynamic Loading
```typescript
// Load configuration at runtime
const config = await loadConfiguration('config/actions.json');
const registry = new ActionRegistry();
config.actions.forEach(action => registry.register(action));
```

### Hot Reload (Development)
```typescript
// Watch for configuration changes
if (process.env.NODE_ENV === 'development') {
  watchFile('config/actions.json', () => {
    reloadConfiguration();
  });
}
```

### Validation
```typescript
// Validate configuration on load
const schema = z.object({
  version: z.string(),
  actions: z.array(ActionSchema)
});

const validated = schema.parse(config);
```

## Mock Configuration (Demo Mode)

### Development Mock Configuration
```json
{
  "version": "1.0",
  "environment": "development",
  "settings": {
    "mockMode": true,
    "mockDataSource": "realistic",
    "mockDelay": 100,
    "debugMode": true
  },
  "mockData": {
    "products": {
      "count": 50,
      "categories": ["electronics", "apparel", "home"],
      "priceRange": { "min": 10, "max": 2000 }
    },
    "inventory": {
      "strategy": "random",
      "stockRange": { "min": 0, "max": 100 }
    },
    "users": {
      "b2c": 5,
      "b2b": 3
    }
  }
}
```

### Mock SDK Configuration
```typescript
// Configure mock SDK for demo mode
const mockConfig = {
  unified: {
    searchProducts: {
      responseTime: 150,
      resultCount: 10,
      includeVariants: true
    },
    addCartLineItem: {
      responseTime: 100,
      simulateErrors: false
    }
  },
  customExtension: {
    getBulkPricing: {
      tiers: [
        { min: 1, max: 24, discount: 0 },
        { min: 25, max: 99, discount: 10 },
        { min: 100, max: null, discount: 20 }
      ]
    }
  }
};
```

## Environment-Specific Configurations

### Development Environment
```json
{
  "version": "1.0",
  "environment": "development",
  "settings": {
    "enableDebugLogging": true,
    "enableHotReload": true,
    "mockMode": true,
    "rateLimits": {
      "requests": 1000,
      "window": 60000
    }
  },
  "overrides": {
    "timeouts": {
      "default": 10000,
      "llm": 30000
    },
    "cache": {
      "enabled": false
    }
  }
}
```

### Staging Environment
```json
{
  "version": "1.0",
  "environment": "staging",
  "settings": {
    "enableDebugLogging": true,
    "enableHotReload": false,
    "mockMode": false,
    "useRealBackend": true,
    "rateLimits": {
      "requests": 100,
      "window": 60000
    }
  },
  "overrides": {
    "timeouts": {
      "default": 5000,
      "llm": 15000
    },
    "cache": {
      "enabled": true,
      "ttl": 300
    }
  }
}
```

### Production Environment
```json
{
  "version": "1.0",
  "environment": "production",
  "settings": {
    "enableDebugLogging": false,
    "enableHotReload": false,
    "mockMode": false,
    "useRealBackend": true,
    "rateLimits": {
      "b2c": { "requests": 60, "window": 60000 },
      "b2b": { "requests": 120, "window": 60000 }
    }
  },
  "overrides": {
    "timeouts": {
      "default": 3000,
      "llm": 10000
    },
    "cache": {
      "enabled": true,
      "ttl": 600,
      "maxSize": 10000
    },
    "security": {
      "requireAuth": true,
      "enforceRateLimit": true,
      "validateInputs": true
    }
  }
}
```

## B2B Custom Extension Configuration

### Custom Extension Methods
```json
{
  "customExtensions": {
    "getBulkPricing": {
      "enabled": true,
      "cache": true,
      "cacheTTL": 1800,
      "implementation": "middleware",
      "endpoint": "/api/custom-methods/bulk-pricing"
    },
    "checkBulkAvailability": {
      "enabled": true,
      "cache": false,
      "implementation": "middleware",
      "endpoint": "/api/custom-methods/bulk-availability"
    },
    "createQuote": {
      "enabled": true,
      "requiresAuth": true,
      "permissions": ["create_quote"],
      "implementation": "middleware"
    },
    "scheduleProductDemo": {
      "enabled": true,
      "mockInDev": true,
      "implementation": "external",
      "service": "calendar-service"
    }
  }
}
```

## Performance Tuning Configuration

### Caching Strategy
```json
{
  "cache": {
    "strategies": {
      "search": {
        "enabled": true,
        "ttl": 300,
        "keyPattern": "search:${query}:${filters}",
        "maxSize": 1000
      },
      "productDetails": {
        "enabled": true,
        "ttl": 3600,
        "keyPattern": "product:${id}:${locale}",
        "maxSize": 5000
      },
      "bulkPricing": {
        "enabled": true,
        "ttl": 1800,
        "keyPattern": "bulk:${customerId}:${items}",
        "maxSize": 100
      }
    }
  }
}
```

### Parallel Processing
```json
{
  "performance": {
    "parallelization": {
      "searchProducts": {
        "batchSize": 10,
        "maxConcurrent": 3
      },
      "bulkOperations": {
        "batchSize": 25,
        "maxConcurrent": 5,
        "progressReporting": true
      }
    }
  }
}
```

## Configuration Migration

### From Mock to Production
```typescript
// Configuration transformer
function migrateConfiguration(mockConfig: Config, environment: string): Config {
  const prodConfig = { ...mockConfig };
  
  // Remove mock-specific settings
  delete prodConfig.mockData;
  prodConfig.settings.mockMode = false;
  
  // Add production settings
  prodConfig.settings.useRealBackend = true;
  prodConfig.security = {
    requireAuth: true,
    validateInputs: true,
    rateLimiting: true
  };
  
  // Update endpoints
  prodConfig.actions.forEach(action => {
    if (action.implementation === 'mock') {
      action.implementation = 'udl';
    }
  });
  
  return prodConfig;
}
```

## Configuration Best Practices

### 1. Start with Minimal Config
```json
{
  "version": "1.0",
  "actions": [
    { "id": "search-products", "enabled": true },
    { "id": "add-to-cart", "enabled": true }
  ]
}
```

### 2. Add Features Incrementally
```json
{
  "version": "1.1",
  "actions": [
    { "id": "search-products", "enabled": true },
    { "id": "add-to-cart", "enabled": true },
    { "id": "product-comparison", "enabled": true }  // New feature
  ]
}
```

### 3. Use Feature Flags
```json
{
  "featureFlags": {
    "enableB2B": false,
    "enableBulkUpload": false,
    "enableAdvancedSearch": true,
    "enableAIRecommendations": true
  }
}
```

### 4. Document Changes
```json
{
  "version": "1.2",
  "changelog": [
    {
      "version": "1.2",
      "date": "2025-06-26",
      "changes": ["Added B2B bulk operations", "Enhanced security"]
    }
  ]
}
```