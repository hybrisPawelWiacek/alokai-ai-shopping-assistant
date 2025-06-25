# Error Handling Framework Integration TODOs

This document tracks the integration tasks needed to fully utilize the error handling framework across the AI Shopping Assistant.

## Overview

The error handling framework is complete and production-ready, but needs to be integrated into existing components. This document outlines specific integration tasks for future implementation.

## Integration Tasks

### 1. Graph Node Integration

**Current State**: Nodes use basic try-catch with generic Error objects
**Target State**: Use framework error types and boundaries

#### Tasks:
- [ ] Update all graph nodes to use `createSafeNode()` wrapper
- [ ] Replace generic Error with specific error types:
  - `detect-intent.ts`: Use `ModelError` for LLM failures
  - `enrich-context.ts`: Use `WorkflowError` for enrichment failures
  - `select-action.ts`: Use `ModelError` or `WorkflowError`
  - `format-response.ts`: Use `WorkflowError` for formatting issues
- [ ] Add error boundaries to `commerce-graph-v2.ts` using `executeSafeGraph()`
- [ ] Implement `errorRecoveryNode` in the graph for error handling

### 2. Action Implementation Integration

**Current State**: No error handling framework usage
**Target State**: Consistent error handling with recovery

#### Tasks:
- [ ] Wrap all action implementations with `withErrorHandling()`
- [ ] Replace Zod parse errors with `ValidationError`
- [ ] Use `UDLError` for SDK call failures:
  ```typescript
  try {
    const result = await sdk.unified.searchProducts(params);
  } catch (error) {
    throw new UDLError('Product search failed', 'searchProducts', error);
  }
  ```
- [ ] Add `@HandleErrors` decorator to action handler methods
- [ ] Implement recovery strategies for each action type

### 3. API Route Integration

**Current State**: Uses simple error handler in `/app/api/ai-assistant/chat/error-handler.ts`
**Target State**: Full framework integration

#### Tasks:
- [ ] Replace current error handler with `errorBoundaryMiddleware()`
- [ ] Update error responses to use `reportAndGenerateMessage()`
- [ ] Add recovery attempt logic for retryable errors
- [ ] Integrate circuit breaker for external service calls
- [ ] Add proper error categorization and severity

### 4. Recovery Strategy Implementation

**Current State**: Strategies defined but not applied
**Target State**: Active recovery for common failures

#### Tasks:
- [ ] Enable retry with backoff for:
  - UDL timeouts
  - Network errors
  - Rate limit errors
- [ ] Implement circuit breaker for:
  - Model API calls
  - UDL service calls
- [ ] Add fallback responses for:
  - Model failures (use cached or default responses)
  - Search failures (suggest alternatives)
- [ ] Enable state recovery for graph execution failures

### 5. B2B-Specific Error Handling

**Current State**: No B2B-specific error handling
**Target State**: Mode-aware error handling

#### Tasks:
- [ ] Add B2B-specific error types:
  - `BulkOperationError` for CSV processing
  - `QuoteGenerationError` for quote failures
  - `AccountLimitError` for credit limits
- [ ] Implement B2B recovery strategies:
  - Batch retry for bulk operations
  - Partial success handling
  - Alternative product suggestions
- [ ] Add B2B-specific error messages and actions

### 6. Monitoring and Alerting

**Current State**: Basic error logging
**Target State**: Comprehensive error tracking

#### Tasks:
- [ ] Configure external error reporting service
- [ ] Set up alerts for critical errors
- [ ] Create error dashboards in Grafana
- [ ] Implement error pattern detection
- [ ] Add error rate SLIs/SLOs

### 7. Testing

**Current State**: Framework has tests, implementations don't test errors
**Target State**: Comprehensive error scenario testing

#### Tasks:
- [ ] Add error scenario tests for each action
- [ ] Test recovery strategies in integration tests
- [ ] Add chaos engineering tests
- [ ] Test error boundaries in graph execution
- [ ] Verify user-friendly messages in E2E tests

## Implementation Priority

1. **High Priority** (Do First)
   - API route integration (user-facing impact)
   - Graph node error boundaries (stability)
   - UDL error handling (most common failures)

2. **Medium Priority** (Do Next)
   - Recovery strategies activation
   - Action implementation updates
   - B2B-specific handling

3. **Low Priority** (Do Later)
   - Advanced monitoring setup
   - Chaos engineering tests
   - Pattern detection

## Code Examples

### Example: Action with Error Handling
```typescript
import { withErrorHandling, UDLError, ValidationError } from '../errors';

export const searchImplementation = withErrorHandling(
  async (params: unknown, state: CommerceState) => {
    // Validate input
    const validated = validateInput(searchSchema, params);
    if (!validated.success) {
      throw new ValidationError(validated.error.message);
    }
    
    try {
      const sdk = getSdk();
      const results = await sdk.unified.searchProducts(validated.data);
      return createSearchResponse(results);
    } catch (error) {
      throw new UDLError(
        'Product search failed',
        'searchProducts',
        error,
        { query: validated.data.query }
      );
    }
  },
  { 
    action: 'search',
    recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF
  }
);
```

### Example: Graph with Error Boundaries
```typescript
import { executeSafeGraph, createSafeNode } from '../errors';

const safeGraph = new StateGraph(CommerceStateAnnotation)
  .addNode('detectIntent', createSafeNode(detectIntentNode, {
    critical: true,
    maxRetries: 1
  }))
  .addNode('enrichContext', createSafeNode(enrichContextNode, {
    critical: false,
    maxRetries: 3
  }))
  .addNode('errorRecovery', errorRecoveryNode);

// Execute with error boundaries
const result = await executeSafeGraph(safeGraph, initialState, {
  maxGraphFailures: 2,
  enableStateRecovery: true
});
```

## Notes

- The error handling framework is fully functional and can be adopted incrementally
- Start with high-impact, low-risk integrations (API routes)
- Ensure backward compatibility during migration
- Monitor error rates during rollout
- Update documentation as integration progresses

## Success Metrics

- [ ] 0% unhandled errors in production
- [ ] <5% error rate for user requests
- [ ] 90% of retryable errors successfully recovered
- [ ] 100% of errors have user-friendly messages
- [ ] All critical paths have error boundaries