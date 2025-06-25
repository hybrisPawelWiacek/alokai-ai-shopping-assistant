# AI Shopping Assistant

An intelligent conversational commerce interface built on Alokai's Unified Data Layer (UDL), providing natural language shopping experiences with sub-250ms response times.

## Architecture Overview

The AI Shopping Assistant leverages a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 14)                  │
│                   - Streaming UI                         │
│                   - Rich Components                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                API Routes (SSE Streaming)                │
│                - Authentication & Rate Limiting          │
│                - OpenAI Integration                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              LangGraph State Machine                     │
│         - Tool Factory Pattern                           │
│         - Commerce Intelligence                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Unified Data Layer (UDL)                    │
│         - 20+ Backend Integrations                       │
│         - <50ms Data Access                              │
└─────────────────────────────────────────────────────────┘
```

## Key Technical Features

### UDL-First Data Access
- All commerce data flows through Alokai's Unified Data Layer
- Consistent data models across different e-commerce backends
- Real-time inventory, pricing, and product data
- Custom extensions for B2B operations

### Configuration-Driven Actions
- JSON-based action definitions
- Add new capabilities without code changes
- Runtime extensibility via action registry
- Type-safe action execution

### Intelligent Context Processing
- Automatic B2C/B2B mode detection
- Conversation state management with LangGraph
- Security validation at multiple layers
- Commerce-aware intent classification

### Production-Ready Infrastructure
- Server-side LLM calls (no API keys in frontend)
- Multi-layer security with Judge pattern
- OpenTelemetry instrumentation
- Comprehensive error handling framework

## Core Capabilities

### Natural Language Product Search
- Semantic search understanding ("waterproof jacket for Scotland hiking")
- Multi-faceted filtering from natural language
- Intelligent product recommendations
- Context-aware result ranking

### Smart Cart Management
- Natural language cart operations ("add two more blue ones")
- Bulk operations for B2B scenarios
- Real-time inventory validation
- Dynamic pricing calculations

### B2B-Specific Features
- CSV bulk order upload with progress tracking
- Volume-based pricing calculations
- Multi-location inventory checks
- Credit limit validation
- Tax exemption handling

### Conversational Checkout
- Step-by-step checkout guidance
- Address and payment method management
- Shipping option recommendations
- Order confirmation and tracking

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- Access to Alokai middleware (or use demo mode)
- OpenAI API key (optional for demo mode)

### Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/your-org/shopping-assistant.git
cd shopping-assistant
yarn install
```

2. **Configure Environment**
```bash
cp apps/storefront-unified-nextjs/.env.example apps/storefront-unified-nextjs/.env.local
```

Key environment variables:
```env
# Alokai Middleware
NEXT_PUBLIC_ALOKAI_MIDDLEWARE_URL=http://localhost:4000

# OpenAI (optional - demo mode works without)
OPENAI_API_KEY=your-key-here

# Feature Flags
NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true
NEXT_PUBLIC_AI_ASSISTANT_DEMO_MODE=true
```

3. **Start Development Servers**
```bash
# Start everything (frontend + middleware)
yarn dev

# Or start separately
yarn dev:next       # Frontend only (port 3000)
yarn dev:middleware # Middleware only (port 4000)
```

4. **Access the Application**
- Frontend: http://localhost:3000
- AI Assistant: Click the chat icon in the bottom right
- Demo queries to try:
  - "Show me gaming laptops under $1500"
  - "I need waterproof hiking boots"
  - "Compare iPhone 15 models"
  - "Add 3 blue shirts to cart"

### Demo Mode vs Production

The assistant runs in two modes:

**Demo Mode** (default)
- Uses mock SDK with realistic data
- No backend required
- Instant responses
- Perfect for development and testing

**Production Mode**
- Connects to real Alokai middleware
- Live inventory and pricing
- Actual cart operations
- Requires configured backends

Toggle via environment variable:
```env
NEXT_PUBLIC_AI_ASSISTANT_DEMO_MODE=false
```

## Development Guide

### Project Structure
```
apps/
├── storefront-unified-nextjs/       # Next.js frontend
│   ├── app/api/ai-shopping-assistant/  # API routes
│   ├── features/ai-shopping-assistant/ # Core implementation
│   │   ├── actions/                 # Action definitions
│   │   ├── graphs/                  # LangGraph workflows
│   │   ├── state/                   # State management
│   │   └── mocks/                   # Demo mode data
│   └── components/ai-shopping-assistant/ # UI components
└── storefront-middleware/           # Alokai middleware
    └── api/custom-methods/b2b/      # B2B extensions
```

### Adding New Actions

1. Define action configuration:
```typescript
// config/ai-assistant-actions.json
{
  "id": "check-order-status",
  "name": "Check Order Status",
  "description": "Check the status of an order",
  "category": "orders",
  "parameters": {
    "orderId": {
      "type": "string",
      "description": "Order ID to check"
    }
  }
}
```

2. Implement action handler:
```typescript
// actions/implementations/order-implementation.ts
export async function checkOrderStatus(
  params: { orderId: string },
  context: Context
): Promise<ActionResponse> {
  const order = await context.sdk.unified.getOrder({ id: params.orderId });
  return {
    type: 'order-status',
    data: order
  };
}
```

### Testing

```bash
# Unit tests
yarn test:unit

# Integration tests (requires middleware)
yarn test:integration

# E2E tests with Playwright
yarn test:e2e
```

### Performance Monitoring

Built-in performance tracking:
- Response time targets: <250ms
- LRU cache for common queries
- Streaming responses for perceived performance
- OpenTelemetry traces for debugging

Access metrics at: http://localhost:3000/api/ai-shopping-assistant/metrics

## Architecture Decisions

