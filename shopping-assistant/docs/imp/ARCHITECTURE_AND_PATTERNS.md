# Architecture and Patterns Reference

*Version: v1.0*  
*Last Updated: 25 June 2025*

*Technical Reference for AI Shopping Assistant Implementation*

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Architectural Principles](#core-architectural-principles)
3. [Validated Code Patterns](#validated-code-patterns)
4. [UDL Integration Patterns](#udl-integration-patterns)
5. [Mock to Real SDK Migration](#mock-to-real-sdk-migration)
6. [Custom Extension Development](#custom-extension-development)
7. [API Routes Implementation](#api-routes-implementation)
8. [Error Handling Integration](#error-handling-integration)
9. [Directory Structure](#directory-structure)
10. [Key Design Patterns](#key-design-patterns)
11. [State Management](#state-management)
12. [Security Architecture](#security-architecture)
13. [Performance Strategy](#performance-strategy)
14. [Observability Implementation](#observability-implementation)

## Architecture Overview

This document combines the architectural design and validated code patterns for the Alokai AI Shopping Assistant. The assistant is built with production-ready principles from day one, emphasizing UDL-first data access, type safety, configuration-driven design, security, performance, and observability.

### High-Level Architecture

```typescript
interface AlokaiCommerceArchitecture {
  // Layer 0: Data Access - ALWAYS through UDL (The Foundation)
  dataAccess: {
    products: UDL.products;      // NOT direct API calls
    inventory: UDL.inventory;    // NOT mock services
    pricing: UDL.pricing;        // NOT hardcoded values
    cart: UDL.cart;             // NOT custom implementations
    customer: UDL.customer;      // NOT fake data
  };
  
  // Layer 1: Configuration-Driven Tools (The Innovation)
  actions: Map<string, ActionDefinition>;
  
  // Layer 2: Commerce Intelligence (The Moat)
  intelligence: {
    modeDetection: B2CB2BEngine;
    contextEnrichment: CommerceContext;
    intentPrediction: PatternEngine;
    securityLayer: SecurityJudge;
  };
  
  // Layer 3: LangGraph Orchestration (The Infrastructure)
  orchestration: StateGraph<CommerceState, CommerceState>;
  
  // Layer 4: Observability (Production-Ready)
  monitoring: {
    performance: PerformanceTracker;
    security: ThreatMonitor;
    business: MetricsCollector;
  };
}
```

## Core Architectural Principles

### 1. UDL-First Architecture (HIGHEST PRIORITY)
- ALL data access through Unified Data Layer
- No direct backend API calls ever
- Leverage UDL's <50ms performance advantage
- Consistent data structure across all backends
- Custom extensions properly defined in middleware

### 2. Type Safety Everywhere
- **No 'any' types**: Every function, parameter, and return value is strongly typed
- **Zod schemas**: Runtime validation for all external inputs
- **TypeScript strict mode**: Enforced across the entire codebase
- **Type inference**: Leveraging LangGraph's type system for automatic inference

### 3. Configuration-Driven Design
- **ActionDefinition interface**: Declarative action configuration instead of code
- **Runtime extensibility**: Add new actions without code changes
- **Environment-based config**: All settings controllable via environment variables
- **Feature flags**: Enable/disable features through configuration

### 4. Security-First Approach
- **Input validation**: All inputs validated against Zod schemas
- **Output sanitization**: Responses checked before sending to users
- **Rate limiting**: Built into every action definition
- **Permission-based access**: Role-based access control for B2B scenarios

### 5. Performance Monitoring
- **Built-in tracking**: Every component has performance metrics
- **250ms target**: Aggressive response time target with monitoring
- **Resource limits**: Memory and CPU usage tracked
- **Automatic optimization**: Performance data drives optimization decisions

### 6. Structured Observability
- **Distributed tracing**: Full request path visibility
- **Structured logging**: JSON-formatted logs with consistent schema
- **Metrics collection**: Business and technical metrics captured
- **Error tracking**: Comprehensive error capture with context

## Validated Code Patterns

### Tool Factory Pattern ✅ VALIDATED

```typescript
import { tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";

// VALIDATED PATTERN: Tool creation with state access and Command returns
class LangGraphActionFactory {
  createTool(action: ActionDefinition) {
    return tool(
      async (params, config) => {
        // CORRECT: Access state using getCurrentTaskInput
        const state = config.configurable?.getCurrentTaskInput?.();
        const context = state?.context;
        const mode = context?.mode || 'b2c';
        
        // Pre-process with commerce intelligence
        const enrichedParams = action.preProcess?.(params, mode) ?? params;
        
        // Execute action with UDL
        const result = await action.execute(enrichedParams, context);
        
        // Post-process result
        const enhanced = action.postProcess?.(result, mode) ?? result;
        
        // VALIDATED: Return Command for state updates
        return new Command({
          update: {
            lastAction: action.name,
            actionResults: enhanced,
            ...(action.updateCart && { cartState: enhanced.cart })
          }
        });
      },
      {
        name: action.name.toLowerCase().replace(/_/g, '-'),
        description: action.description,
        schema: this.generateZodSchema(action.parameters)
      }
    );
  }
  
  private generateZodSchema(parameters: Record<string, string>) {
    const shape: Record<string, any> = {};
    
    Object.entries(parameters).forEach(([key, description]) => {
      // Parse type from description
      if (description.includes('array')) {
        shape[key] = z.array(z.string());
      } else if (description.includes('number')) {
        shape[key] = z.number();
      } else if (description.includes('boolean')) {
        shape[key] = z.boolean();
      } else {
        shape[key] = z.string();
      }
      
      // Handle optional parameters
      if (description.includes('optional')) {
        shape[key] = shape[key].optional();
      }
      
      // Add descriptions
      shape[key] = shape[key].describe(description);
    });
    
    return z.object(shape);
  }
}
```

### State Management Pattern ✅ VALIDATED

```typescript
import { Annotation, MessagesAnnotation, Command } from "@langchain/langgraph";

// VALIDATED PATTERN: Use MessagesAnnotation.spec as base
export const CommerceStateAnnotation = Annotation.Root({
  // CORRECT: Include MessagesAnnotation for message handling
  ...MessagesAnnotation.spec,
  
  // B2C/B2B mode with proper reducer
  mode: Annotation<"b2c" | "b2b">()
    .reducer((current, update) => update ?? current ?? "b2c"),
  
  // Cart with Command-aware reducer
  cartState: Annotation<Cart>()
    .default(() => ({ items: [], total: 0 }))
    .reducer((current, update) => {
      // VALIDATED: Handle Command objects from tools
      if (update instanceof Command) {
        const cartUpdate = update.update?.cartState;
        if (!cartUpdate) return current;
        update = cartUpdate;
      }
      
      if (!update) return current;
      
      // Smart cart merging
      const newItems = update.items || current.items;
      const newTotal = newItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      return {
        items: newItems,
        total: newTotal,
        lastUpdated: new Date().toISOString()
      };
    }),
  
  // Search results with history
  searchHistory: Annotation<SearchResult[]>({
    default: () => [],
    reducer: (current, update) => {
      if (!update) return current;
      // Keep last 10 searches
      return [update, ...current].slice(0, 10);
    }
  }),
  
  // Performance metrics
  metrics: Annotation<PerformanceMetrics>({
    default: () => ({ operations: [] }),
    reducer: (current, update) => {
      if (!update) return current;
      return {
        operations: [...current.operations, update],
        avgResponseTime: calculateAverage(current.operations)
      };
    }
  })
});
```

### Graph Construction Pattern ✅ VALIDATED

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

// VALIDATED PATTERN: Graph construction with prebuilt components
export function createCommerceGraph(tools: any[]) {
  // Initialize model
  const model = new ChatOpenAI({
    modelName: "gpt-4-turbo-preview",
    temperature: 0
  }).bindTools(tools);
  
  // Create agent node
  const agentNode = async (state: typeof CommerceStateAnnotation.State) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  };
  
  // VALIDATED: Use ToolNode from prebuilt
  const toolNode = new ToolNode(tools);
  
  // Condition function for routing
  const shouldUseTool = (state: typeof CommerceStateAnnotation.State) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage.tool_calls?.length) {
      return "tools";
    }
    return END;
  };
  
  // Build graph with proper types
  const workflow = new StateGraph(CommerceStateAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldUseTool, {
      tools: "tools",
      [END]: END
    })
    .addEdge("tools", "agent");
  
  return workflow.compile();
}
```

### Streaming Implementation Pattern ✅ VALIDATED

```typescript
// VALIDATED PATTERN: Streaming with LangGraph
export class StreamingHandler {
  async streamResponse(
    graph: CompiledStateGraph,
    input: any,
    config: any,
    res: Response
  ) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable Nginx buffering
    });
    
    const startTime = Date.now();
    let firstTokenTime: number | null = null;
    
    try {
      // VALIDATED: streamMode is correct parameter name
      for await (const event of graph.stream(input, {
        ...config,
        streamMode: 'messages' // or 'updates' or 'values'
      })) {
        if (!firstTokenTime) {
          firstTokenTime = Date.now();
          this.sendEvent(res, 'metric', {
            name: 'ttft',
            value: firstTokenTime - startTime
          });
        }
        
        // Handle different event types
        if (event.messages) {
          this.sendEvent(res, 'message', {
            content: event.messages[event.messages.length - 1].content,
            partial: true
          });
        }
        
        if (event.updates) {
          this.sendEvent(res, 'state', event.updates);
        }
        
        // Flush to ensure client receives data
        res.flush?.();
      }
      
      // Send completion event
      this.sendEvent(res, 'done', {
        totalTime: Date.now() - startTime,
        ttft: firstTokenTime ? firstTokenTime - startTime : null
      });
      
    } catch (error) {
      this.sendEvent(res, 'error', {
        message: error.message,
        code: error.code
      });
    } finally {
      res.end();
    }
  }
  
  private sendEvent(res: Response, type: string, data: any) {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}
```

## UDL Integration Patterns

### Correct UDL Usage Pattern

```typescript
// CORRECT: All data through UDL
class SearchProductsAction {
  async execute(params: SearchParams, context: Context) {
    // Use UDL for unified access
    const products = await context.sdk.unified.searchProducts({
      search: params.query,
      filter: params.filters,
      pageSize: params.limit || 20,
      currentPage: params.page || 1
    });
    
    // UDL handles backend differences
    const inventory = await context.sdk.unified.getInventory({
      productIds: products.items.map(p => p.id)
    });
    
    // Enrich with real-time data
    return this.enrichWithInventory(products, inventory);
  }
}
```

### Custom Extension Pattern for B2B

```typescript
// In middleware: apps/storefront-middleware/api/custom-methods/b2b.ts
export async function getB2BPricing(
  context: IntegrationContext,
  args: { customerId: string; productIds: string[] }
): Promise<B2BPricing[]> {
  const { normalizePrice } = getNormalizers(context);
  
  // Call B2B-specific backend API
  const prices = await context.api.getContractPricing(args);
  
  // Normalize to UDL structure
  return prices.map(p => ({
    productId: p.id,
    price: normalizePrice(p),
    tierPricing: p.tiers
  }));
}

// In frontend action
class B2BPricingAction {
  async execute(params: any, context: Context) {
    // Use custom extension
    const pricing = await context.sdk.customExtension.getB2BPricing({
      customerId: context.customer.id,
      productIds: params.productIds
    });
    
    return pricing;
  }
}
```

## Mock to Real SDK Migration

### Migration Strategy

The codebase uses a mock SDK factory that mirrors the exact UDL structure. This allows for incremental migration:

#### Step 1: Identify Mock Usage
```typescript
// Current mock usage in testing
import { createMockSdk } from '@/features/ai-shopping-assistant/mocks/mock-sdk-factory';

const mockSdk = createMockSdk();
const products = await mockSdk.unified.searchProducts({ search: 'jacket' });
```

#### Step 2: Replace with Real SDK
```typescript
// Production usage with real SDK
import { getSdk } from '@/sdk';

const sdk = getSdk();
const products = await sdk.unified.searchProducts({ search: 'jacket' });
```

#### Step 3: Update Response Handling
The mock responses already follow UDL structure, so no changes needed:
```typescript
// Both mock and real SDK return the same structure
interface UDLSearchResponse {
  products: UDLProductBase[];
  pagination: UDLPagination;
  facets: UDLFacet[];
}
```

### Parameter Mapping Guide

#### Search Products
```typescript
// Mock parameters (already UDL-compliant)
{
  search?: string;
  filter?: Record<string, any>;
  sort?: string;
  pageSize?: number;
  currentPage?: number;
}

// Real SDK parameters (same structure)
{
  search?: string;
  filter?: Record<string, any>;
  sort?: string;
  pageSize?: number;
  currentPage?: number;
}
```

#### Cart Operations
```typescript
// Add to cart - Mock
await mockSdk.unified.addCartLineItem({
  productId: 'prod-001',
  variantId: 'var-001',
  quantity: 2
});

// Add to cart - Real SDK (identical)
await sdk.unified.addCartLineItem({
  productId: 'prod-001',
  variantId: 'var-001',
  quantity: 2
});
```

### Testing During Migration

```typescript
// Test with both mock and real SDK
describe('Product Search Migration', () => {
  it('should work with mock SDK', async () => {
    const mockSdk = createMockSdk();
    const result = await searchProductsImplementation(
      { query: 'jacket' },
      { sdk: mockSdk }
    );
    expect(result.products).toBeDefined();
  });
  
  it('should work with real SDK', async () => {
    const realSdk = getSdk();
    const result = await searchProductsImplementation(
      { query: 'jacket' },
      { sdk: realSdk }
    );
    expect(result.products).toBeDefined();
  });
});
```

### Migration Checklist

- [ ] Replace `createMockSdk()` with `getSdk()` in production code
- [ ] Keep mock SDK for testing purposes
- [ ] Verify response structures match between mock and real
- [ ] Update error handling for real API errors
- [ ] Add retry logic for network failures
- [ ] Monitor performance differences
- [ ] Update caching strategies if needed

## Custom Extension Development

### Overview

Custom extensions extend the UDL with business-specific functionality, particularly for B2B operations.

### Implementation Location

```typescript
// In storefront-middleware/integrations/<your-integration>/extensions/unified.ts
import { createUnifiedExtension } from '@vsf-enterprise/unified-api-<integration>/udl';
import { getNormalizers } from '@vsf-enterprise/unified-api-<integration>/udl';

export const unifiedApiExtension = createUnifiedExtension({
  config,
  customMethods: {
    // B2B custom methods
    getBulkPricing,
    checkBulkAvailability,
    requestProductSamples,
    getAccountCredit,
    scheduleProductDemo,
    applyTaxExemption
  }
});
```

### Custom Method Pattern

```typescript
// Example: getBulkPricing implementation
export async function getBulkPricing(
  context: IntegrationContext,
  args: {
    productId: string;
    quantities: number[];
    customerId?: string;
  }
): Promise<BulkPricingResponse> {
  // 1. Access the commerce backend API
  const commerceApi = context.api;
  
  // 2. Get normalizers for consistent data structure
  const { normalizePrice, normalizeProduct } = getNormalizers(context);
  
  // 3. Fetch data from backend
  const product = await commerceApi.getProduct({ id: args.productId });
  const customerTier = args.customerId 
    ? await commerceApi.getCustomerTier(args.customerId)
    : 'standard';
  
  // 4. Calculate bulk pricing based on business rules
  const pricingTiers = args.quantities.map(quantity => {
    const discount = calculateBulkDiscount(quantity, customerTier);
    const unitPrice = product.price * (1 - discount);
    
    return {
      quantity,
      unitPrice: normalizePrice({ amount: unitPrice, currency: 'USD' }),
      totalPrice: normalizePrice({ amount: unitPrice * quantity, currency: 'USD' }),
      discount: discount * 100,
      leadTime: calculateLeadTime(quantity)
    };
  });
  
  // 5. Return normalized response
  return {
    productId: args.productId,
    currency: 'USD',
    basePrice: normalizePrice(product.price),
    pricingTiers,
    customPricingAvailable: customerTier === 'enterprise'
  };
}
```

### Accessing Custom Extensions in Frontend

```typescript
// In action implementation
export async function requestBulkPricingImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const sdk = getSdk();
  
  // Call custom extension method
  const bulkPricing = await sdk.customExtension.getBulkPricing({
    productId: params.productId,
    quantities: params.quantities,
    customerId: state.context.customer?.id
  });
  
  // Use the response
  return [{
    type: 'ADD_MESSAGE',
    payload: new AIMessage({
      content: formatBulkPricingResponse(bulkPricing)
    })
  }];
}
```

### B2B Custom Extension Methods

#### 1. getBulkPricing

Retrieves tiered pricing for bulk quantities of a product.

```typescript
interface GetBulkPricingArgs {
  productId: string;
  quantities: number[];
  customerId?: string;
  accountId?: string;
}

interface BulkPricingResponse {
  productId: string;
  currency: string;
  basePrice: number;
  pricingTiers: Array<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount: number; // percentage
    leadTime: string; // e.g., "5-7 business days"
    minimumOrderQuantity?: number;
  }>;
  customPricingAvailable: boolean;
  contactForQuote?: {
    threshold: number;
    message: string;
  };
}

// Implementation
export async function getBulkPricing(
  context: IntegrationContext,
  args: GetBulkPricingArgs
): Promise<BulkPricingResponse> {
  const { normalizePrice } = getNormalizers(context);
  
  // Get customer tier for pricing
  const customerTier = args.customerId 
    ? await context.api.getCustomerTier(args.customerId)
    : 'standard';
  
  // Calculate bulk pricing
  const pricingTiers = args.quantities.map(quantity => {
    const discount = calculateBulkDiscount(quantity, customerTier);
    const unitPrice = basePrice * (1 - discount);
    
    return {
      quantity,
      unitPrice: normalizePrice({ amount: unitPrice, currency: 'USD' }),
      totalPrice: normalizePrice({ amount: unitPrice * quantity, currency: 'USD' }),
      discount: discount * 100,
      leadTime: calculateLeadTime(quantity)
    };
  });
  
  return {
    productId: args.productId,
    currency: 'USD',
    basePrice: normalizePrice(basePrice),
    pricingTiers,
    customPricingAvailable: customerTier === 'enterprise'
  };
}
```

#### 2. checkBulkAvailability

Checks inventory availability for large quantities across warehouses.

```typescript
interface CheckBulkAvailabilityArgs {
  productId: string;
  quantity: number;
  deliveryDate?: string;
  warehouseIds?: string[];
}

interface BulkAvailabilityResponse {
  productId: string;
  requestedQuantity: number;
  availableNow: number;
  totalAvailable: number;
  availability: {
    immediate: {
      quantity: number;
      warehouses: Array<{
        id: string;
        name: string;
        quantity: number;
        location: string;
      }>;
    };
    production: {
      quantity: number;
      leadTime: number; // days
      estimatedDate: string;
    };
    alternatives: Array<{
      splitShipment: boolean;
      shipments: Array<{
        quantity: number;
        estimatedDate: string;
        source: 'warehouse' | 'production';
      }>;
    }>;
  };
}

// Implementation includes warehouse queries and production schedules
```

#### 3. requestProductSamples

Creates a sample request for B2B customers to evaluate products.

```typescript
interface RequestProductSamplesArgs {
  productIds: string[];
  shippingAddress: {
    company: string;
    attention?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  customerId: string;
  notes?: string;
}

interface SampleRequestResponse {
  requestId: string;
  status: 'pending' | 'approved' | 'shipped' | 'delivered';
  products: Array<{
    productId: string;
    name: string;
    sampleSku: string;
    approved: boolean;
  }>;
  estimatedDelivery: string;
  trackingNumber?: string;
  approvalRequired: boolean;
  salesRepAssigned?: {
    name: string;
    email: string;
    phone: string;
  };
}
```

#### 4. getAccountCredit

Retrieves credit information for B2B accounts from financial systems.

```typescript
interface GetAccountCreditArgs {
  customerId: string;
  accountId?: string;
  includePendingOrders?: boolean;
}

interface AccountCreditResponse {
  accountId: string;
  customerId: string;
  creditLimit: number;
  availableCredit: number;
  usedCredit: number;
  pendingCharges?: number;
  currency: string;
  paymentTerms: string; // e.g., "Net 30"
  creditStatus: 'active' | 'hold' | 'suspended';
  creditScore?: string;
  lastReviewDate: string;
  nextReviewDate: string;
  outstandingInvoices?: Array<{
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    daysPastDue: number;
  }>;
}
```

#### 5. scheduleProductDemo

Books a product demonstration with sales team.

```typescript
interface ScheduleProductDemoArgs {
  productIds: string[];
  preferredTimes: Array<{
    date: string;
    time: string;
    timezone: string;
  }>;
  attendees: Array<{
    name: string;
    email: string;
    role?: string;
  }>;
  customerId: string;
  demoType: 'virtual' | 'in-person';
  notes?: string;
}

interface ProductDemoResponse {
  demoId: string;
  status: 'scheduled' | 'confirmed' | 'rescheduled' | 'cancelled';
  scheduledTime: {
    date: string;
    time: string;
    timezone: string;
    duration: number;
  };
  meetingDetails: {
    type: 'virtual' | 'in-person';
    location?: string;
    joinInstructions?: string;
  };
  salesRep: {
    name: string;
    email: string;
    phone: string;
    title: string;
  };
  products: Array<{
    productId: string;
    name: string;
    demoMaterials?: string[];
  }>;
  calendarInvite: {
    icsUrl: string;
    googleCalendarUrl?: string;
    outlookUrl?: string;
  };
}
```

#### 6. applyTaxExemption

Applies tax exemption certificate to orders.

```typescript
interface ApplyTaxExemptionArgs {
  exemptionCertificate: string;
  state: string;
  cartId?: string;
  customerId: string;
  expirationDate?: string;
}

interface TaxExemptionResponse {
  exemptionId: string;
  certificateNumber: string;
  status: 'active' | 'expired' | 'invalid' | 'pending';
  validStates: string[];
  appliedToCart: boolean;
  taxSavings?: {
    originalTax: number;
    exemptedTax: number;
    netSavings: number;
  };
  expirationDate: string;
  verificationDetails: {
    verifiedAt: string;
    verifiedBy: string;
    method: 'manual' | 'automated';
  };
}
```

### B2B Extension Implementation Patterns

#### Error Handling for B2B Methods

```typescript
// Specific error handling for each method
export async function getBulkPricing(
  context: IntegrationContext,
  args: GetBulkPricingArgs
): Promise<BulkPricingResponse> {
  try {
    // Validate B2B customer
    const customer = await context.api.getCustomer();
    if (!customer.isB2B) {
      throw new Error('B2B account required');
    }
    
    // Call external pricing service
    const pricingService = await context.getApiClient('erp');
    const pricing = await pricingService.getBulkPricing(args);
    
    // Normalize response
    return normalizeBulkPricing(pricing);
    
  } catch (error) {
    if (error.code === 'PRODUCT_NOT_FOUND') {
      throw new Error(`Product ${args.productId} not found`, { cause: error });
    }
    if (error.code === 'UNAUTHORIZED') {
      throw new Error('Unauthorized access to bulk pricing', { cause: error });
    }
    throw new Error('Failed to get bulk pricing', { cause: error });
  }
}
```

#### Integration with Multiple Backends

```typescript
export async function checkBulkAvailability(
  context: IntegrationContext,
  args: CheckBulkAvailabilityArgs
): Promise<BulkAvailabilityResponse> {
  // Access multiple systems
  const warehouseApi = context.api;
  const productionApi = await context.getApiClient('production');
  const inventoryApi = await context.getApiClient('inventory');
  
  // Parallel queries for performance
  const [warehouseStock, productionSchedule, reservedStock] = await Promise.all([
    warehouseApi.getStock(args.productId, args.warehouseIds),
    productionApi.getSchedule(args.productId),
    inventoryApi.getReserved(args.productId)
  ]);
  
  // Calculate availability
  return calculateBulkAvailability({
    requested: args.quantity,
    warehouseStock,
    productionSchedule,
    reservedStock,
    deliveryDate: args.deliveryDate
  });
}
```

#### Caching Strategy for B2B

```typescript
// Cache configuration per method
const cacheConfig = {
  getBulkPricing: {
    ttl: 300, // 5 minutes
    key: (args) => `bulk-pricing:${args.productId}:${args.quantities.join(',')}`
  },
  getAccountCredit: {
    ttl: 60, // 1 minute - credit changes frequently
    key: (args) => `account-credit:${args.customerId}`
  },
  checkBulkAvailability: {
    ttl: 30, // 30 seconds - inventory is dynamic
    key: (args) => `bulk-availability:${args.productId}:${args.quantity}`
  }
};
```

### Testing Custom Extensions

```typescript
// Mock custom extension for testing
const mockCustomExtension = {
  getBulkPricing: jest.fn().mockResolvedValue({
    productId: 'prod-001',
    pricingTiers: [
      { quantity: 50, unitPrice: 95, discount: 5 },
      { quantity: 100, unitPrice: 90, discount: 10 }
    ]
  })
};

// Test the action
it('should fetch bulk pricing', async () => {
  const result = await requestBulkPricingImplementation(
    { productId: 'prod-001', quantities: [50, 100] },
    { sdk: { customExtension: mockCustomExtension } }
  );
  
  expect(mockCustomExtension.getBulkPricing).toHaveBeenCalledWith({
    productId: 'prod-001',
    quantities: [50, 100],
    customerId: undefined
  });
});
```

### Migration Notes from Frontend

The frontend currently has TODO comments where these methods should be called:

```typescript
// Before (with TODO)
// TODO: Implement actual SDK call when custom extension is ready
const mockPricing = { /* mock data */ };

// After (with real extension)
const pricing = await sdk.customExtension.getBulkPricing({
  productId: product.id,
  quantities: [50, 100, 500],
  customerId: customer.id
});
```

### Custom Extension Best Practices

1. **Always normalize data**: Use UDL normalizers for consistency
2. **Handle errors gracefully**: Return user-friendly error messages
3. **Add caching**: Cache expensive operations like pricing calculations
4. **Document thoroughly**: Include examples in CUSTOM_EXTENSIONS_SPEC.md
5. **Version your extensions**: Support backward compatibility
6. **Monitor performance**: Track response times and optimize
7. **Validate inputs**: Use Zod schemas for type safety

### Common Pitfalls to Avoid

- ❌ Don't return raw backend responses - always normalize
- ❌ Don't hardcode business logic - make it configurable
- ❌ Don't skip error handling - handle all edge cases
- ❌ Don't forget authentication - verify B2B permissions
- ❌ Don't ignore performance - add appropriate caching

## API Routes Implementation

### Overview

The AI Shopping Assistant API is built as a Next.js 14 App Router API route at `/api/ai-shopping-assistant`. It provides a production-ready interface with authentication, rate limiting, streaming support, and comprehensive observability.

### Main Route Implementation

Located at `/app/api/ai-shopping-assistant/route.ts`:

```typescript
export async function POST(request: Request) {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  
  try {
    // Validate request
    const body = await request.json();
    const validated = RequestSchema.parse(body);
    
    // Get or create session
    const sessionId = validated.sessionId || generateSessionId();
    
    // Create commerce context
    const context = {
      sessionId,
      mode: validated.mode || 'b2c',
      sdk: getSdk(), // UDL SDK instance
      customer: await getCustomerFromAuth(request),
      locale: validated.context?.locale || 'en',
      currency: validated.context?.currency || 'USD'
    };
    
    // Execute with graph
    if (validated.stream) {
      return streamResponse(validated.message, context);
    } else {
      return jsonResponse(validated.message, context);
    }
  } catch (error) {
    return handleError(error, correlationId);
  }
}
```

### Authentication & Security Middleware

```typescript
// middleware.ts
export async function authenticateRequest(request: Request): Promise<AuthResult> {
  // 1. Check API Key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && VALID_API_KEYS.includes(apiKey)) {
    return { authenticated: true, method: 'api-key' };
  }
  
  // 2. Check JWT Bearer Token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { 
        authenticated: true, 
        method: 'jwt',
        user: decoded 
      };
    } catch (error) {
      // Invalid token
    }
  }
  
  // 3. Development mode - allow anonymous
  if (process.env.NODE_ENV === 'development') {
    return { authenticated: true, method: 'anonymous' };
  }
  
  return { authenticated: false };
}
```

### Rate Limiting Implementation

Token bucket algorithm with configurable limits:

```typescript
class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  
  async checkLimit(clientId: string): Promise<RateLimitResult> {
    let bucket = this.buckets.get(clientId);
    
    if (!bucket) {
      bucket = new TokenBucket({
        capacity: parseInt(process.env.AI_RATE_LIMIT || '60'),
        refillRate: parseInt(process.env.AI_RATE_LIMIT || '60'),
        windowMs: parseInt(process.env.AI_RATE_WINDOW || '60000')
      });
      this.buckets.set(clientId, bucket);
    }
    
    const allowed = bucket.consume(1);
    const remaining = bucket.getRemaining();
    const resetTime = bucket.getResetTime();
    
    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? null : Math.ceil((resetTime - Date.now()) / 1000)
    };
  }
}
```

### Request/Response Schemas

```typescript
const RequestSchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().uuid().optional(),
  mode: z.enum(['b2c', 'b2b']).optional(),
  context: z.object({
    cartId: z.string().optional(),
    customerId: z.string().optional(),
    locale: z.string().optional(),
    currency: z.string().optional()
  }).optional(),
  stream: z.boolean().default(true)
});

