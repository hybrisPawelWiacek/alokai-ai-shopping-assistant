# Migration Guide: AI Assistant Legacy → AI Shopping Assistant

*Version: v1.0*  
*Last Updated: 25 June 2025*

This guide helps you migrate from the legacy AI Assistant to the new LangGraph-powered AI Shopping Assistant.

## Table of Contents
1. [Overview](#overview)
2. [Feature Comparison](#feature-comparison)
3. [Architecture Changes](#architecture-changes)
4. [Migration Strategy](#migration-strategy)
5. [Code Migration](#code-migration)
6. [Data Migration](#data-migration)
7. [Testing Migration](#testing-migration)
8. [Rollback Plan](#rollback-plan)

## Overview

### Why Migrate?

The new AI Shopping Assistant offers:
- **10x Performance**: <250ms vs 800-1200ms responses
- **Enhanced Security**: Built-in prompt injection protection
- **B2B Features**: Bulk operations, quotes, credit management
- **Better Architecture**: LangGraph orchestration, UDL-first
- **Production Ready**: Observability, monitoring, error handling

### Migration Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | 1 week | Development environment migration |
| Phase 2 | 2 weeks | Staging deployment and testing |
| Phase 3 | 1 week | Production rollout (gradual) |
| Phase 4 | 1 week | Legacy cleanup |

## Feature Comparison

### Core Features

| Feature | Legacy (`ai-assistant`) | New (`ai-shopping-assistant`) | Migration Impact |
|---------|------------------------|-------------------------------|------------------|
| **Chat Interface** | Basic chat UI | Rich UI with streaming | UI replacement |
| **Product Search** | Direct API calls | UDL-powered search | Backend change |
| **Cart Management** | Custom implementation | Unified SDK | API change |
| **Response Time** | 800-1200ms | <250ms | Performance gain |
| **State Management** | useState hooks | useReducer + context | Code refactor |
| **Error Handling** | Basic try-catch | Comprehensive framework | Enhanced UX |

### New Capabilities

| Feature | Description | Business Value |
|---------|-------------|----------------|
| **B2B Mode** | Dedicated business features | New revenue stream |
| **Bulk Orders** | CSV upload with validation | Efficiency for B2B |
| **Streaming** | Real-time responses | Better perceived performance |
| **Security** | Judge pattern validation | Reduced risk |
| **Observability** | Full tracing and metrics | Operational excellence |

### Deprecated Features

| Feature | Reason | Alternative |
|---------|--------|-------------|
| Client-side LLM calls | Security risk | Server-side API |
| Direct commerce API calls | Not UDL compliant | SDK methods |
| Simple chat history | Token inefficient | Sliding window |

## Architecture Changes

### Legacy Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React UI  │────▶│ useAssistant│────▶│  OpenAI API │
└─────────────┘     │    Hook     │     └─────────────┘
                    └─────────────┘              │
                           │                     ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Direct SDK  │────▶│  Commerce   │
                    │   Calls     │     │   Backend   │
                    └─────────────┘     └─────────────┘
```

### New Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React UI  │────▶│   API Route │────▶│  LangGraph  │
└─────────────┘     └─────────────┘     └─────────────┘
        │                   │                    │
        ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Streaming │     │ Middleware  │     │    Tools    │
│    Client   │     │   Security  │     │  Registry   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Migration Strategy

### Option 1: Big Bang (Not Recommended)
- Replace entire system at once
- High risk, difficult rollback
- Only for small deployments

### Option 2: Gradual Migration (Recommended)
1. **Coexistence Phase**: Both systems run in parallel
2. **Feature Flag Control**: Route users gradually
3. **A/B Testing**: Compare performance
4. **Full Migration**: Once validated

### Option 3: Hybrid Approach
- New features use new system
- Existing features migrate gradually
- Shared state management

## Code Migration

### 1. Update Dependencies

```json
// package.json
{
  "dependencies": {
    // Remove
    - "ai": "^2.x",
    - "openai": "^3.x",
    
    // Add
    + "@langchain/langgraph": "^0.x",
    + "@langchain/openai": "^0.x",
    + "zod": "^3.x"
  }
}
```

### 2. Replace Hook Usage

**Legacy Code:**
```typescript
// Using old AI assistant
import { useAssistant } from '@/features/ai-assistant';

function ChatComponent() {
  const { messages, isLoading, sendMessage } = useAssistant();
  
  return (
    <div>
      {messages.map(msg => <MessageBubble {...msg} />)}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
```

**New Code:**
```typescript
// Using new AI shopping assistant
import { useShoppingAssistant } from '@/features/ai-shopping-assistant';
import { ChatInterface } from '@/components/ai-shopping-assistant';

function ChatComponent() {
  // Option 1: Use the ready-made component
  return <ChatInterface />;
  
  // Option 2: Custom implementation
  const { state, sendMessage } = useShoppingAssistant();
  return (
    <div>
      {state.messages.map(msg => <MessageBubble {...msg} />)}
      <ChatInput 
        onSend={sendMessage} 
        disabled={state.status === 'streaming'} 
      />
    </div>
  );
}
```

### 3. Update API Calls

**Legacy Pattern:**
```typescript
// Direct OpenAI call (INSECURE!)
const response = await openai.createChatCompletion({
  model: "gpt-3.5-turbo",
  messages: [...],
});
```

**New Pattern:**
```typescript
// Server-side API route
const response = await fetch('/api/ai-shopping-assistant', {
  method: 'POST',
  body: JSON.stringify({
    message: userInput,
    sessionId: session.id,
    mode: 'b2c'
  })
});
```

### 4. State Management Migration

**Legacy State:**
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**New State (with useReducer):**
```typescript
const initialState: ChatState = {
  messages: [],
  status: 'idle',
  error: null,
  mode: 'b2c',
  sessionId: null
};

const [state, dispatch] = useReducer(chatReducer, initialState);
```

### 5. Environment Variables

**Legacy (.env):**
```bash
# Client-side exposed (SECURITY RISK!)
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxx
```

**New (.env.local):**
```bash
# Server-side only (SECURE)
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4-turbo-preview

# Feature flags
NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true
NEXT_PUBLIC_LEGACY_AI_ENABLED=false
```

## Data Migration

### Session Data
- Legacy sessions are not compatible
- No automatic migration needed
- Users start fresh conversations

### Configuration
```typescript
// Migrate action configurations
const migrationMap = {
  'search-products': 'search-products',
  'add-to-cart': 'add-item-to-cart',
  'get-recommendations': 'get-product-recommendations'
};
```

### Analytics Events
```typescript
// Update event names
trackEvent('ai_assistant_message') → trackEvent('ai_shopping_assistant_interaction')
trackEvent('ai_assistant_error') → trackEvent('ai_shopping_assistant_error')
```

## Testing Migration

### 1. Unit Tests

**Legacy Test Pattern:**
```typescript
describe('useAssistant', () => {
  it('sends message', async () => {
    const { result } = renderHook(() => useAssistant());
    await act(async () => {
      await result.current.sendMessage('test');
    });
    expect(result.current.messages).toHaveLength(2);
  });
});
```

**New Test Pattern:**
```typescript
describe('AI Shopping Assistant', () => {
  it('processes message through graph', async () => {
    const mockSDK = createMockSDK();
    const response = await processMessage({
      message: 'show me laptops',
      sdk: mockSDK
    });
    expect(response.actions).toContainEqual({
      type: 'search',
      data: expect.objectContaining({ query: 'laptops' })
    });
  });
});
```

### 2. Integration Tests

- Test both systems in parallel
- Compare responses for same queries
- Validate feature parity
- Check performance improvements

### 3. A/B Test Metrics

Track these metrics during migration:
- Response time (p50, p95, p99)
- Error rates
- User satisfaction (CSAT)
- Conversion rates
- Feature usage

## Rollback Plan

### Immediate Rollback (< 1 hour)
```typescript
// Feature flag in code
const AI_ASSISTANT_VERSION = process.env.NEXT_PUBLIC_AI_VERSION || 'legacy';

export function AIAssistant() {
  if (AI_ASSISTANT_VERSION === 'legacy') {
    return <LegacyAIAssistant />;
  }
  return <NewAIShoppingAssistant />;
}
```

### Gradual Rollback
1. Switch feature flag to route traffic back
2. Monitor error rates
3. Investigate issues
4. Fix and retry migration

### Data Preservation
- Session data is ephemeral (no preservation needed)
- Configuration can be reverted via Git
- No database changes required

## Coexistence Strategy

### Running Both Systems

```typescript
// app/[locale]/(default)/layout.tsx
export default function Layout({ children }) {
  const showNewAssistant = useFeatureFlag('new-ai-assistant');
  
  return (
    <>
      {children}
      {showNewAssistant ? (
        <ShoppingAssistantProvider>
          <ShoppingAssistantWidget />
        </ShoppingAssistantProvider>
      ) : (
        <LegacyAIAssistant />
      )}
    </>
  );
}
```

### Shared Resources
- Both use same OpenAI API key
- Both access same SDK instance
- Different API endpoints (`/api/ai-assistant` vs `/api/ai-shopping-assistant`)

### Performance Impact
- ~10KB additional bundle during coexistence
- Lazy load unused version
- Tree-shake in production build

## Post-Migration Cleanup

### 1. Remove Legacy Code
```bash
# After successful migration
rm -rf app/features/ai-assistant
rm -rf app/api/ai-assistant
```

### 2. Update Documentation
- Remove legacy API documentation
- Update README with new features
- Archive migration guide

### 3. Clean Dependencies
```bash
yarn remove ai openai@3
yarn autocheck # Check for unused deps
```

### 4. Update Monitoring
- Remove legacy dashboards
- Update alerts for new metrics
- Archive old logs

## Success Criteria

Migration is complete when:
- [ ] 100% traffic on new system
- [ ] Error rate < 0.1%
- [ ] Response time < 250ms (p95)
- [ ] All features working
- [ ] Legacy code removed
- [ ] Documentation updated
- [ ] Team trained

## Getting Help

- **Technical Issues**: See [TROUBLESHOOTING.md](./apps/storefront-unified-nextjs/features/ai-shopping-assistant/docs/TROUBLESHOOTING.md)
- **Architecture Questions**: See [ARCHITECTURE.md](./apps/storefront-unified-nextjs/features/ai-shopping-assistant/docs/ARCHITECTURE.md)
- **Feature Comparison**: See [FEATURE_SHOWCASE.md](./FEATURE_SHOWCASE.md)

---

💡 **Pro Tip**: Start with a small percentage of traffic (5-10%) and gradually increase as confidence grows. The new system is designed to handle 10x the load of the legacy system.