# AI Agent Integration Guide

*Version: v1.0*  
*Last Updated: 25 June 2025*

## Overview

This guide explains how AI agents and developers can extend the AI Shopping Assistant's capabilities through its configuration-driven architecture. The system is designed to be extended without modifying core code.

## Table of Contents
1. [Architecture for AI Agents](#architecture-for-ai-agents)
2. [Creating New Actions](#creating-new-actions)
3. [Integration Patterns](#integration-patterns)
4. [Testing Your Integration](#testing-your-integration)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

## Architecture for AI Agents

The AI Shopping Assistant uses a configuration-driven tool system that allows AI agents to:
- Add new commerce capabilities via JSON/YAML configuration
- Integrate with external services through the action framework
- Extend the assistant's intelligence with custom logic
- Create specialized B2B workflows

### Key Concepts

1. **Actions**: Discrete units of functionality (search, add to cart, etc.)
2. **Action Registry**: Dynamic registry that loads actions from configuration
3. **Tool Factory Pattern**: Converts action definitions into LangGraph-compatible tools
4. **Command Pattern**: Actions return commands that update graph state
5. **UDL Integration**: All data access through Alokai's Unified Data Layer
6. **Intelligence Layer**: Mode detection and context enrichment

## Tool Factory Pattern (Implementation Details)

The AI Shopping Assistant uses a sophisticated Tool Factory Pattern to dynamically convert action definitions into LangGraph-compatible tools. This pattern was refined during implementation to provide maximum flexibility.

### How It Works

```typescript
// The Tool Factory converts actions to LangGraph tools
class ToolFactory {
  createTool(action: ActionDefinition): StructuredTool {
    return new DynamicStructuredTool({
      name: action.id,
      description: action.description,
      schema: this.generateSchema(action.parameters),
      
      // The magic: Convert action execution to command
      func: async (params: any) => {
        // Execute the action
        const result = await action.execute(params, this.context);
        
        // Return command for state update
        return {
          type: 'UPDATE_STATE',
          payload: {
            lastAction: action.id,
            actionResult: result,
            suggestedNext: action.intelligence?.suggestions
          }
        };
      }
    });
  }
  
  // Generate Zod schema from parameter definitions
  private generateSchema(parameters: ParameterDefinitions): z.ZodObject<any> {
    const shape: Record<string, z.ZodType<any>> = {};
    
    for (const [key, param] of Object.entries(parameters)) {
      shape[key] = this.paramToZod(param);
    }
    
    return z.object(shape);
  }
}
```

### Command Pattern Integration

```typescript
// Actions return commands that update the graph state
interface Command {
  type: string;
  payload: any;
}

// The graph processes commands to update state
const processCommand = (state: State, command: Command): State => {
  switch (command.type) {
    case 'UPDATE_STATE':
      return {
        ...state,
        ...command.payload,
        messages: [...state.messages, AIMessage(command.payload.message)]
      };
      
    case 'UPDATE_CART':
      return {
        ...state,
        cart: command.payload.cart,
        cartUpdated: true
      };
      
    case 'SET_MODE':
      return {
        ...state,
        mode: command.payload.mode
      };
      
    default:
      return state;
  }
};
```

### ToolNode Orchestration

```typescript
// LangGraph's ToolNode handles tool execution
const toolNode = new ToolNode(tools);

// The node automatically:
// 1. Selects appropriate tools based on LLM decision
// 2. Validates parameters against schema
// 3. Executes tools in parallel when possible
// 4. Handles errors gracefully
// 5. Returns results for state update
```

### Dynamic Registration Process

```typescript
// Tools are registered dynamically at runtime
export async function registerDynamicTools(registry: ActionRegistry) {
  // Load from configuration
  const config = await loadConfiguration();
  
  // Convert each action to a tool
  const tools = config.actions.map(actionDef => {
    // Create action implementation
    const action = createActionFromDefinition(actionDef);
    
    // Register with registry
    registry.register(action);
    
    // Convert to LangGraph tool
    return toolFactory.createTool(action);
  });
  
  // Return tools for graph construction
  return tools;
}
```

## Creating New Actions

### Step 1: Define Action Configuration

Create a JSON configuration file for your action:

```json
{
  "id": "my-custom-action",
  "name": "My Custom Action",
  "description": "Detailed description for the LLM to understand when to use this action",
  "category": "search|cart|customer|comparison|b2b",
  "parameters": {
    "param1": {
      "type": "string",
      "required": true,
      "description": "Parameter description for the LLM",
      "validation": {
        "pattern": "^[A-Z0-9]+$",
        "minLength": 3,
        "maxLength": 50
      }
    },
    "param2": {
      "type": "number",
      "required": false,
      "default": 10,
      "validation": {
        "min": 1,
        "max": 100
      }
    }
  },
  "udl": {
    "methods": ["unified.searchProducts", "unified.getProductDetails"],
    "required": true
  },
  "intelligence": {
    "mode": "both",
    "suggestions": ["next-action-id"],
    "priority": "high"
  }
}
```

### Step 2: Implement Action Logic

Create the action implementation:

```typescript
// actions/implementations/my-custom-action.ts
import { ActionDefinition, Context } from '../types';

export const myCustomAction: ActionDefinition = {
  id: 'my-custom-action',
  name: 'My Custom Action',
  description: 'Performs custom commerce logic',
  category: 'search',
  
  parameters: {
    param1: {
      type: 'string',
      required: true,
      description: 'Main parameter'
    }
  },
  
  // CRITICAL: Use UDL for all data access
  async execute(params: any, context: Context) {
    const { sdk } = context;
    
    // Always use UDL methods
    const products = await sdk.unified.searchProducts({
      search: params.param1
    });
    
    // Process results
    const enriched = products.map(product => ({
      ...product,
      customScore: this.calculateScore(product)
    }));
    
    return {
      products: enriched,
      totalCount: enriched.length,
      metadata: {
        processedAt: new Date().toISOString()
      }
    };
  },
  
  // Optional: Pre-processing for mode-specific behavior
  preProcess(params: any, mode: 'b2c' | 'b2b') {
    if (mode === 'b2b') {
      return {
        ...params,
        includeContractPricing: true
      };
    }
    return params;
  },
  
  // Optional: Post-processing for response enhancement
  postProcess(result: any, mode: 'b2c' | 'b2b') {
    if (mode === 'b2b') {
      return {
        ...result,
        bulkDiscounts: this.calculateBulkDiscounts(result.products)
      };
    }
    return result;
  }
};
```

### Step 3: Register Your Action

Register the action with the system:

```typescript
// config/custom-actions.ts
import { ActionRegistry } from '@/features/ai-shopping-assistant/actions/registry';
import { myCustomAction } from './implementations/my-custom-action';

export function registerCustomActions(registry: ActionRegistry) {
  registry.register(myCustomAction);
  
  // Or load from configuration file
  const config = await loadConfig('custom-actions.json');
  config.actions.forEach(action => registry.register(action));
}
```

### Understanding the Registration Flow

```typescript
// 1. Action is registered
registry.register(myCustomAction);

// 2. Registry validates the action
// - Checks required fields
// - Validates parameter schemas
// - Verifies UDL method usage

// 3. Tool Factory creates LangGraph tool
const tool = toolFactory.createTool(myCustomAction);

// 4. Tool is added to graph
graph.addNode('tools', new ToolNode([tool, ...otherTools]));

// 5. LLM can now select and use your action
// User: "Use my custom logic to find products"
// LLM: Selects 'my-custom-action' tool
// Graph: Executes your action implementation
```

## Integration Patterns

### 1. External Service Integration

```typescript
export const externalServiceAction: ActionDefinition = {
  id: 'external-service',
  name: 'External Service Integration',
  
  async execute(params: any, context: Context) {
    // 1. Get data from UDL
    const products = await context.sdk.unified.searchProducts({
      search: params.query
    });
    
    // 2. Enhance with external service
    const enhanced = await Promise.all(
      products.map(async (product) => {
        const externalData = await callExternalAPI({
          productId: product.id
        });
        
        return {
          ...product,
          externalData
        };
      })
    );
    
    return { products: enhanced };
  }
};
```

### 2. Multi-Step Workflow

```typescript
export const multiStepWorkflow: ActionDefinition = {
  id: 'multi-step-workflow',
  name: 'Complex Multi-Step Process',
  
  async execute(params: any, context: Context) {
    const { sdk } = context;
    const results = {};
    
    // Step 1: Search products
    results.products = await sdk.unified.searchProducts({
      search: params.category
    });
    
    // Step 2: Check inventory for each
    results.inventory = await sdk.unified.checkInventory(
      results.products.map(p => p.id)
    );
    
    // Step 3: Get pricing with customer context
    if (context.customerId) {
      results.pricing = await sdk.customExtension.getCustomerPricing({
        customerId: context.customerId,
        productIds: results.products.map(p => p.id)
      });
    }
    
    // Step 4: Apply business logic
    const recommendations = this.generateRecommendations(results);
    
    return {
      recommendations,
      metadata: {
        stepsCompleted: 4,
        processingTime: Date.now() - startTime
      }
    };
  }
};
```

### 3. Streaming Response Action

```typescript
export const streamingAction: ActionDefinition = {
  id: 'streaming-search',
  name: 'Streaming Search Results',
  
  async *execute(params: any, context: Context) {
    const { sdk } = context;
    
    // Stream results as they become available
    const categories = params.categories || ['electronics', 'clothing', 'home'];
    
    for (const category of categories) {
      const products = await sdk.unified.searchProducts({
        search: params.query,
        category
      });
      
      // Yield partial results
      yield {
        type: 'partial',
        category,
        products,
        progress: categories.indexOf(category) / categories.length
      };
    }
    
    // Final result
    yield {
      type: 'complete',
      message: 'Search completed across all categories'
    };
  }
};
```

## Testing Your Integration

### 1. Unit Testing

```typescript
import { describe, it, expect } from '@jest/globals';
import { myCustomAction } from './my-custom-action';
import { createTestContext } from '@/features/ai-shopping-assistant/testing/test-utils';

describe('My Custom Action', () => {
  it('should execute successfully', async () => {
    // Create test context with mock SDK
    const context = createTestContext({
      mockProducts: [
        { id: '1', name: 'Test Product', price: 99.99 }
      ]
    });
    
    // Execute action
    const result = await myCustomAction.execute(
      { param1: 'test' },
      context
    );
    
    // Verify results
    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe('Test Product');
  });
  
  it('should handle B2B mode correctly', async () => {
    const context = createTestContext({ mode: 'b2b' });
    
    const params = myCustomAction.preProcess?.(
      { param1: 'test' },
      'b2b'
    );
    
    expect(params?.includeContractPricing).toBe(true);
  });
});
```

### 2. Integration Testing

```typescript
import { LangGraphTestHarness } from '@/features/ai-shopping-assistant/testing/harness';

describe('Integration Tests', () => {
  let harness: LangGraphTestHarness;
  
  beforeEach(() => {
    harness = new LangGraphTestHarness();
    harness.registerAction(myCustomAction);
  });
  
  it('should be selected by AI for relevant queries', async () => {
    const response = await harness.query(
      'Find products using my custom logic'
    );
    
    expect(response.actionsUsed).toContain('my-custom-action');
    expect(response.results).toBeDefined();
  });
});
```

### 3. Performance Testing

```typescript
import { PerformanceTester } from '@/features/ai-shopping-assistant/testing/performance';

describe('Performance Tests', () => {
  it('should meet performance targets', async () => {
    const tester = new PerformanceTester();
    
    const results = await tester.benchmark(myCustomAction, {
      iterations: 100,
      params: { param1: 'test' }
    });
    
    expect(results.p95).toBeLessThan(250); // 250ms target
    expect(results.p99).toBeLessThan(500);
  });
});
```

## Implementation Insights from Production

### Tool Selection by LLM

The LLM selects tools based on:
1. **Description Quality**: Clear, specific descriptions improve selection accuracy
2. **Parameter Documentation**: Well-documented parameters guide proper usage
3. **Category Alignment**: Proper categorization helps with intent matching
4. **Intelligence Hints**: Suggestions and mode hints improve workflow

```typescript
// Example of well-documented action for optimal LLM selection
export const searchWithFilters: ActionDefinition = {
  id: 'search-with-filters',
  name: 'Advanced Product Search',
  // Specific description helps LLM understand when to use this
  description: 'Search for products with advanced filtering by price, category, brand, and attributes. Use this when the user wants to narrow down results with specific criteria.',
  category: 'search',
  
  parameters: {
    query: {
      type: 'string',
      required: false,
      // Clear parameter description
      description: 'Search keywords (optional if using filters)'
    },
    filters: {
      type: 'object',
      required: false,
      // Detailed schema helps LLM construct correct params
      description: 'Filter criteria object',
      properties: {
        priceMin: { type: 'number', description: 'Minimum price in dollars' },
        priceMax: { type: 'number', description: 'Maximum price in dollars' },
        category: { type: 'string', description: 'Category ID or name' },
        brand: { type: 'string', description: 'Brand name' }
      }
    }
  },
  
  // Intelligence hints guide the workflow
  intelligence: {
    suggestions: ['add-to-cart', 'compare-products'],
    mode: 'both',
    examples: [
      'Find laptops under $1000',
      'Show me Nike shoes between $50 and $150',
      'Search for electronics in the smartphone category'
    ]
  }
};
```

### State Management Patterns

```typescript
// Actions should return structured commands for predictable state updates
export const cartAction: ActionDefinition = {
  async execute(params: any, context: Context) {
    const result = await context.sdk.unified.addCartLineItem(params);
    
    // Return command pattern for state update
    return {
      type: 'CART_UPDATED',
      payload: {
        cart: result.cart,
        addedItem: {
          productId: params.productId,
          quantity: params.quantity
        },
        message: `Added ${params.quantity} item(s) to cart`,
        suggestions: [
          { action: 'view-cart', label: 'View Cart' },
          { action: 'checkout', label: 'Proceed to Checkout' }
        ]
      }
    };
  }
};
```

## Best Practices

### 1. Always Use UDL

```typescript
// ❌ WRONG - Direct API call
const products = await fetch('/api/products');

// ✅ CORRECT - Through UDL
const products = await context.sdk.unified.searchProducts({ search: query });
```

### 2. Handle Errors Gracefully

```typescript
async execute(params: any, context: Context) {
  try {
    const result = await context.sdk.unified.searchProducts(params);
    return { success: true, products: result };
  } catch (error) {
    // Log error for debugging
    context.logger.error('Search failed', { error, params });
    
    // Return user-friendly error
    return {
      success: false,
      error: 'Unable to search products. Please try again.',
      errorCode: 'SEARCH_FAILED'
    };
  }
}
```

### 3. Optimize for Performance

```typescript
async execute(params: any, context: Context) {
  // Parallel requests when possible
  const [products, categories, inventory] = await Promise.all([
    context.sdk.unified.searchProducts({ search: params.query }),
    context.sdk.unified.getCategories(),
    context.sdk.unified.checkInventory(params.productIds || [])
  ]);
  
  // Use caching for repeated operations
  const cacheKey = `search:${params.query}`;
  const cached = await context.cache.get(cacheKey);
  if (cached) return cached;
  
  const result = processResults(products, categories, inventory);
  await context.cache.set(cacheKey, result, 300); // 5 min TTL
  
  return result;
}
```

### 4. Provide Rich Responses

```typescript
return {
  // Primary data
  products: enrichedProducts,
  
  // Metadata for UI
  totalCount: products.total,
  facets: products.facets,
  
  // Suggestions for next actions
  suggestions: [
    { action: 'compare-products', label: 'Compare selected items' },
    { action: 'add-to-cart', label: 'Add to cart' }
  ],
  
  // UI hints
  display: {
    type: 'product-grid',
    columns: 3,
    showFilters: true
  }
};
```

## Examples

### Example 1: Personalized Recommendations

```typescript
export const personalizedRecommendations: ActionDefinition = {
  id: 'personalized-recommendations',
  name: 'Get Personalized Recommendations',
  description: 'Get product recommendations based on user history and preferences',
  category: 'search',
  
  parameters: {
    limit: {
      type: 'number',
      required: false,
      default: 10,
      description: 'Number of recommendations'
    }
  },
  
  async execute(params: any, context: Context) {
    const { sdk, customerId } = context;
    
    if (!customerId) {
      // Fallback to trending products for anonymous users
      return await sdk.unified.searchProducts({
        category: 'trending',
        limit: params.limit
      });
    }
    
    // Get customer data
    const [customer, orderHistory] = await Promise.all([
      sdk.unified.getCustomer({ customerId }),
      sdk.unified.getOrders({ customerId, limit: 10 })
    ]);
    
    // Extract preferences from history
    const preferences = this.analyzePreferences(orderHistory);
    
    // Get personalized recommendations
    const recommendations = await sdk.customExtension.getRecommendations({
      customerId,
      preferences,
      limit: params.limit
    });
    
    return {
      recommendations,
      basedOn: preferences,
      personalizedFor: customer.email
    };
  },
  
  analyzePreferences(orders: Order[]) {
    // Extract categories, brands, price ranges from order history
    const categories = new Set<string>();
    const brands = new Set<string>();
    let totalSpent = 0;
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.category) categories.add(item.category);
        if (item.brand) brands.add(item.brand);
        totalSpent += item.price * item.quantity;
      });
    });
    
    return {
      preferredCategories: Array.from(categories),
      preferredBrands: Array.from(brands),
      averageOrderValue: totalSpent / orders.length,
      purchaseFrequency: this.calculateFrequency(orders)
    };
  }
};
```

### Example 2: B2B Bulk Quote Generator

```typescript
export const b2bBulkQuote: ActionDefinition = {
  id: 'b2b-bulk-quote',
  name: 'Generate B2B Bulk Quote',
  description: 'Generate a quote for bulk B2B orders with tiered pricing',
  category: 'b2b',
  
  parameters: {
    items: {
      type: 'array',
      required: true,
      description: 'Array of {sku, quantity} objects'
    },
    contractId: {
      type: 'string',
      required: false,
      description: 'B2B contract ID for special pricing'
    }
  },
  
  async execute(params: any, context: Context) {
    const { sdk } = context;
    
    // Validate B2B access
    if (context.mode !== 'b2b') {
      throw new Error('This action requires B2B access');
    }
    
    // Get products and contract pricing
    const skus = params.items.map(item => item.sku);
    const [products, contractPricing] = await Promise.all([
      sdk.unified.searchProducts({ skus }),
      params.contractId 
        ? sdk.customExtension.getContractPricing({
            contractId: params.contractId,
            skus
          })
        : null
    ]);
    
    // Calculate tiered pricing
    const quoteItems = params.items.map(item => {
      const product = products.find(p => p.sku === item.sku);
      if (!product) {
        return {
          sku: item.sku,
          error: 'Product not found'
        };
      }
      
      const basePrice = contractPricing?.[item.sku] || product.price.value;
      const tierPrice = this.calculateTierPrice(basePrice, item.quantity);
      
      return {
        sku: item.sku,
        name: product.name,
        quantity: item.quantity,
        unitPrice: basePrice,
        tierPrice,
        totalPrice: tierPrice * item.quantity,
        savings: (basePrice - tierPrice) * item.quantity
      };
    });
    
    // Generate quote
    const quote = {
      id: this.generateQuoteId(),
      items: quoteItems,
      subtotal: quoteItems.reduce((sum, item) => sum + item.totalPrice, 0),
      totalSavings: quoteItems.reduce((sum, item) => sum + item.savings, 0),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'draft'
    };
    
    // Save quote
    await sdk.customExtension.saveQuote(quote);
    
    return {
      quote,
      message: `Quote ${quote.id} generated with ${quote.totalSavings} in savings`,
      actions: [
        { id: 'approve-quote', label: 'Approve Quote' },
        { id: 'modify-quote', label: 'Modify Items' },
        { id: 'share-quote', label: 'Share with Team' }
      ]
    };
  },
  
  calculateTierPrice(basePrice: number, quantity: number): number {
    if (quantity >= 1000) return basePrice * 0.7;  // 30% off
    if (quantity >= 500) return basePrice * 0.8;   // 20% off
    if (quantity >= 100) return basePrice * 0.9;   // 10% off
    if (quantity >= 50) return basePrice * 0.95;   // 5% off
    return basePrice;
  }
};
```

### Example 3: Intelligent Inventory Checker

```typescript
export const intelligentInventoryCheck: ActionDefinition = {
  id: 'intelligent-inventory-check',
  name: 'Check Inventory with Alternatives',
  description: 'Check inventory and suggest alternatives for out-of-stock items',
  category: 'search',
  
  parameters: {
    productIds: {
      type: 'array',
      required: true,
      description: 'Product IDs to check'
    },
    location: {
      type: 'string',
      required: false,
      description: 'Preferred warehouse/store location'
    }
  },
  
  async execute(params: any, context: Context) {
    const { sdk } = context;
    
    // Check inventory
    const inventory = await sdk.unified.checkInventory(
      params.productIds,
      { location: params.location }
    );
    
    // Find alternatives for out-of-stock items
    const results = await Promise.all(
      inventory.map(async (item) => {
        if (item.available) {
          return {
            productId: item.productId,
            available: true,
            quantity: item.quantity,
            location: item.location
          };
        }
        
        // Find alternatives
        const product = await sdk.unified.getProductDetails({
          id: item.productId
        });
        
        const alternatives = await sdk.unified.searchProducts({
          category: product.category,
          attributes: {
            brand: product.brand,
            priceRange: {
              min: product.price.value * 0.8,
              max: product.price.value * 1.2
            }
          },
          inStock: true,
          limit: 3
        });
        
        return {
          productId: item.productId,
          available: false,
          alternatives: alternatives.map(alt => ({
            id: alt.id,
            name: alt.name,
            price: alt.price.value,
            availability: 'In Stock',
            similarity: this.calculateSimilarity(product, alt)
          })).sort((a, b) => b.similarity - a.similarity)
        };
      })
    );
    
    return {
      inventoryStatus: results,
      summary: {
        available: results.filter(r => r.available).length,
        unavailable: results.filter(r => !r.available).length,
        alternativesFound: results.filter(r => r.alternatives?.length > 0).length
      }
    };
  }
};
```

## Debugging Your Integration

### Enable Debug Mode

```typescript
// In your action
export const debuggableAction: ActionDefinition = {
  async execute(params: any, context: Context) {
    if (context.debug) {
      console.log('[MyAction] Input params:', params);
      console.log('[MyAction] Context:', context);
    }
    
    const result = await doWork(params, context);
    
    if (context.debug) {
      console.log('[MyAction] Result:', result);
    }
    
    return result;
  }
};
```

### Use the Test Harness

```bash
# Run your action in isolation
npm run test:action -- --action=my-custom-action --params='{"param1":"test"}'

# Test with different modes
npm run test:action -- --action=my-custom-action --mode=b2b

# Profile performance
npm run test:action -- --action=my-custom-action --profile
```

## Publishing Your Integration

1. **Package your action**:
```json
{
  "name": "@company/ai-assistant-plugin-inventory",
  "version": "1.0.0",
  "main": "dist/index.js",
  "aiAssistant": {
    "actions": [
      "intelligent-inventory-check"
    ],
    "version": "1.0"
  }
}
```

2. **Export your actions**:
```typescript
// index.ts
export { intelligentInventoryCheck } from './actions/inventory';
export { config } from './config';
```

3. **Document your integration**:
- Clear description of what your action does
- Required UDL methods
- Example usage
- Performance characteristics

## Common Pitfalls and Solutions

### 1. Tool Not Being Selected

**Problem**: Your action is registered but never selected by the LLM

**Solution**:
```typescript
// Add clear examples and keywords
intelligence: {
  keywords: ['inventory', 'stock', 'availability'],
  examples: [
    'Check if product X is in stock',
    'Is this available in my size?',
    'Show inventory levels'
  ]
}
```

### 2. Parameter Validation Errors

**Problem**: LLM provides incorrect parameter types

**Solution**:
```typescript
// Provide default values and clear types
parameters: {
  quantity: {
    type: 'number',
    required: false,
    default: 1,
    description: 'Number of items (defaults to 1)',
    validation: {
      min: 1,
      max: 99,
      integer: true
    }
  }
}
```

### 3. State Update Issues

**Problem**: Action executes but state doesn't update correctly

**Solution**:
```typescript
// Use proper command structure
return {
  type: 'UPDATE_STATE',
  payload: {
    // Include all necessary state updates
    actionResult: result,
    stateChanges: {
      cartUpdated: true,
      lastAction: this.id
    },
    // Provide UI hints
    uiUpdate: {
      showNotification: true,
      notificationType: 'success',
      message: 'Action completed successfully'
    }
  }
};
```

## Tool Factory Advanced Features

### Custom Tool Validators

```typescript
// Add custom validation logic
toolFactory.addValidator('price-check', (params) => {
  if (params.maxPrice && params.maxPrice < params.minPrice) {
    throw new Error('Max price must be greater than min price');
  }
});
```

### Tool Composition

```typescript
// Compose complex tools from simpler ones
const composedTool = toolFactory.compose([
  searchTool,
  filterTool,
  sortTool
], {
  name: 'advanced-search',
  description: 'Advanced search with filtering and sorting'
});
```

### Performance Optimization

```typescript
// Tools can indicate their performance characteristics
export const heavyAction: ActionDefinition = {
  performance: {
    estimatedDuration: 5000, // 5 seconds
    cacheable: true,
    cacheKey: (params) => `heavy:${params.id}`,
    priority: 'low' // Can be deferred
  }
};
```

## Support

For questions about extending the AI Shopping Assistant:
- Review the [Architecture Documentation](./ARCHITECTURE.md)
- Check the [Configuration Cookbook](./CONFIGURATION_COOKBOOK.md)
- Consult the [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Study the [Performance Tuning Guide](./PERFORMANCE_TUNING.md) for optimization tips