const ResponseSchema = z.object({
  message: z.string(),
  actions: z.array(z.object({
    type: z.string(),
    data: z.any()
  })).optional(),
  ui: z.object({
    component: z.string(),
    data: z.any()
  }).optional(),
  metadata: z.object({
    sessionId: z.string(),
    mode: z.enum(['b2c', 'b2b']),
    processingTime: z.number(),
    version: z.string()
  })
});
```

### Streaming Implementation

Server-Sent Events (SSE) for real-time responses:

```typescript
async function streamResponse(
  message: string, 
  context: CommerceContext
): Promise<Response> {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Start streaming in background
  (async () => {
    try {
      // Send initial metadata
      await writer.write(encoder.encode(
        `event: metadata\ndata: ${JSON.stringify({
          sessionId: context.sessionId,
          mode: context.mode
        })}\n\n`
      ));
      
      // Stream graph execution
      for await (const event of graph.stream({
        messages: [new HumanMessage(message)],
        context
      })) {
        if (event.content) {
          await writer.write(encoder.encode(
            `event: content\ndata: ${JSON.stringify({
              content: event.content,
              partial: true
            })}\n\n`
          ));
        }
        
        if (event.actions) {
          await writer.write(encoder.encode(
            `event: actions\ndata: ${JSON.stringify(event.actions)}\n\n`
          ));
        }
      }
      
      // Send completion
      await writer.write(encoder.encode(
        `event: done\ndata: ${JSON.stringify({
          totalTime: Date.now() - startTime
        })}\n\n`
      ));
      
    } catch (error) {
      await writer.write(encoder.encode(
        `event: error\ndata: ${JSON.stringify({
          message: error.message
        })}\n\n`
      ));
    } finally {
      await writer.close();
    }
  })();
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
```

### Health Check Endpoint

```typescript
// /api/ai-shopping-assistant/health/route.ts
export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dependencies: {} as Record<string, any>
  };
  
  // Check OpenAI
  try {
    await openai.models.list();
    checks.dependencies.openai = { status: 'healthy' };
  } catch (error) {
    checks.dependencies.openai = { 
      status: 'unhealthy', 
      error: error.message 
    };
    checks.status = 'degraded';
  }
  
  // Check SDK/Middleware
  try {
    const sdk = getSdk();
    await sdk.unified.getCurrencies();
    checks.dependencies.middleware = { status: 'healthy' };
  } catch (error) {
    checks.dependencies.middleware = { 
      status: 'unhealthy', 
      error: error.message 
    };
    checks.status = 'unhealthy';
  }
  
  // Check configuration
  try {
    const config = await loadConfiguration();
    checks.dependencies.configuration = { 
      status: 'healthy',
      actionCount: config.actions.length
    };
  } catch (error) {
    checks.dependencies.configuration = { 
      status: 'unhealthy', 
      error: error.message 
    };
    checks.status = 'degraded';
  }
  
  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return Response.json(checks, { status: statusCode });
}
```

### Error Handling Structure

```typescript
function handleError(error: unknown, correlationId: string): Response {
  // Log error with context
  logger.error('API route error', {
    error,
    correlationId,
    stack: error instanceof Error ? error.stack : undefined
  });
  
  // Determine status code and message
  let status = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  
  if (error instanceof z.ZodError) {
    status = 400;
    message = 'Invalid request parameters';
    code = 'VALIDATION_ERROR';
  } else if (error instanceof AuthenticationError) {
    status = 401;
    message = 'Authentication required';
    code = 'AUTH_REQUIRED';
  } else if (error instanceof RateLimitError) {
    status = 429;
    message = 'Rate limit exceeded';
    code = 'RATE_LIMIT_EXCEEDED';
  }
  
  return Response.json({
    error: {
      message,
      code,
      correlationId,
      timestamp: new Date().toISOString()
    }
  }, { 
    status,
    headers: error instanceof RateLimitError ? {
      'Retry-After': error.retryAfter.toString()
    } : {}
  });
}
```

### Configuration via Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0
OPENAI_MAX_TOKENS=2000

# Authentication
VALID_API_KEYS=key1,key2,key3  # Comma-separated
JWT_SECRET=your-jwt-secret
AUTH_REQUIRED=true              # Set to false for dev

# Rate Limiting
AI_RATE_LIMIT=60               # Requests per window
AI_RATE_WINDOW=60000           # Window in milliseconds

# CORS Configuration
ALLOWED_ORIGINS=https://example.com,*.example.com

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
ENABLE_TRACING=true
ENABLE_METRICS=true
LOG_LEVEL=info
```

