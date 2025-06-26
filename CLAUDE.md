# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working with this Alokai (Vue Storefront) e-commerce repository.

## Project Overview

**Architecture:** `ecommerce/CMS → Alokai Middleware → Frontend`

**Tech Stack:**
- Next.js 14 (App Router), TypeScript, Tailwind CSS + Storefront UI
- Zustand state (via `sdk/alokai-context.tsx`), TanStack Query, next-intl
- Monorepo with Turborepo, Playwright E2E tests

**🚨 CRITICAL: Unified Data Layer (UDL)**
- ALL commerce data MUST flow through UDL - no exceptions
- Provides <50ms access to 20+ backends with normalized data model
- Use `sdk.unified.*` for standard ops, `sdk.customExtension.*` for custom
- SDK types are auto-inferred - don't create duplicates

## Essential Commands

```bash
# Setup & Development
yarn init                    # Initial setup
yarn dev                     # Start all (:3000 frontend, :4000 middleware)
yarn dev:next               # Frontend only
yarn dev:middleware         # Middleware only

# Code Quality
yarn lint                   # ESLint
yarn lint:fix              # Auto-fix
yarn format                # Prettier
yarn typecheck             # TypeScript check

# Testing & Build
yarn test:unit             # Unit tests
yarn test:unit search-products.test.ts  # Specific test file
yarn test:unit --coverage  # With coverage
yarn test:integration:pw   # Playwright E2E
yarn build                 # Build all

# Multistore
yarn multistore:init       # Setup multistore
yarn multistore:dev:next   # Run multistore
```

## Architecture & Key Patterns

```
apps/
├── storefront-unified-nextjs/       # Frontend
│   ├── app/                        # Next.js pages
│   ├── components/                 # Feature-based UI
│   ├── features/ai-shopping-assistant/
│   ├── hooks/                      # Business logic (useCart, etc.)
│   └── sdk/                        # UDL client layer
├── storefront-middleware/           # Backend
│   ├── integrations/sapcc/         # SAP integration  
│   ├── api/custom-methods/         # Custom endpoints
│   └── sf-modules/                 # B2B, CMS modules
└── playwright/                      # E2E tests
```

**Patterns:** Hook-based logic, feature-based components, middleware integrations, server-first rendering (client-side only for personalized data)

## Development Guidelines

**Code Style:**
- Functional programming, interfaces > types, explicit return types
- Named exports, const objects with 'as const' (no enums)
- Descriptive names (isLoading, hasError), single file components

**Component Pattern:**
```typescript
export interface ComponentNameProps {
  prop1: string;
  prop2?: number;
}

export function ComponentName({ prop1, prop2 = 0 }: ComponentNameProps): JSX.Element {
  // Implementation
}
```

**Rendering:** Server-first (default), client-side only for personalized data

**Git Commits:** `fix:`, `feat:`, `perf:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:` (lowercase, concise)

## UDL Integration & Data Fetching

**Search Order:**
1. `sdk.unified.*` methods
2. Existing hooks in `hooks/`
3. Custom methods in `api/custom-methods/`
4. Integration extensions

**UDL Methods:**
- Products: `searchProducts()`, `getProductDetails()`
- Cart: `addCartLineItem()`, `updateCartLineItem()`, `removeCartLineItem()`
- Customer: `getCustomer()`, `updateCustomer()`
- Checkout: `placeOrder()`, `getAvailableShippingMethods()`
- Custom: `sdk.customExtension.*`

**Usage Examples:**
```typescript
// Server-side
import { getSdk } from '@/sdk';
const sdk = getSdk();
const product = await sdk.unified.getProductDetails({ id, sku });

// Client-side with TanStack Query
import { useSdk } from '@/sdk/alokai-context';
const sdk = useSdk();
const { data } = useQuery({
  queryFn: () => sdk.unified.getProductDetails({ id, sku }),
  queryKey: ['lazyProduct', `${id}-${sku}`],
});
```

## 🚨 CRITICAL: Normalizers in Custom Methods

**When to Use Normalizers:**
- ALWAYS when fetching data from `context.api.*` in middleware custom methods
- This ensures UDL consistency across different e-commerce backends
- Without normalizers, you're returning raw backend-specific data structures

