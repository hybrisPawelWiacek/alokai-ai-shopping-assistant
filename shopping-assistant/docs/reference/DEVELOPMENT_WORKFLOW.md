# Development Workflow Guide

*Version: v1.0*  
*Last Updated: 25 June 2025*

This guide explains how to add new features and actions to the AI Shopping Assistant.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Adding a New Action](#adding-a-new-action)
3. [Development Environment](#development-environment)
4. [Testing Workflow](#testing-workflow)
5. [Code Review Checklist](#code-review-checklist)
6. [Deployment Process](#deployment-process)

## Quick Start

### Prerequisites
```bash
# Required tools
node >= 18.0.0
yarn >= 1.22.0
git >= 2.30.0

# Clone and setup
git clone <repository>
cd shopping-assistant
yarn install
yarn init
```

### Start Development
```bash
# Start everything (frontend + middleware)
yarn dev

# Or start separately
yarn dev:next       # Frontend only (http://localhost:3000)
yarn dev:middleware # Middleware only (http://localhost:4000)

# Run in demo mode (no backend required)
NEXT_PUBLIC_DEMO_MODE=true yarn dev
```

## Adding a New Action

### Step 1: Plan Your Action

Before coding, answer these questions:
1. What problem does this action solve?
2. What UDL methods will it need?
3. Is it B2C, B2B, or both?
4. What parameters does it need?
5. What should it return?

### Step 2: Create Configuration

Create a configuration file for your action:

```typescript
// config/actions/my-new-action.json
{
  "id": "my-new-action",
  "name": "My New Action",
  "description": "Clear description for the AI to understand when to use this",
  "category": "search", // search|cart|customer|comparison|b2b
  "enabled": true,
  "parameters": {
    "query": {
      "type": "string",
      "required": true,
      "description": "What to search for"
    },
    "limit": {
      "type": "number",
      "required": false,
      "default": 10,
      "validation": {
        "min": 1,
        "max": 50
      }
    }
  },
  "udl": {
    "methods": ["unified.searchProducts"],
    "required": true
  },
  "intelligence": {
    "mode": "both",
    "suggestions": ["add-to-cart", "compare-products"],
    "keywords": ["find", "search", "look for"]
  }
}
```

### Step 3: Implement the Action

Create the implementation file:

```typescript
// features/ai-shopping-assistant/actions/implementations/my-new-action.ts
import { ActionDefinition, Context } from '../types';
import { z } from 'zod';

// Define parameter schema
const ParamsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).default(10)
});

export const myNewAction: ActionDefinition = {
  id: 'my-new-action',
  name: 'My New Action',
  description: 'Clear description for the AI',
  category: 'search',
  
  parameters: {
    query: {
      type: 'string',
      required: true,
      description: 'What to search for'
    },
    limit: {
      type: 'number',
      required: false,
      default: 10
    }
  },
  
  // Main execution logic
  async execute(params: unknown, context: Context) {
    // 1. Validate parameters
    const validated = ParamsSchema.parse(params);
    
    // 2. Access SDK (ALWAYS use UDL)
    const { sdk } = context;
    
    try {
      // 3. Execute business logic
      const products = await sdk.unified.searchProducts({
        search: validated.query,
        limit: validated.limit
      });
      
      // 4. Process results
      const enhanced = products.map(product => ({
        ...product,
        relevanceScore: this.calculateRelevance(product, validated.query)
      }));
      
      // 5. Return structured response
      return {
        success: true,
        products: enhanced,
        totalCount: products.length,
        query: validated.query,
        suggestions: this.getSuggestions(enhanced)
      };
      
    } catch (error) {
      // 6. Handle errors gracefully
      context.logger.error('Search failed', { error, params: validated });
      
      return {
        success: false,
        error: 'Unable to complete search',
        fallbackSuggestions: ['Try different keywords', 'Browse categories']
      };
    }
  },
  
  // Helper methods
  calculateRelevance(product: any, query: string): number {
    // Implementation
    return 0.85;
  },
  
  getSuggestions(products: any[]): string[] {
    if (products.length === 0) {
      return ['Try a different search', 'Browse by category'];
    }
    return ['Add to cart', 'Compare products', 'See similar items'];
  }
};
```

### Step 4: Register the Action

Add your action to the registry:

```typescript
// features/ai-shopping-assistant/actions/registry/index.ts
import { myNewAction } from '../implementations/my-new-action';

export function registerActions(registry: ActionRegistry) {
  // Existing actions...
  registry.register(searchProductsAction);
  registry.register(addToCartAction);
  
  // Add your new action
  registry.register(myNewAction);
}
```

### Step 5: Create Tests

Write comprehensive tests:

```typescript
// features/ai-shopping-assistant/actions/implementations/__tests__/my-new-action.test.ts
import { describe, it, expect } from '@jest/globals';
import { myNewAction } from '../my-new-action';
import { createMockContext } from '../../../testing/test-utils';

describe('My New Action', () => {
  it('should search products successfully', async () => {
    // Arrange
    const mockContext = createMockContext({
      mockProducts: [
        { id: '1', name: 'Test Product', price: { value: 99.99 } }
      ]
    });
    
    // Act
    const result = await myNewAction.execute(
      { query: 'test', limit: 5 },
      mockContext
    );
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe('Test Product');
  });
  
  it('should handle errors gracefully', async () => {
    // Arrange
    const mockContext = createMockContext({
      shouldError: true
    });
    
    // Act
    const result = await myNewAction.execute(
      { query: 'test' },
      mockContext
    );
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.fallbackSuggestions).toHaveLength(2);
  });
  
  it('should validate parameters', async () => {
    // Arrange
    const mockContext = createMockContext();
    
    // Act & Assert
    await expect(
      myNewAction.execute({ query: '' }, mockContext)
    ).rejects.toThrow('String must contain at least 1 character');
  });
});
```

### Step 6: Add UI Components (Optional)

If your action needs special UI:

```typescript
// components/ai-assistant/renderers/my-action-renderer.tsx
export function MyActionRenderer({ result }: { result: MyActionResult }) {
  if (!result.success) {
    return <ErrorDisplay error={result.error} />;
  }
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {result.products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          showRelevance={true}
        />
      ))}
    </div>
  );
}

// Register the renderer
renderRegistry.register('my-new-action', MyActionRenderer);
```

## Development Environment

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_ALOKAI_MIDDLEWARE_URL=http://localhost:4000
NEXT_PUBLIC_DEMO_MODE=true
OPENAI_API_KEY=sk-...

# For production testing
NEXT_PUBLIC_DEMO_MODE=false
ALOKAI_MIDDLEWARE_API_KEY=your-key
```

### Useful Commands

```bash
# Code quality
yarn lint        # Run ESLint
yarn lint:fix    # Fix linting issues
yarn typecheck   # TypeScript check
yarn format      # Prettier formatting

# Testing
yarn test:unit   # Run unit tests
yarn test:integration  # Run integration tests
yarn test:e2e    # Run E2E tests

# Building
yarn build       # Build everything
yarn build:next  # Build frontend only
```

### Debugging

Enable debug mode for detailed logs:

```typescript
// In your action
if (context.debug) {
  console.log('[MyAction] Input:', params);
  console.log('[MyAction] SDK call starting...');
}
```

```bash
# Run with debug logging
DEBUG=ai-assistant:* yarn dev
```

## Testing Workflow

### 1. Unit Testing

Test your action in isolation:

```bash
# Run specific test
yarn test:unit my-new-action.test.ts

# Run with coverage
yarn test:unit --coverage
```

### 2. Integration Testing

Test with the full system:

```typescript
// integration-tests/my-action.test.ts
it('should work with real AI flow', async () => {
  const assistant = createTestAssistant();
  
  const response = await assistant.query(
    'Use my new action to find products'
  );
  
  expect(response.actionUsed).toBe('my-new-action');
  expect(response.result.products).toBeDefined();
});
```

### 3. Manual Testing

Test in the UI:
1. Start dev server: `yarn dev`
2. Open http://localhost:3000
3. Try queries that should trigger your action
4. Verify responses and UI rendering

### 4. Performance Testing

```typescript
// Ensure your action meets performance targets
it('should complete within 250ms', async () => {
  const start = Date.now();
  
  await myNewAction.execute(params, context);
  
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(250);
});
```

## Code Review Checklist

Before submitting your PR, ensure:

### Functionality
- [ ] Action works in demo mode
- [ ] Action works with real data (if testable)
- [ ] Error handling is comprehensive
- [ ] Returns helpful suggestions

### Code Quality
- [ ] No TypeScript errors
- [ ] No `any` types
- [ ] Follows coding conventions
- [ ] Includes JSDoc comments

### UDL Compliance
- [ ] Uses only `sdk.unified.*` or `sdk.customExtension.*`
- [ ] No direct API calls
- [ ] No hardcoded data
- [ ] Declares required UDL methods

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Coverage > 80%
- [ ] Edge cases tested

### Documentation
- [ ] Action description is clear
- [ ] Parameters are documented
- [ ] README updated if needed
- [ ] CHANGELOG entry added

### Performance
- [ ] Meets <250ms target
- [ ] Uses caching where appropriate
- [ ] Parallel operations when possible
- [ ] No memory leaks

## Deployment Process

### 1. Development Deploy

```bash
# Deploy to dev environment
yarn deploy:dev

# Verify deployment
curl https://dev.your-store.com/health
```

### 2. Staging Deploy

```bash
# Run full test suite
yarn test:all

# Deploy to staging
yarn deploy:staging

# Run smoke tests
yarn test:smoke --env=staging
```

### 3. Production Deploy

```bash
# Final checks
yarn audit
yarn build
yarn test:all

# Deploy with feature flag
yarn deploy:production --feature-flag=my-new-action:5%

# Monitor metrics
yarn monitor --action=my-new-action
```

### 4. Gradual Rollout

```yaml
# config/rollout.yaml
my-new-action:
  day1: 5%    # 5% of traffic
  day3: 25%   # If metrics good
  day7: 50%   # Continue rollout
  day14: 100% # Full deployment
```

## Common Patterns

### Pattern 1: Search with Enrichment

```typescript
async execute(params: any, context: Context) {
  // 1. Search
  const products = await context.sdk.unified.searchProducts(params);
  
  // 2. Enrich with additional data
  const enriched = await Promise.all(
    products.map(async (product) => {
      const [inventory, reviews] = await Promise.all([
        context.sdk.unified.checkInventory([product.id]),
        context.sdk.customExtension.getReviews(product.id)
      ]);
      
      return { ...product, inventory, reviews };
    })
  );
  
  return { products: enriched };
}
```

### Pattern 2: B2B Mode Handling

```typescript
async execute(params: any, context: Context) {
  const isB2B = context.mode === 'b2b';
  
  if (isB2B) {
    // B2B specific logic
    const contractPricing = await context.sdk.customExtension.getContractPricing({
      customerId: context.customerId,
      productIds: params.productIds
    });
    
    return this.processB2BResponse(contractPricing);
  }
  
  // Standard B2C flow
  return this.processB2CResponse(params);
}
```

### Pattern 3: Streaming Results

```typescript
async *execute(params: any, context: Context) {
  const categories = params.categories || ['all'];
  
  for (const category of categories) {
    const products = await context.sdk.unified.searchProducts({
      ...params,
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
  
  // Final summary
  yield {
    type: 'complete',
    message: 'Search completed'
  };
}
```

## Troubleshooting

### Action Not Being Selected
- Check description clarity
- Add keywords to intelligence config
- Verify category is correct
- Test with explicit prompts

### Performance Issues
- Profile with `console.time()`
- Check for N+1 queries
- Use Promise.all() for parallel ops
- Implement caching

### Type Errors
- Ensure using UDL types
- Run `yarn typecheck`
- Avoid `as any` casting
- Use proper generics

## Getting Help

- **Documentation**: See `/docs` folder
- **Examples**: Check existing actions in `/actions/implementations`
- **Team Chat**: #ai-assistant-dev
- **Office Hours**: Thursdays 2-3pm

---

💡 **Pro Tip**: Always start by copying an existing similar action and modifying it. This ensures you follow all the established patterns.