### OpenAPI Documentation

Complete OpenAPI 3.1.0 specification provided:

```yaml
openapi: 3.1.0
info:
  title: AI Shopping Assistant API
  version: 1.0.0
  description: Production-ready AI shopping assistant with B2C/B2B support

servers:
  - url: /api/ai-shopping-assistant
    description: API endpoint

paths:
  /:
    post:
      summary: Send message to AI assistant
      operationId: chatWithAssistant
      security:
        - apiKey: []
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatRequest'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatResponse'
            text/event-stream:
              schema:
                type: string
                description: Server-sent events stream
                
  /health:
    get:
      summary: Health check endpoint
      operationId: healthCheck
      responses:
        '200':
          description: Service is healthy
        '503':
          description: Service is unhealthy or degraded
```

### Usage Examples

#### Non-Streaming Request
```typescript
const response = await fetch('/api/ai-shopping-assistant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    message: 'Show me waterproof jackets',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    mode: 'b2c',
    stream: false
  })
});

const data = await response.json();
console.log(data.message);
```

#### Streaming Request
```typescript
const response = await fetch('/api/ai-shopping-assistant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    message: 'I need 100 units of product SKU-123',
    mode: 'b2b',
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const events = chunk.split('\n\n').filter(Boolean);
  
  for (const event of events) {
    const [eventType, eventData] = event.split('\ndata: ');
    const type = eventType.replace('event: ', '');
    const data = JSON.parse(eventData);
    
    switch (type) {
      case 'content':
        updateUI(data.content);
        break;
      case 'actions':
        handleActions(data);
        break;
      case 'ui':
        renderComponent(data);
        break;
    }
  }
}
```

