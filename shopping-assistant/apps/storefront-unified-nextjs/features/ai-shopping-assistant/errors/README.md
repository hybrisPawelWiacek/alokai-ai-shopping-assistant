# Error Handling Framework

Comprehensive error management system for the AI Shopping Assistant, providing structured error types, recovery strategies, user-friendly messaging, and graph execution safety.

## Features

### 1. **Structured Error Hierarchy**
- Base `AIAssistantError` class with rich metadata
- Specific error types for different scenarios
- Categorization by severity and recovery strategy
- Type-safe error handling with Result types

### 2. **Automatic Recovery**
- Retry with exponential backoff
- Circuit breaker pattern
- State recovery and compensation
- Fallback strategies

### 3. **User-Friendly Messaging**
- Context-aware error messages
- Suggested actions for users
- Automatic message generation
- B2C/B2B mode awareness

### 4. **Graph Execution Safety**
- Error boundaries for LangGraph nodes
- Automatic node retry logic
- State snapshots and recovery
- Critical node protection

## Quick Start

```typescript
import { 
  initializeErrorHandling,
  withErrorHandling,
  createSafeNode,
  ValidationError,
  UDLError,
  reportAndGenerateMessage
} from '@/features/ai-shopping-assistant/errors';

// Initialize error handling
const { handler, reporter, boundary } = initializeErrorHandling({
  handler: {
    maxRetries: 3,
    enableMetrics: true
  },
  reporter: {
    enableUserMessages: true,
    enableSuggestedActions: true
  },
  boundary: {
    maxNodeFailures: 3,
    enableStateRecovery: true
  }
});

// Use in async operations
const result = await withErrorHandling(
  async () => {
    return sdk.unified.searchProducts({ query: 'shoes' });
  },
  { sessionId: 'session-123', action: 'search' }
);

if (!result.success) {
  const userMessage = await reportAndGenerateMessage(result.error);
  return userMessage;
}
```

## Error Types

### User Errors
```typescript
// Validation errors
throw new ValidationError('Invalid email format');

// Authentication/Authorization
throw new AuthenticationError('Please log in to continue');
throw new AuthorizationError('Insufficient permissions');
```

### System Errors
```typescript
// Network errors with retry
throw new NetworkError('Connection failed');

// Timeout errors
throw new TimeoutError('Request timed out');

// Rate limiting
throw new RateLimitError('Too many requests', 60); // retry after 60s
```

### Integration Errors
```typescript
// UDL errors
throw new UDLError('Search failed', 'searchProducts');

// Model errors
throw new ModelError('GPT-4 unavailable', 'gpt-4');
```

### Business Logic Errors
```typescript
// Business rule violations
throw new BusinessRuleError('Minimum order value not met', 'minimum_order_value');

// Workflow errors
throw new WorkflowError('Invalid state transition', 'checkout', 'payment');

// Not found errors
throw new NotFoundError('Product not found', 'product', 'prod-123');
```

## Recovery Strategies

### Retry Patterns
```typescript
// Simple retry
@WithRecovery({ 
  strategy: RecoveryStrategy.RETRY,
  maxAttempts: 3 
})
async searchProducts(query: string) {
  // Implementation
}

// Exponential backoff
@WithRecovery({ 
  strategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
  maxAttempts: 5,
  delayMs: 1000,
  backoffMultiplier: 2
})
async callExternalAPI() {
  // Implementation
}
```

### Circuit Breaker
```typescript
const handler = new ErrorHandler({
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 60000
});

// After 5 failures, circuit opens for 60 seconds
```

### Fallback Values
```typescript
const recoveryManager = new RecoveryManager();

const result = await recoveryManager.executeWithRecovery(
  () => llmCall(),
  new ModelError('Model unavailable'),
  {
    strategy: RecoveryStrategy.FALLBACK,
    fallbackValue: { 
      response: 'I apologize, but I need a moment. Please try again.' 
    }
  }
);
```

## Error Boundaries for LangGraph

### Safe Node Creation
```typescript
import { createSafeNode } from '@/features/ai-shopping-assistant/errors';

// Wrap node with error boundary
export const detectIntentNode = createSafeNode(
  'detectIntent',
  async (state: CommerceState) => {
    // Node implementation
    return { intent: detected };
  },
  {
    maxNodeFailures: 2,
    enableAutoRetry: true
  }
);
```

### Safe Graph Execution
```typescript
import { executeSafeGraph } from '@/features/ai-shopping-assistant/errors';

const result = await executeSafeGraph(
  'mainWorkflow',
  graph,
  initialState,
  {
    maxGraphFailures: 2,
    enableStateRecovery: true,
    criticalNodes: ['detectIntent', 'executeAction']
  }
);
```

