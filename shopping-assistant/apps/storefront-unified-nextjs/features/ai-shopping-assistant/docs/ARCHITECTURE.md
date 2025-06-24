# AI Shopping Assistant Architecture Overview

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Integration Points](#integration-points)
5. [Security Architecture](#security-architecture)
6. [Performance Architecture](#performance-architecture)
7. [Deployment Architecture](#deployment-architecture)

## System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React UI Components]
        Hook[useShoppingAssistant Hook]
        Stream[Streaming Client]
    end
    
    subgraph "API Layer"
        API[/api/ai-shopping-assistant]
        Auth[Authentication]
        Rate[Rate Limiter]
    end
    
    subgraph "AI Layer"
        Graph[LangGraph Engine]
        Actions[Action Registry]
        Intel[Commerce Intelligence]
        Judge[Security Judge]
    end
    
    subgraph "Data Layer"
        UDL[Unified Data Layer]
        SAPCC[SAP Commerce Cloud]
        CMS[Contentful CMS]
        Custom[Custom Extensions]
    end
    
    subgraph "Infrastructure"
        Config[Configuration System]
        Obs[Observability]
        Cache[Cache Layer]
    end
    
    UI --> Hook
    Hook --> Stream
    Stream --> API
    API --> Auth
    API --> Rate
    API --> Graph
    Graph --> Actions
    Graph --> Intel
    Graph --> Judge
    Actions --> UDL
    UDL --> SAPCC
    UDL --> CMS
    UDL --> Custom
    Graph --> Obs
    Actions --> Config
    Graph --> Cache
```

## Core Components

### 1. LangGraph Engine
The orchestration layer that manages conversation flow and state.

```typescript
// Core workflow definition
const graph = new StateGraph(CommerceStateAnnotation)
  .addNode("detectIntent", detectIntentNode)
  .addNode("enrichContext", enrichContextNode)
  .addNode("tools", new ToolNode(tools))
  .addNode("formatResponse", formatResponseNode)
  .compile();
```

**Key Responsibilities:**
- State management using MessagesAnnotation
- Tool orchestration via ToolNode
- Conversation flow control
- Context preservation

### 2. Action Registry
Dynamic tool registration system for extensibility.

```typescript
interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  category: "search" | "cart" | "customer" | "comparison" | "b2b";
  parameters: Record<string, ParameterDefinition>;
  execute: (params: any, context: Context) => Promise<any>;
  udl: {
    methods: string[];  // Required UDL methods
  };
}
```

**Features:**
- Configuration-driven tools
- Runtime registration
- Type-safe execution
- UDL integration enforcement

### 3. Commerce Intelligence Layer
The differentiating intelligence that powers smart commerce decisions.

```typescript
interface CommerceIntelligence {
  modeDetection: (query: string) => Promise<"b2c" | "b2b">;
  contextEnrichment: (state: CommerceState) => Promise<EnrichedContext>;
  intentPrediction: (history: Message[]) => Promise<PredictedAction[]>;
  securityValidation: (input: any) => Promise<ValidationResult>;
}
```

**Capabilities:**
- B2C/B2B mode detection
- Query enrichment with commerce context
- Next action prediction
- Security threat detection

### 4. Unified Data Layer (UDL)
The foundation for all data access - Alokai's core architecture.

```typescript
// ALL data access MUST go through UDL
const products = await sdk.unified.searchProducts({ search: query });
const inventory = await sdk.unified.checkInventory(productIds);
const cart = await sdk.unified.addCartLineItem({ productId, quantity });
```

**Benefits:**
- Consistent data structure across 20+ backends
- <50ms performance optimization
- Backend flexibility without code changes
- Unified commerce view for intelligence

## Data Flow

### 1. Request Flow
```
User Input → Frontend Hook → Streaming Client → API Route
→ Authentication → Rate Limiting → LangGraph Engine
→ Intent Detection → Context Enrichment → Tool Selection
→ Tool Execution → UDL Access → Response Formatting
→ Streaming Response → UI Update
```

### 2. State Management Flow
```typescript
// State flows through the graph with reducers
const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  mode: Annotation<"b2c" | "b2b">()
    .reducer((current, update) => update ?? current),
  cart: Annotation<CartState>()
    .reducer((current, update) => ({ ...current, ...update })),
  context: Annotation<CommerceContext>()
    .reducer((current, update) => ({ ...current, ...update }))
});
```

### 3. Streaming Flow
```
LangGraph → Server-Sent Events → Streaming Client → useReducer → UI
```

## Integration Points

### 1. Frontend Integration
- **Hook**: `useShoppingAssistant()` - Main integration point
- **Components**: Modular UI components for chat interface
- **Streaming**: Real-time updates via SSE
- **State**: React useReducer for local state management

### 2. Backend Integration
- **API Route**: `/api/ai-shopping-assistant` - Main endpoint
- **SDK Context**: Access to Alokai SDK in all actions
- **UDL Methods**: All commerce operations through unified layer
- **Custom Extensions**: B2B operations via `sdk.customExtension.*`

### 3. External Services
- **LLM Provider**: OpenAI/Anthropic via LangChain
- **Commerce Backend**: SAP Commerce Cloud via UDL
- **CMS**: Contentful for content enrichment
- **Analytics**: Event tracking for intelligence improvement

## Security Architecture

### 1. Input Validation
```typescript
// Judge pattern implementation
const securityJudge = {
  validateInput: async (input: string) => {
    // Check for prompt injection
    // Validate business rules
    // Sanitize user input
    return { safe: boolean, reason?: string };
  }
};
```

### 2. Authentication & Authorization
- Session-based authentication
- API key validation for direct API access
- Role-based access for B2B features
- Rate limiting per user/session

### 3. Data Protection
- No sensitive data in logs
- PII handling compliance
- Secure session storage
- Encrypted communications

## Performance Architecture

### 1. Response Time Targets
- **P50**: <200ms
- **P95**: <250ms
- **P99**: <500ms

### 2. Optimization Strategies
```typescript
// Caching layer
const cache = new Cache({
  ttl: 300, // 5 minutes
  maxSize: 1000
});

// Parallel data fetching
const [products, inventory] = await Promise.all([
  sdk.unified.searchProducts(params),
  sdk.unified.checkInventory(ids)
]);
```

### 3. Monitoring Points
- Node execution time
- UDL query latency
- LLM response time
- End-to-end latency
- Cache hit rates

## Deployment Architecture

### 1. Development Environment
```yaml
# Local development setup
Frontend: http://localhost:3000
Middleware: http://localhost:4000
Hot Reload: Enabled
Mock Mode: Available for testing
```

### 2. Production Architecture (Future)
```yaml
# Target production setup
Frontend: Next.js on Vercel/GCP Cloud Run
Middleware: Node.js on GCP Cloud Run
LLM: OpenAI API with fallback
Cache: Redis for session/response caching
CDN: CloudFlare for static assets
```

### 3. Scalability Considerations
- Stateless design for horizontal scaling
- Connection pooling for UDL
- Response streaming for perceived performance
- Queue-based processing for bulk operations

## Key Architectural Decisions

### 1. LangGraph.js for Orchestration
**Why**: Provides structured conversation flow with built-in state management
**Alternative Considered**: Custom state machine
**Decision**: LangGraph's prebuilt components reduce complexity

### 2. Configuration-Driven Tools
**Why**: Business users can extend without code changes
**Alternative Considered**: Hardcoded actions
**Decision**: Flexibility worth the added complexity

### 3. UDL-First Architecture
**Why**: Alokai's core value proposition
**Alternative Considered**: Direct API integration
**Decision**: UDL provides consistency and performance

### 4. Streaming Responses
**Why**: Better perceived performance
**Alternative Considered**: Polling-based updates
**Decision**: SSE provides real-time feel

### 5. Security Judge Pattern
**Why**: Proactive security from the start
**Alternative Considered**: Post-processing validation
**Decision**: Early validation prevents downstream issues

## Architecture Principles

1. **UDL-First**: All data through Unified Data Layer
2. **Type Safety**: Full TypeScript coverage
3. **Configuration Over Code**: Extensibility via config
4. **Security by Design**: Validation at every layer
5. **Observable by Default**: Comprehensive monitoring
6. **Performance Conscious**: Sub-250ms target
7. **Modular Design**: Clear separation of concerns
8. **Progressive Enhancement**: Graceful degradation