### Security Considerations

1. **Input Validation**: All inputs validated with Zod schemas
2. **Authentication**: Multiple methods supported (API key, JWT)
3. **Rate Limiting**: Token bucket algorithm prevents abuse
4. **CORS**: Configurable origin validation
5. **Security Headers**: Standard headers on all responses
6. **Error Sanitization**: No sensitive data in error responses
7. **Request Logging**: Correlation IDs for tracking

### Performance Optimizations

1. **Lazy Initialization**: Components initialized on first request
2. **Connection Pooling**: Reuse HTTP connections
3. **Streaming**: Reduces perceived latency
4. **Caching Headers**: Appropriate cache control
5. **Timeout Management**: Configurable timeouts
6. **Metric Collection**: Performance tracking

### Monitoring & Observability

```typescript
// Prometheus metrics
metrics.increment('ai_assistant_requests_total', {
  method: 'POST',
  status: response.status,
  mode: context.mode
});

metrics.recordHistogram('ai_assistant_response_time', {
  duration: Date.now() - startTime,
  streaming: validated.stream
});

// OpenTelemetry tracing
const span = tracer.startSpan('ai-assistant-request', {
  attributes: {
    'request.id': correlationId,
    'request.mode': context.mode,
    'request.streaming': validated.stream
  }
});
```