### Error Recovery Node
```typescript
import { errorRecoveryNode, createErrorAwareEdge } from '@/features/ai-shopping-assistant/errors';

// Add error recovery to graph
graph.addNode('errorRecovery', errorRecoveryNode);

// Create error-aware edges
graph.addConditionalEdges(
  'executeAction',
  createErrorAwareEdge(
    (state) => state.nextNode || 'end',
    'errorRecovery'
  )
);
```

## User Message Generation

### Automatic Messages
```typescript
// Generate user-friendly error message
const userMessage = await reportAndGenerateMessage(error);

// Returns AIMessage with:
// - Context-appropriate message
// - Suggested actions
// - Retry information
```

### Custom Message Templates
```typescript
const reporter = new ErrorReporter({
  customTemplates: new Map([
    ['PRODUCT_UNAVAILABLE', {
      userMessage: 'This product is temporarily unavailable.',
      suggestedActions: [
        'Check back later',
        'Browse similar products',
        'Set up availability alert'
      ],
      retryable: false,
      showDetails: false
    }]
  ])
});
```

### Scenario-Specific Messages
```typescript
// Cart errors
const message = ErrorMessageBuilders.buildCartError(
  error, 
  'Nike Air Max'
);

// Search errors
const message = ErrorMessageBuilders.buildSearchError(
  error,
  'running shoes'
);

// Checkout errors
const message = ErrorMessageBuilders.buildCheckoutError(error);
```

## Error Reporting and Monitoring

### Error Reports
```typescript
// Report error with context
const reportId = await errorReporter.reportError(
  error,
  'User attempted to add out-of-stock item'
);

// Get session error reports
const reports = errorReporter.getErrorReports();

// Send to external service
const reporter = new ErrorReporter({
  reportingEndpoint: 'https://api.errortracking.com/report'
});
```

### Metrics Integration
All errors are automatically tracked with:
- Error count by category
- Error count by severity
- Recovery success rates
- Node/action failure rates

### Observability
Errors include:
- Distributed trace context
- Structured logging
- Performance impact metrics
- User session correlation

## Best Practices

### 1. Use Specific Error Types
```typescript
// ❌ Bad
throw new Error('Product not found');

// ✅ Good
throw new NotFoundError('Product not found', 'product', productId);
```

### 2. Provide Context
```typescript
// ❌ Bad
throw new UDLError('Failed');

// ✅ Good
throw new UDLError('Failed to search products', 'searchProducts', {
  context: {
    sessionId: state.context.sessionId,
    mode: state.mode,
    action: 'search'
  },
  technicalDetails: {
    query: searchQuery,
    filters: appliedFilters
  }
});
```

### 3. Set Appropriate Recovery
```typescript
// Network errors: retry with backoff
new NetworkError('Connection failed', {
  recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
  retryable: true
});

// Business errors: user intervention
new BusinessRuleError('Invalid coupon', 'invalid_coupon', {
  recoveryStrategy: RecoveryStrategy.USER_INTERVENTION,
  retryable: false
});
```

### 4. Handle Errors at Appropriate Level
```typescript
// Node level: return error message
const safeNode = createSafeNode('search', async (state) => {
  try {
    // Implementation
  } catch (error) {
    // Handled by boundary, returns error message
    throw error;
  }
});

// Action level: use withErrorHandling
const result = await withErrorHandling(
  () => performAction(),
  { action: 'addToCart' }
);

// Graph level: use executeSafeGraph
const finalState = await executeSafeGraph(
  'checkout',
  checkoutGraph,
  state
);
```

### 5. Test Error Scenarios
```typescript
describe('Error handling', () => {
  it('should retry on network error', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new NetworkError('Failed'))
      .mockResolvedValue('success');
    
    const result = await withErrorHandling(operation);
    
    expect(result.success).toBe(true);
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
```

## Configuration

### Global Configuration
```typescript
initializeErrorHandling({
  handler: {
    maxRetries: 3,
    retryDelayMs: 1000,
    backoffMultiplier: 2,
    circuitBreakerThreshold: 5
  },
  reporter: {
    enableUserMessages: true,
    enableTechnicalDetails: false,
    maxReportsPerSession: 100
  },
  boundary: {
    maxNodeFailures: 3,
    maxGraphFailures: 2,
    enableStateRecovery: true,
    criticalNodes: ['detectIntent', 'executeAction']
  }
});
```

### Per-Operation Configuration
```typescript
withErrorHandling(operation, context, {
  maxRetries: 5,
  retryDelayMs: 2000,
  enableLogging: true
});
```

## Integration with Observability

Errors are automatically integrated with:
- OpenTelemetry tracing
- Structured logging
- Prometheus metrics
- Performance profiling

```typescript
// Errors include trace context
error.context.traceId
error.context.spanId

// Automatic metric recording
metrics.recordRequestError({
  error_code: error.code,
  error_category: error.category
});

// Structured logging
Loggers.ai.error('Operation failed', error, {
  sessionId: error.context.sessionId
});
```