**Correct Pattern:**
```typescript
// ✅ ALWAYS normalize data from context.api
import { getNormalizers } from "@vsf-enterprise/unified-api-sapcc/udl";

export async function customMethod(context: IntegrationContext, args: any) {
  const { normalizeCustomer, normalizeProduct, normalizeCart } = getNormalizers(context);
  
  // Fetch and normalize
  const rawCustomer = await context.api.getCustomer();
  const customer = normalizeCustomer(rawCustomer); // Now in UDL format
  
  // Use normalized data
  if (!customer.organizationId) { // UDL property, not backend-specific
    throw new Error('B2B only');
  }
}
```

**Wrong Pattern:**
```typescript
// ❌ NEVER use raw API responses directly
export async function customMethod(context: IntegrationContext, args: any) {
  const customer = await context.api.getCustomer();
  
  // This uses backend-specific properties!
  if (!customer.isB2B) { // SAP-specific, not UDL
    throw new Error('B2B only');
  }
}
```

**Common Normalizers:**
- `normalizeProduct()` - For product data
- `normalizeCart()` - For cart data
- `normalizeCustomer()` - For customer data
- `normalizeOrder()` - For order data
- `normalizePrice()` - For price formatting

**Key UDL Properties:**
- Customer B2B check: Use `customer.organizationId` (not `isB2B`)
- Customer ID: Use `customer.id` (not `uid`)
- Cart ID: Use `cart.id` (not `code`)
- Product stock: Use `product.quantityLimit` (not `stock.stockLevel`)

**📚 Understanding UDL:**
- [UDL Contract](./shopping-assistant/docs/reference/UDL_CONTRACT.md) - How UDL acts as a contract between frontend and backends
- [SAPCC Specific Data Access](./shopping-assistant/docs/reference/SAPCC_SPECIFIC_DATA_ACCESS.md) - Accessing platform-specific data beyond UDL
- [UDL Comprehensive Guide](./shopping-assistant/docs/reference/UDL_COMPREHENSIVE_GUIDE.md) - Navigate all UDL documentation
- [Full UDL Documentation](./shopping-assistant/docs/unified-data-model/) - Complete technical reference with normalizers, methods, and platform-specific details

## Common Development Tasks

### Custom Methods & Extensions

```typescript
// Custom API method (api/custom-methods/custom.ts)
import { type IntegrationContext } from "../../types";
import { getNormalizers } from "@vsf-enterprise/unified-api-<integration>/udl";

export async function customMethod(
  context: IntegrationContext,
  args: MyArgs,
): Promise<MyResponse> {
  const ecommerceApi = context.api; // Access integration methods
  const contentful = await context.getApiClient("contentful"); // Access other integrations
  const { normalizeProduct } = getNormalizers(context);
  
  // Implementation MUST use UDL - normalize ALL data from context.api
  const rawData = await ecommerceApi.getProducts(args);
  return {
    products: rawData.map(p => normalizeProduct(p)), // Normalize each product
    // other fields...
  };
}

// Extend normalizers (integrations/<name>/extensions/unified.ts)
const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [{
      normalizeProduct(context, input) {
        return { 
          description: input.description,
          customField: input.customData?.value 
        }; // Access via product.$custom.description
      }
    }]
  }
});
```

### Testing Patterns

```typescript
// Use mock SDK factory for UDL-compliant testing
import { createMockSDK } from '@/features/ai-shopping-assistant/mocks/mock-sdk-factory';

describe('MyComponent', () => {
  const mockSDK = createMockSDK();
  
  it('should fetch products', async () => {
    const result = await mockSDK.unified.searchProducts({ search: 'test' });
    expect(result.products).toHaveLength(2);
  });
});
```

### Error Handling

```typescript
// Translate errors at abstraction boundaries
import { withErrorHandling, ValidationError } from '@/features/ai-shopping-assistant/errors';

// In API routes or actions
const result = await withErrorHandling(
  async () => sdk.unified.searchProducts(params),
  { sessionId: 'test-123' }
);

// For user-facing errors
try {
  await performAction();
} catch (error) {
  if (error instanceof ValidationError) {
    showNotification({ type: 'error', message: error.userMessage });
  }
}
```

### Internationalization

```typescript
// Add locale: lang/<locale>/feature.json
{ "FeatureNamespace": { "myKey": "value" } }

// Use translations
import { useTranslations } from 'next-intl';
const t = useTranslations('FeatureNamespace'); // Never 'base'
// {t('myKey')}, {t('myKey', { count: 5 })}, {t.rich('myKey', { link: (chunks) => <SfLink>{chunks}</SfLink> })}
```

### Notifications
```typescript
import { useNotification } from '@/hooks/use-notification';

const { showNotification } = useNotification();
showNotification({ 
  type: 'success', 
  message: 'Product added to cart',
  duration: 3000 
});
```