## Error Handling Integration

### Framework Overview

A comprehensive error handling framework has been built but requires integration into existing components. The framework provides:

- Type-safe error hierarchy
- Recovery strategies (retry, circuit breaker, fallback)
- User-friendly message generation
- Graph node error boundaries
- Comprehensive error reporting

### Error Type Hierarchy

```typescript
// Base error class
export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly isRetryable: boolean;
  abstract readonly userMessage: string;
  
  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific error types
export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly isRetryable = false;
  
  get userMessage() {
    return 'Please check your input and try again.';
  }
}

export class UDLError extends BaseError {
  readonly code = 'UDL_ERROR';
  readonly statusCode = 502;
  readonly isRetryable = true;
  
  constructor(
    message: string,
    public readonly method: string,
    public readonly originalError?: unknown,
    context?: Record<string, any>
  ) {
    super(message, context);
  }
  
  get userMessage() {
    return 'We\'re having trouble accessing product information. Please try again.';
  }
}

export class ModelError extends BaseError {
  readonly code = 'MODEL_ERROR';
  readonly statusCode = 503;
  readonly isRetryable = true;
  
  get userMessage() {
    return 'Our AI assistant is temporarily unavailable. Please try again in a moment.';
  }
}
```

### Recovery Strategies

```typescript
export enum RecoveryStrategy {
  NONE = 'none',
  RETRY_WITH_BACKOFF = 'retry_with_backoff',
  CIRCUIT_BREAKER = 'circuit_breaker',
  FALLBACK = 'fallback',
  CACHE = 'cache'
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    action?: string;
    recoveryStrategy?: RecoveryStrategy;
    maxRetries?: number;
    fallback?: () => T;
  } = {}
): Promise<T> {
  const {
    action = 'unknown',
    recoveryStrategy = RecoveryStrategy.NONE,
    maxRetries = 3,
    fallback
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if retryable
      if (!isRetryable(error) || attempt === maxRetries) {
        break;
      }
      
      // Apply recovery strategy
      if (recoveryStrategy === RecoveryStrategy.RETRY_WITH_BACKOFF) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Try fallback
  if (fallback && recoveryStrategy === RecoveryStrategy.FALLBACK) {
    try {
      return fallback();
    } catch (fallbackError) {
      // Fallback also failed
    }
  }
  
  // Report and throw
  await reportError(lastError!, { action, attempts: maxRetries + 1 });
  throw lastError!;
}
```