### Why LangGraph?
- Declarative state management for conversations
- Built-in streaming support
- Type-safe tool execution
- Easy to extend and test

### Why Configuration-Driven?
- Business users can modify behaviors
- No deployment for simple changes
- A/B testing different flows
- Clear separation of concerns

### Why Server-Side LLM?
- Security: No API keys in browser
- Performance: Avoid CORS overhead
- Control: Rate limiting and monitoring
- Cost: Track usage per user

## Documentation

- [Architecture Details](./docs/reference/ARCHITECTURE.md)
- [Development Workflow](./docs/reference/DEVELOPMENT_WORKFLOW.md)
- [API Integration Guide](./docs/reference/AI_INTEGRATION_GUIDE.md)
- [Configuration Cookbook](./docs/reference/CONFIGURATION_COOKBOOK.md)
- [Security Best Practices](./docs/reference/SECURITY_BEST_PRACTICES.md)

## Alokai Integration

This AI Shopping Assistant is built on top of Alokai's Unified Storefront. For general Alokai setup:

### Prerequisites
- Node.js (see `.nvmrc` for version)
- Yarn v1

### Full Stack Setup
```bash
# Install all dependencies
yarn init

# Run full stack (frontend + middleware)
yarn dev
```

Default ports:
- Frontend (Next.js): `:3000`
- Frontend (Nuxt): `:3333`
- Middleware: `:4000`

### Commerce Backend Configuration

To switch between different commerce backends, modify:

1. `apps/storefront-middleware/middleware.config.ts`
2. `apps/storefront-middleware/types.ts`
3. `.env` file for CMS mock environment

See [Alokai documentation](https://docs.alokai.com/storefront) for detailed integration guides.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the coding standards (TypeScript, no `any` types)
4. Write tests for new functionality
5. Submit a Pull Request

## License

This project is part of the Alokai ecosystem. See LICENSE for details.

## Addendum: Key Architectural Patterns

This section highlights the five most prominent architectural patterns that define the AI Shopping Assistant. These patterns ensure the system is secure, performant, flexible, and deeply integrated with the Alokai ecosystem.

### 1. UDL-First Data Access

All commerce data flows exclusively through Alokai's Unified Data Layer (UDL). This decouples the assistant from specific e-commerce backends, providing a consistent data model and leveraging Alokai's high-speed data access.

**Snippet:** All data operations use the `sdk.unified` interface, never direct API calls.
```typescript
// ✅ Correct: UDL-First data access
import { getSdk } from '@/sdk';
const sdk = getSdk();
const products = await sdk.unified.searchProducts({ search: "running shoes" });

// ❌ Incorrect: Bypassing the UDL
const response = await fetch('https://my-backend.com/api/products');
```

### 2. Configuration-Driven Actions (via Tool Factory)

AI capabilities (tools) are defined in external JSON configuration files, not hard-coded. A "Tool Factory" pattern dynamically creates these tools at runtime, allowing for rapid extension of the AI's abilities without code changes.

**Snippet:** An action is defined in JSON, then implemented separately.
```json
// config/ai-assistant-actions.json
{
  "id": "check-order-status",
  "name": "Check Order Status",
  "description": "Check the status of an order",
  "parameters": { "orderId": { "type": "string" } }
}
```
```typescript
// actions/implementations/order-implementation.ts
// The factory maps the JSON config to this handler.
export async function checkOrderStatus(params: { orderId: string }, context: Context) {
  return await context.sdk.unified.getOrder({ id: params.orderId });
}
```

### 3. Server-Side LLM Orchestration (with LangGraph)

All interactions with the Large Language Model (LLM) are securely managed on the server. A LangGraph state machine orchestrates the conversational flow, tool usage, and state management, preventing exposure of API keys and enabling centralized control.

**Snippet:** API routes handle the LLM interaction server-side.
```typescript
// app/api/ai-shopping-assistant/route.ts
import { graph } from '@/features/ai-shopping-assistant/graphs';

export async function POST(req: Request) {
  // ... authentication & rate limiting ...

  const { messages } = await req.json();

  // Stream back updates from the server-side graph
  const stream = await graph.stream({ messages });
  return new StreamingTextResponse(stream);
}
```

### 4. Multi-Layer Judge Pattern for Security

A defense-in-depth security model where user inputs and AI outputs are validated across multiple layers. The "Judge" checks the initial prompt, the AI's chosen action (intent), and the final response against a set of business and security rules.

**Snippet:** A conceptual representation of the security validation flow.
```typescript
// Pseudocode for the Judge Pattern
async function handleRequest(userInput) {
  // Layer 1: Validate user input
  if (isMalicious(userInput)) throw new Error("Invalid input");

  // Layer 2: Let the AI determine intent
  const intent = await llm.determineIntent(userInput);
  if (!isPermitted(intent, user.role)) throw new Error("Action not allowed");

  // Layer 3: Execute and validate the output
  const result = await executeAction(intent);
  const filteredResult = filterSensitiveData(result);

  return filteredResult;
}
```

### 5. Streaming-First Architecture (SSE)

The entire backend-to-frontend communication uses Server-Sent Events (SSE) to stream updates in real-time. This allows the UI to update progressively as the AI works, providing an immediate and dynamic user experience.

**Snippet:** The frontend uses a client to handle the stream of events.
```typescript
// features/ai-shopping-assistant/hooks/use-chat-stream.ts
useEffect(() => {
  const streamingClient = new StreamingClient({
    url: '/api/ai-shopping-assistant',
    onUpdate: (update) => {
      // Update UI state progressively as data arrives
      dispatch({ type: 'APPEND_MESSAGE_CHUNK', payload: update });
    },
    onError: (error) => { /* ... */ },
  });

  streamingClient.connect();
  return () => streamingClient.disconnect();
}, []);
```