### State Management
```typescript
// Global state with Zustand (via Alokai context)
import { useCart } from '@/hooks/use-cart';

const { cart, addItem, updateQuantity } = useCart();

// Server state with TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => sdk.unified.searchProducts(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Deployment & Environment
```bash
# Environment variables (.env.local)
NEXT_PUBLIC_ALOKAI_MIDDLEWARE_URL=http://localhost:4000
NEXT_PUBLIC_ALOKAI_MULTISTORE_ENABLED=false

# Build optimization
yarn build:analyze  # Check bundle size
yarn build --profile  # Performance profiling

# Production deployment
NODE_ENV=production yarn build
yarn start
```

## UDL Compliance Checklist

**Before ANY implementation:**
- [ ] All data fetching uses `sdk.unified.*` or `sdk.customExtension.*`
- [ ] No direct API calls (fetch, axios, etc.)
- [ ] No hardcoded mock data in production code
- [ ] Types extend from UDL interfaces
- [ ] Custom methods defined in middleware if needed

**Key Rules:**
- Prefer editing existing files over creating new ones
- No comments unless for complex logic
- Use Zustand (via Alokai context) for global state, TanStack Query for server state
- SDK types are auto-inferred - don't duplicate
- Use Tailwind CSS + Storefront UI components

## AI Shopping Assistant

**🚨 CRITICAL DISCOVERY (January 2025)**: Initial implementation (PROMPTS 1-12) missed UDL integration. v3.0 fixes this.

**Implementation Status:**
- ✅ PROMPT 1-12: Core implementation (with UDL issues)
- ✅ PROMPT 2, 13: UDL remediation prompts
- ✅ PROMPT 14-19: Configuration, observability, error handling, testing, API routes, frontend
- ✅ PROMPT 20-21: Mock removal, B2B custom extensions
- 🔄 PROMPT 24: Documentation (in progress)
- ⏸️ PROMPT 22-23, 25: Integration testing, production readiness, validation (pending backend)

**Verification Process (June 2025):**
1. **Planning Mode First**: Analyze existing implementation
2. **Check Documentation**: Use `@shopping-assistant/docs/imp/` for guidance, code as ground truth
3. **Implementation Mode**: Improve while preserving working code
4. **Mark as Verified**: Update IMPLEMENTATION_GUIDE.md with date

**Key Principles:**
- Configuration-driven tools (actions are config, not code)
- Commerce Intelligence First: B2C/B2B awareness via UDL
- Full TypeScript, no 'any' types
- 200-250ms response target
- Security by design (Judge pattern)
- Observable by default
- Streaming-first (SSE)

**Correct UDL Pattern:**
```typescript
// ✅ ALWAYS use UDL
const products = await sdk.unified.searchProducts({ search: query });
const cart = await sdk.unified.addCartLineItem({ cartId, productId, quantity });