### Graph Node Error Boundaries

```typescript
export function createSafeNode<T>(
  node: (state: T) => Promise<Partial<T>>,
  options: {
    critical?: boolean;
    maxRetries?: number;
    fallbackState?: Partial<T>;
  } = {}
): (state: T) => Promise<Partial<T>> {
  return async (state: T) => {
    try {
      return await withErrorHandling(
        () => node(state),
        {
          recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
          maxRetries: options.maxRetries || 1,
          fallback: options.fallbackState ? 
            () => options.fallbackState! : 
            undefined
        }
      );
    } catch (error) {
      if (options.critical) {
        throw error; // Propagate critical errors
      }
      
      // Non-critical errors - log and continue
      logger.error('Node execution failed', {
        node: node.name,
        error,
        state: state
      });
      
      return options.fallbackState || {};
    }
  };
}
```

### Integration Tasks (TODOs)

The framework is complete but needs to be integrated into:

1. **Graph Nodes**: Update all nodes to use `createSafeNode()` wrapper
2. **Action Implementations**: Wrap with `withErrorHandling()`
3. **API Routes**: Replace simple error handler with framework
4. **Recovery Activation**: Enable retry and circuit breaker strategies
5. **B2B Error Handling**: Add mode-specific error types
6. **Monitoring Setup**: Configure external error reporting

### User-Friendly Error Messages

```typescript
export function generateUserMessage(error: Error): string {
  // Check if error has built-in user message
  if (error instanceof BaseError) {
    return error.userMessage;
  }
  
  // Map common errors to user messages
  const errorMessages: Record<string, string> = {
    'ECONNREFUSED': 'Unable to connect to our services. Please try again.',
    'ETIMEDOUT': 'The request took too long. Please try again.',
    'UNAUTHORIZED': 'Please sign in to continue.',
    'FORBIDDEN': 'You don\'t have permission to perform this action.',
    'NOT_FOUND': 'We couldn\'t find what you\'re looking for.',
    'RATE_LIMIT': 'You\'re making requests too quickly. Please slow down.'
  };
  
  // Check error code
  const errorCode = (error as any).code || error.name;
  if (errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }
  
  // Default message
  return 'Something went wrong. Please try again or contact support.';
}
```

### Testing Error Scenarios

```typescript
describe('Error Handling', () => {
  it('should retry on transient failures', async () => {
    let attempts = 0;
    const operation = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new UDLError('Network error', 'searchProducts');
      }
      return { success: true };
    });
    
    const result = await withErrorHandling(operation, {
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
      maxRetries: 3
    });
    
    expect(result).toEqual({ success: true });
    expect(attempts).toBe(3);
  });
  
  it('should use fallback on failure', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failed'));
    const fallback = jest.fn().mockResolvedValue({ fallback: true });
    
    const result = await withErrorHandling(operation, {
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      fallback
    });
    
    expect(result).toEqual({ fallback: true });
    expect(fallback).toHaveBeenCalled();
  });
});
```

## Directory Structure

```
features/ai-shopping-assistant/
├── actions/                     # Action implementations
│   ├── implementations/         # UDL-based action logic
│   │   ├── search-implementation.ts
│   │   ├── cart-implementation.ts
│   │   └── b2b-implementation.ts
│   └── registry-v2.ts          # Action registry with config support
├── config/                     # Configuration system
│   ├── types.ts               # Config type definitions
│   ├── loader.ts              # YAML/JSON config loader
│   └── validator.ts           # Config validation
├── errors/                    # Error handling framework
│   ├── types.ts              # Error type hierarchy
│   ├── handlers.ts           # Recovery strategies
│   ├── reporting.ts          # User-friendly messages
│   └── boundaries.ts         # Graph error boundaries
├── graphs/                    # LangGraph components
│   ├── nodes/                # Graph nodes
│   │   ├── detect-intent.ts
│   │   ├── enrich-context.ts
│   │   └── execute-action.ts
│   └── main-graph.ts         # Main workflow
├── intelligence/             # Commerce intelligence
│   ├── mode-detector.ts     # B2C/B2B detection
│   ├── context-enricher.ts  # Query enhancement
│   └── intent-predictor.ts  # Action prediction
├── observability/           # Monitoring & logging
│   ├── telemetry.ts        # OpenTelemetry setup
│   ├── logger.ts           # Structured logging
│   ├── metrics.ts          # Metrics collection
│   └── profiler.ts         # Performance profiling
├── security/               # Security layer
│   ├── judge.ts           # Input/output validation
│   ├── validators.ts      # Threat detection
│   └── rate-limiter.ts    # Rate limiting
├── state/                  # State management
│   ├── commerce-state.ts   # State definition
│   └── reducers.ts        # State reducers
├── tools/                  # LangGraph tools
│   ├── factory.ts         # Tool creation
│   └── registry.ts        # Tool management
└── types/                  # TypeScript types
    ├── index.ts           # Public type exports
    └── internal.ts        # Internal types
```

## Key Design Patterns

### Tool Factory Pattern
The `LangGraphActionFactory` converts declarative `ActionDefinition` configurations into LangGraph tools with automatic:
- Performance tracking
- Security validation
- Error handling
- Rate limiting
- Structured logging

### Command Pattern for State Updates
Tools return `Command` objects that are applied to state by the graph:
```typescript
return new Command({
  update: {
    lastAction: action.name,
    actionResults: enhanced,
    cartState: cart,
    searchResults: results
  }
});
```

### Registry Pattern
The `CommerceToolRegistry` manages tool lifecycle and enables runtime updates:
```typescript
registry.register(actionDefinition);
registry.update(actionId, newDefinition);
registry.getTools(); // Returns all active tools
```

### Multi-Layer Caching Pattern

```typescript
class CachedActionExecutor {
  private l1Cache = new Map<string, CacheEntry>(); // Memory
  private l2Cache: Redis; // Distributed
  
  async executeCached(
    action: AlokaiAction,
    params: any,
    context: Context
  ): Promise<any> {
    const cacheKey = this.generateCacheKey(action.name, params, context.mode);
    
    // L1 Check (Memory)
    const l1Result = this.l1Cache.get(cacheKey);
    if (l1Result && !this.isExpired(l1Result, action.cacheTTL)) {
      metrics.increment('cache.l1.hit');
      return l1Result.value;
    }
    
    // L2 Check (Redis)
    const l2Result = await this.l2Cache.get(cacheKey);
    if (l2Result) {
      const parsed = JSON.parse(l2Result);
      if (!this.isExpired(parsed, action.cacheTTL)) {
        metrics.increment('cache.l2.hit');
        // Promote to L1
        this.l1Cache.set(cacheKey, parsed);
        return parsed.value;
      }
    }
    
    // Cache miss - execute
    const result = await action.execute(params, context);
    
    // Cache result
    const entry = {
      value: result,
      timestamp: Date.now(),
      ttl: action.cacheTTL
    };
    
    this.l1Cache.set(cacheKey, entry);
    await this.l2Cache.setex(cacheKey, action.cacheTTL, JSON.stringify(entry));
    
    return result;
  }
}
```

## State Management

Using LangGraph's `MessagesAnnotation.spec` extended with commerce-specific fields:

