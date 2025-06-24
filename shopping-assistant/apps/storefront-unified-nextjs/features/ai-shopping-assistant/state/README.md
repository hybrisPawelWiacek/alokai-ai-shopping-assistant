# Commerce State Management

This module implements the LangGraph state management for the AI Shopping Assistant using the Annotation pattern.

## Overview

The state is built using LangGraph's `Annotation.Root()` with `MessagesAnnotation.spec` for message handling. It includes all commerce-specific fields needed for B2C/B2B operations.

## State Structure

```typescript
CommerceState {
  messages: BaseMessage[]              // Chat history using MessagesAnnotation
  mode: 'b2c' | 'b2b' | 'unknown'     // Shopping mode detection
  context: CommerceContext             // Session and user context
  cart: CartState                      // Shopping cart state
  comparison: ComparisonState          // Product comparison
  security: SecurityContext            // Security tracking
  performance: PerformanceMetrics      // Performance monitoring
  availableActions: AvailableActions   // Dynamic action availability
  lastAction: string | null            // Last executed action
  error: Error | null                  // Error state
}
```

## Key Features

### 1. Message Handling
Uses LangGraph's `MessagesAnnotation.spec` for proper message history management:
```typescript
messages: MessagesAnnotation.spec
```

### 2. Command Pattern Integration
Tools return `StateUpdateCommand` objects that are applied via reducers:
```typescript
const commands: StateUpdateCommand[] = [
  { type: 'ADD_MESSAGE', payload: new AIMessage('...') },
  { type: 'UPDATE_CART', payload: { items: [...] } }
];

const updates = applyCommandsToState(state, commands);
```

### 3. Custom Reducers
Each field has its own reducer logic:
- **Context**: Merges updates (doesn't replace)
- **Cart**: Adds timestamps automatically
- **Performance**: Accumulates metrics
- **Security**: Tracks validation timestamps

### 4. Type Safety
Full TypeScript support with proper type exports:
```typescript
export type CommerceState = typeof CommerceStateAnnotation.State;
export type CommerceStateUpdate = typeof CommerceStateAnnotation.Update;
```

## Usage in Tools

Tools receive the current state and return commands:
```typescript
export async function myToolImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  // Access current state
  const { mode, context, cart } = state;
  
  // Return commands to update state
  return [
    {
      type: 'UPDATE_CART',
      payload: { /* cart updates */ }
    }
  ];
}
```

## Helper Functions

- `createMessageCommand()`: Create message commands easily
- `isActionAvailable()`: Check if an action can be executed
- `getNodeAverageTime()`: Get performance metrics for nodes

## Security Context

Built-in security tracking:
```typescript
security: {
  validationPassed: boolean
  lastValidation: string
  suspiciousPatterns: string[]
  rateLimitStatus: Record<string, RateLimitInfo>
  permissions: string[]
}
```

## Performance Tracking

Automatic performance monitoring:
```typescript
performance: {
  nodeExecutionTimes: Record<string, number[]>
  totalExecutionTime: number
  toolExecutionCount: number
  cacheHits: number
  cacheMisses: number
}
```