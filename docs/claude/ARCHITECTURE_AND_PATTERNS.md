# Architecture and Patterns Reference
*Technical Reference for AI Shopping Assistant Implementation*

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Architectural Principles](#core-architectural-principles)
3. [Validated Code Patterns](#validated-code-patterns)
4. [UDL Integration Patterns](#udl-integration-patterns)
5. [Directory Structure](#directory-structure)
6. [Key Design Patterns](#key-design-patterns)
7. [State Management](#state-management)
8. [Security Architecture](#security-architecture)
9. [Performance Strategy](#performance-strategy)
10. [Observability Implementation](#observability-implementation)

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
    endpoint: process.env.UDL_ENDPOINT || 'http://localhost:4000',
    timeout: parseInt(process.env.UDL_TIMEOUT || '5000'),
    cache: {
      enabled: process.env.UDL_CACHE_ENABLED === 'true',
      ttl: parseInt(process.env.UDL_CACHE_TTL || '300')
    }
  },
  
  // AI Configuration
  ai: {
    model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000')
  },
  
  // Performance Configuration
  performance: {
    targetResponseTime: parseInt(process.env.TARGET_RESPONSE_TIME || '250'),
    timeoutMs: parseInt(process.env.TIMEOUT_MS || '30000'),
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '10')
  },
  
  // Security Configuration
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100')
    },
    enableJudge: process.env.ENABLE_SECURITY_JUDGE !== 'false'
  }
};
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