```typescript
const CommerceStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  
  // Commerce mode
  mode: Annotation<"b2c" | "b2b">()
    .reducer((_, next) => next ?? "b2c"),
  
  // Context with UDL SDK access
  context: Annotation<CommerceContext>()
    .default(() => ({
      sessionId: generateId(),
      sdk: null, // Injected at runtime
      customer: null,
      organization: null
    })),
  
  // Security tracking
  security: Annotation<SecurityContext>()
    .default(() => ({
      validatedInputs: [],
      threatLevel: 'low',
      rateLimitRemaining: 100
    })),
  
  // Performance monitoring
  performance: Annotation<PerformanceContext>()
    .default(() => ({
      startTime: Date.now(),
      operations: []
    }))
});
```

## Security Architecture

### Input Validation Layer
```typescript
class SecurityJudge {
  async validateInput(input: string, context: SecurityContext): Promise<ValidationResult> {
    // Check for prompt injection
    if (this.detectPromptInjection(input)) {
      return { valid: false, reason: 'Potential prompt injection detected' };
    }
    
    // Validate against business rules
    if (this.violatesBusinessRules(input, context)) {
      return { valid: false, reason: 'Business rule violation' };
    }
    
    // Check rate limits
    if (!this.checkRateLimit(context)) {
      return { valid: false, reason: 'Rate limit exceeded' };
    }
    
    return { valid: true };
  }
}
```

### Rate Limiting Implementation

Token bucket algorithm for API protection:

```typescript
class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  
  async checkLimit(clientId: string): Promise<RateLimitResult> {
    let bucket = this.buckets.get(clientId);
    
    if (!bucket) {
      bucket = new TokenBucket({
        capacity: parseInt(process.env.AI_RATE_LIMIT || '60'),
        refillRate: parseInt(process.env.AI_RATE_LIMIT || '60'),
        windowMs: parseInt(process.env.AI_RATE_WINDOW || '60000')
      });
      this.buckets.set(clientId, bucket);
    }
    
    const allowed = bucket.consume(1);
    const remaining = bucket.getRemaining();
    const resetTime = bucket.getResetTime();
    
    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? null : Math.ceil((resetTime - Date.now()) / 1000)
    };
  }
}

// Apply rate limiting in API routes
export async function rateLimitMiddleware(
  request: Request,
  clientId: string
): Promise<Response | null> {
  const result = await rateLimiter.checkLimit(clientId);
  
  if (!result.allowed) {
    return Response.json({
      error: {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: result.retryAfter
      }
    }, {
      status: 429,
      headers: {
        'Retry-After': result.retryAfter!.toString(),
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString()
      }
    });
  }
  
  return null; // Continue processing
}
```

### Permission-Based Access Control
```typescript
class B2BPermissionChecker {
  async checkPermission(
    action: string,
    user: User,
    organization: Organization
  ): Promise<boolean> {
    // Check organization permissions
    if (!organization.permissions.includes(action)) {
      return false;
    }
    
    // Check user role within organization
    const userRole = await this.getUserRole(user, organization);
    return this.roleHasPermission(userRole, action);
  }
}
```

## Performance Strategy

### Response Time Target: 200-250ms

#### Performance Budget Breakdown
- LangGraph orchestration: 50ms
- Model inference: 100ms
- UDL data access: 50ms
- Business logic: 50ms

#### Optimization Strategies
1. **Aggressive Caching**: Multi-layer cache with intelligent invalidation
2. **Parallel Execution**: Execute independent operations concurrently
3. **Connection Pooling**: Reuse database and API connections
4. **Query Optimization**: Batch UDL requests where possible

### Performance Monitoring Pattern

```typescript
class PerformanceTracker {
  async trackOperation<T>(
    name: string,
    operation: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await operation();
      
      const duration = performance.now() - startTime;
      const memoryDelta = process.memoryUsage().heapUsed - startMemory.heapUsed;
      
      // Record metrics
      metrics.recordHistogram('operation_duration', duration, { operation: name, ...labels });
      metrics.recordGauge('memory_usage', memoryDelta, { operation: name });
      
      // Check performance budget
      if (duration > PERFORMANCE_BUDGET[name]) {
        logger.warn(`Performance budget exceeded for ${name}`, {
          duration,
          budget: PERFORMANCE_BUDGET[name]
        });
      }
      
      return result;
    } catch (error) {
      metrics.increment('operation_errors', { operation: name, error: error.code });
      throw error;
    }
  }
}
```

## Observability Implementation

### Structured Logging
```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  context: {
    sessionId: string;
    userId?: string;
    organizationId?: string;
    mode: 'b2c' | 'b2b';
    actionId?: string;
    requestId: string;
    traceId: string;
    spanId: string;
  };
  metadata?: Record<string, unknown>;
  performance?: {
    duration?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}
```

### Distributed Tracing with OpenTelemetry
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('ai-shopping-assistant');