// ❌ NEVER direct calls, mock functions, or non-existent methods
// No fetch(), no sdk.commerce.*, no performSearch()
```

### AI Assistant Tasks

**Add Commerce Action:**
```json
// config/ai-assistant-actions.json
{ "id": "new-action", "udl": { "methods": ["unified.methodName"] } }
```
```typescript
// actions/implementations/new-action.ts
export async function executeNewAction(params: any, context: Context) {
  return await context.sdk.unified.methodName(params); // MUST use UDL
}
```

**Testing:** Use `createMockSDK()` for UDL-compliant mocks

**Common Issues:** Wrong SDK namespace, direct API calls, non-UDL types

### Patterns Discovered During Implementation

**LangGraph Patterns (Verified in Production):**
1. **Tool Factory Pattern** - Convert action definitions to LangGraph tools dynamically
   ```typescript
   const tool = toolFactory.createTool(actionDefinition);
   // Automatically generates schema, validates params, executes action
   ```
2. **Command Pattern** - Tools return Command objects for state updates
   ```typescript
   return { type: 'UPDATE_STATE', payload: { cart, suggestions } };
   ```
3. **MessagesAnnotation.spec** - Built-in message handling with proper typing
4. **ToolNode** - Prebuilt component handles tool orchestration automatically
5. **Streaming with `streamMode: "updates"`** - Efficient state streaming

**Frontend Patterns (Battle-Tested):**
1. **useReducer for chat state** - Handles complex updates predictably
2. **StreamingClient class** - Robust SSE with auto-reconnect
3. **React Portal for widget** - Prevents CSS conflicts
4. **Suspense boundaries** - Lazy load heavy components (saved 180KB)
5. **Rich inline UI** - Product grids, comparisons, dynamic content

**Performance Patterns (Achieved <250ms):**
1. **Server-side LLM calls** - Eliminated 300ms network roundtrip
2. **LRU Cache with normalization** - 45% hit rate in production
3. **Parallel UDL fetching** - Promise.all() for independent queries
4. **Sliding window context** - 30% token reduction
5. **Progressive enhancement** - Stream UI updates immediately

**Security Patterns (100% Attack Prevention):**
1. **Multi-layer Judge** - Input → Intent → Output → Business rules
2. **Context-aware validation** - B2C vs B2B different rules
3. **Output filtering** - Prevent data leakage and XSS
4. **Rate limiting by role** - Adaptive limits based on behavior
5. **Audit trail** - Every security decision logged

**B2B Extension Patterns:**
1. **IntegrationContext usage** - Access multiple backends
   ```typescript
   const sapcc = context.api;
   const contentful = await context.getApiClient("contentful");
   ```
2. **Normalizer pattern** - Convert backend data to UDL format
3. **Realistic mocks with TODOs** - Clear integration points
4. **Type-safe custom methods** - Full TypeScript coverage
5. **Middleware organization** - `/api/custom-methods/b2b/`

## Troubleshooting & Common Issues

**UDL Integration Issues:**
- `sdk.commerce.*` → Use `sdk.unified.*` instead
- `Cannot find module` → Check if method exists in UDL docs
- Type errors → Don't create custom types, use UDL interfaces
- Mock data in prod → Replace with real SDK calls

**Performance Issues:**
- Slow queries → Check N+1 queries, use proper pagination
- Bundle size → Lazy load heavy components, check imports
- SSR hydration → Ensure consistent data between server/client

**Common Errors:**
- `NextIntlClientProvider` missing → Wrap client components using translations
- State not persisting → Check Zustand hydration
- CORS errors → Configure middleware properly

## Warnings & Requirements

**Security:** LLM calls via backend only, no frontend API keys, validate inputs, rate limit

**Performance:** 200-250ms target, use streaming, cache appropriately

**Production Checklist:**
- [ ] All UDL methods tested with real backend
- [ ] Environment variables configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured
- [ ] Performance monitoring active

## Documentation

| File | Purpose | Version |
|------|---------|---------|
| `@shopping-assistant/docs/imp/IMPLEMENTATION_GUIDE.md` | 25 implementation prompts, status tracking | v3.1 |
| `@shopping-assistant/docs/imp/ARCHITECTURE_AND_PATTERNS.md` | Validated LangGraph patterns, UDL integration | v2 |
| `@shopping-assistant/docs/imp/LEARNINGS_AND_ISSUES.md` | PoC analysis, UDL gap discovery, troubleshooting | Section 11: UDL lessons |
| `@shopping-assistant/docs/imp/CUSTOM_EXTENSIONS_SPEC.md` | B2B custom extension specifications | v1.0 |
| `@shopping-assistant/docs/imp/VERIFICATION_INSIGHTS.md` | Comprehensive verification findings | v1.0 |
| `@shopping-assistant/docs/imp/API_ROUTE_SUMMARY.md` | API route implementation details | v1.0 |

**Key Resources:**
1. **Implementation Plan**: Enforces UDL in every prompt, includes remediation prompts
2. **Code Patterns**: Tool Factory Pattern, Command objects, MessagesAnnotation.spec, ToolNode
3. **PoC Learnings**: Security vulnerabilities, performance bottlenecks, successful patterns
4. **LangGraph.js Docs**: Use `mcp__context7__resolve-library-id` → `mcp__context7__get-library-docs`

**Documentation Organization:**
- `@shopping-assistant/docs/imp/` - Implementation working docs (internal tracking)
- `@docs/external/` - External source documents
- `@shopping-assistant/docs/` - Project documentation (public-ready)

## Key Reminders

- Do only what's asked - no more, no less
- Never create files unless absolutely necessary
- Always prefer editing existing files
- No documentation files unless explicitly requested

**Documentation Update Mandate:**
When creating, deleting, moving, or updating any `.md` file in the project:
1. **Always check** `@shopping-assistant/docs/DOCUMENTATION_INDEX.md` first
2. **Update the index** if your changes affect the documentation structure
3. **Maintain consistency** with the documented file locations and purposes

**AI Assistant Verification Workflow (June 2025):**
1. Planning mode → analyze existing
2. Create verification plan
3. Implementation mode → improve
4. Update IMPLEMENTATION_GUIDE.md status
5. Document discoveries