export function tracedOperation<T>(
  name: string,
  operation: () => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Add attributes
      Object.entries(attributes || {}).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
      
      // Execute operation
      const result = await operation();
      
      // Mark success
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      // Record error
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error.message 
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### Business Metrics Collection
```typescript
class BusinessMetrics {
  // Action usage
  recordActionUsage(actionId: string, mode: 'b2c' | 'b2b', success: boolean) {
    metrics.increment('action_usage', {
      action: actionId,
      mode,
      success: success.toString()
    });
  }
  
  // Conversion tracking
  recordConversion(type: 'search_to_cart' | 'cart_to_order', value: number) {
    metrics.increment('conversions', { type });
    metrics.recordHistogram('conversion_value', value, { type });
  }
  
  // B2B specific metrics
  recordB2BOperation(operation: string, organization: string, itemCount: number) {
    metrics.increment('b2b_operations', { operation, organization });
    metrics.recordHistogram('b2b_item_count', itemCount, { operation });
  }
}
```

## Testing Patterns

### Graph Testing Pattern
```typescript
describe('CommerceGraph', () => {
  let graph: CompiledStateGraph;
  let mockTools: any[];
  
  beforeEach(() => {
    // Create mock tools with UDL responses
    mockTools = [
      tool(
        async ({ query }) => {
          return new Command({
            update: {
              searchResults: {
                products: mockUDLSearchResponse(query),
                query
              }
            }
          });
        },
        {
          name: "search-products",
          description: "Search for products",
          schema: z.object({ query: z.string() })
        }
      )
    ];
    
    graph = createCommerceGraph(mockTools);
  });
  
  it('should handle complete shopping flow', async () => {
    const checkpointer = new MemorySaver();
    const config = {
      configurable: {
        thread_id: 'test-thread',
        sdk: mockSDK // Inject mock SDK for testing
      }
    };
    
    // Test search
    const searchResult = await graph.invoke({
      messages: [new HumanMessage('Find waterproof jackets')]
    }, { ...config, checkpointer });
    
    expect(searchResult.searchResults).toBeDefined();
    expect(searchResult.searchResults.products).toHaveLength(3);
  });
});
```

### Performance Testing Pattern
```typescript
describe('Performance Requirements', () => {
  it('should meet 250ms SLA', async () => {
    const iterations = 100;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      await graph.invoke({
        messages: [new HumanMessage('Show products')]
      });
      
      times.push(performance.now() - start);
    }
    
    const p95 = percentile(times, 0.95);
    const p99 = percentile(times, 0.99);
    
    expect(p95).toBeLessThan(250);
    expect(p99).toBeLessThan(300);
  });
});
```

## Configuration Management

### Environment-Based Configuration
```typescript
export const config = {
  // UDL Configuration
  udl: {
    endpoint: process.env.NEXT_PUBLIC_ALOKAI_MIDDLEWARE_URL || 'http://localhost:4000',
    timeout: parseInt(process.env.UDL_TIMEOUT || '5000'),
    cache: {
      enabled: process.env.UDL_CACHE_ENABLED === 'true',
      ttl: parseInt(process.env.UDL_CACHE_TTL || '300')
    }
  },
  
  // AI Configuration
  ai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000')
  },
  
  // Authentication Configuration
  auth: {
    validApiKeys: process.env.VALID_API_KEYS?.split(',') || [],
    jwtSecret: process.env.JWT_SECRET,
    required: process.env.AUTH_REQUIRED !== 'false'
  },
  
  // Performance Configuration
  performance: {
    targetResponseTime: parseInt(process.env.TARGET_RESPONSE_TIME || '250'),
    timeoutMs: parseInt(process.env.TIMEOUT_MS || '30000'),
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '10')
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    limit: parseInt(process.env.AI_RATE_LIMIT || '60'),
    windowMs: parseInt(process.env.AI_RATE_WINDOW || '60000')
  },
  
  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  },
  
  // Observability Configuration
  observability: {
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    enableTracing: process.env.ENABLE_TRACING === 'true',
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  
  // Security Configuration
  security: {
    enableJudge: process.env.ENABLE_SECURITY_JUDGE !== 'false',
    multistore: process.env.NEXT_PUBLIC_ALOKAI_MULTISTORE_ENABLED === 'true'
  }
};
```

### Environment Variables Reference

```bash
# OpenAI Configuration
OPENAI_API_KEY=your-key               # Required in production
OPENAI_MODEL=gpt-4-turbo-preview     # Model to use
OPENAI_TEMPERATURE=0                  # Model temperature (0-1)
OPENAI_MAX_TOKENS=2000               # Max response tokens

# Authentication
VALID_API_KEYS=key1,key2,key3       # Comma-separated API keys
JWT_SECRET=your-jwt-secret           # JWT signing secret
AUTH_REQUIRED=true                   # Require auth in production

# Rate Limiting
AI_RATE_LIMIT=60                     # Requests per window
AI_RATE_WINDOW=60000                 # Window in milliseconds

# CORS Configuration
ALLOWED_ORIGINS=https://example.com,*.example.com  # Allowed origins

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318  # OpenTelemetry endpoint
ENABLE_TRACING=true                  # Enable distributed tracing
ENABLE_METRICS=true                  # Enable metrics collection
LOG_LEVEL=info                       # Logging level

# Alokai Configuration
NEXT_PUBLIC_ALOKAI_MIDDLEWARE_URL=http://localhost:4000  # Middleware URL
NEXT_PUBLIC_ALOKAI_MULTISTORE_ENABLED=false             # Multistore support

# Performance
TARGET_RESPONSE_TIME=250             # Target response time (ms)
TIMEOUT_MS=30000                     # Request timeout
MAX_CONCURRENT=10                    # Max concurrent operations

# Caching
UDL_CACHE_ENABLED=true              # Enable UDL caching
UDL_CACHE_TTL=300                   # Cache TTL in seconds

# Security
ENABLE_SECURITY_JUDGE=true          # Enable security validation
```

### Action Configuration Schema
```typescript
const ActionConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['search', 'cart', 'customer', 'checkout', 'b2b', 'support']),
  parameters: z.record(ParameterSchemaConfig).optional(),
  implementation: z.object({
    type: z.enum(['function', 'composed', 'external']),
    handler: z.string().optional(),
    steps: z.array(z.string()).optional()
  }),
  udl: z.object({
    methods: z.array(z.string()),
    cache: z.object({
      enabled: z.boolean().default(true),
      ttl: z.number().default(300),
      key: z.string().optional()
    }).optional()
  }).optional(),
  security: z.object({
    requiresAuth: z.boolean().default(false),
    allowedRoles: z.array(z.string()).default(['*']),
    rateLimit: z.object({
      requests: z.number().default(100),
      windowMs: z.number().default(60000)
    }).optional()
  }).optional(),
  performance: z.object({
    timeoutMs: z.number().default(5000),
    retries: z.number().default(1),
    priority: z.enum(['low', 'medium', 'high']).default('medium')
  }).optional()
});
```

## Integration Points

### Alokai SDK Integration
```typescript
// In graph node
const enrichContextNode = async (state: CommerceState) => {
  // Get SDK from context
  const sdk = state.context.sdk;
  
  // Use UDL methods
  const customer = await sdk.unified.getCustomer();
  const cart = await sdk.unified.getCart();
  
  return {
    context: {
      ...state.context,
      customer,
      cart,
      isB2B: customer?.organizationId !== undefined
    }
  };
};
```

### Frontend Integration Hooks
```typescript
export function useShoppingAssistant() {
  const sdk = useSdk();
  const [state, setState] = useState<AssistantState>();
  
  const sendMessage = useCallback(async (message: string) => {
    // Call AI assistant API
    const response = await fetch('/api/ai-shopping-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await sdk.getToken()}`
      },
      body: JSON.stringify({ 
        message,
        context: {
          cartId: sdk.cart.id,
          customerId: sdk.customer?.id
        }
      })
    });
    
    // Handle streaming response
    const reader = response.body.getReader();
    // ... streaming logic
  }, [sdk]);
  
  return { state, sendMessage };
}
```

## Deployment Considerations

### Scalability Architecture
```typescript
interface ScalableArchitecture {
  // Stateless components for horizontal scaling
  api: {
    instances: 'auto-scaled',
    loadBalancer: 'round-robin'
  };
  
  // Distributed caching
  cache: {
    layer1: 'in-memory',
    layer2: 'redis-cluster'
  };
  
  // Queue-based processing for bulk operations
  queues: {
    bulkOperations: 'sqs/pubsub',
    asyncProcessing: 'temporal'
  };
  
  // State management
  state: {
    session: 'redis',
    checkpoints: 'postgresql'
  };
}
```

### Monitoring Stack
- **Metrics**: Prometheus + Grafana
- **Tracing**: Jaeger or Google Cloud Trace
- **Logging**: ELK Stack or Google Cloud Logging
- **Alerting**: PagerDuty integration
- **APM**: DataDog or New Relic

## Future Extensibility

### Plugin Architecture
```typescript
interface AssistantPlugin {
  id: string;
  name: string;
  version: string;
  
  // Plugin provides actions
  actions?: ActionDefinition[];
  
  // Plugin provides UI components
  components?: Record<string, React.ComponentType>;
  
  // Plugin provides data sources
  dataSources?: DataSourceDefinition[];
  
  // Lifecycle hooks
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
}
```

### Multi-Modal Support Preparation
```typescript
interface MultiModalInput {
  text?: string;
  images?: Array<{
    url: string;
    mimeType: string;
    context?: string;
  }>;
  voice?: {
    audioUrl: string;
    transcript?: string;
  };
}

interface MultiModalAction extends ActionDefinition {
  supportedInputTypes: ('text' | 'image' | 'voice')[];
  processMultiModal?: (input: MultiModalInput) => Promise<any>;
}
```

## Key Validation Insights

### What Changed from Original Patterns:
1. **State Access in Tools**: Use `config.configurable.getCurrentTaskInput()` not direct context access
2. **Command Pattern**: Tools should return `Command` objects for state updates
3. **MessagesAnnotation**: Always use `MessagesAnnotation.spec` as base for state
4. **ToolNode**: Use prebuilt `ToolNode` from `@langchain/langgraph/prebuilt`
5. **Conditional Edges**: Use object mapping format for cleaner routing

### Confirmed Correct:
1. ✅ Tool creation with `tool()` function
2. ✅ Zod schema generation approach
3. ✅ StateGraph construction pattern
4. ✅ Streaming with `streamMode` parameter
5. ✅ Checkpointing with MemorySaver

## Related Documents
- **Implementation Guide**: `IMPLEMENTATION_GUIDE.md`
- **Learnings & Issues**: `LEARNINGS_AND_ISSUES.md`
- **Main Project Doc**: `CLAUDE.md`

---

*Remember: Architecture is a living document. Update it as the system evolves and new patterns emerge.*