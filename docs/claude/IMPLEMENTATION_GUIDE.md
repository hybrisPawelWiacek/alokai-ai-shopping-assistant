# Alokai UDL-Powered AI Shopping Assistant Implementation Guide
*Comprehensive Implementation Reference - UDL-First Development Approach*

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Implementation Status](#implementation-status)
3. [Core Architecture Vision](#core-architecture-vision)
4. [UDL Integration Requirements](#udl-integration-requirements)
5. [Remediation Prompts](#remediation-prompts)
6. [Implementation Prompts](#implementation-prompts)
7. [Key Implementation Patterns](#key-implementation-patterns)
8. [Key Design Principles](#key-design-principles)
9. [Version History](#version-history)

## Executive Summary

This guide provides the complete implementation plan for the Alokai UDL-Powered AI Shopping Assistant. It supersedes the original implementation plan by incorporating key discoveries:

1. **Action Framework Pattern**: Configuration-driven tools as the core innovation
2. **Commerce Intelligence Layer**: The true competitive differentiator
3. **LangGraph as Infrastructure**: Orchestration is commodity, intelligence is the moat
4. **Tool Factory Pattern**: The optimal LangGraph pattern for the action framework

**Important**: This is a **greenfield implementation**. The existing `ai-assistant` feature is just a PoC, allowing us to build the ideal solution without legacy constraints. We start with production-quality patterns from day one.

**Critical Discovery (January 2025)**:
- **UDL Integration Missing**: PROMPTS 1-12 implemented without proper UDL integration
- **Root Cause**: Implementation focused on AI patterns over Alokai's core architecture
- **Impact**: Search, product details, B2B operations all non-functional
- **Resolution**: v3.0 adds UDL-First approach with remediation prompts

**Additional Discovery (January 2025)**:
- **Mock Replacement Needed**: After implementing frontend (PROMPT 19), discovered extensive use of UDL-compliant mocks
- **Impact**: System works but uses fake data instead of real commerce data
- **Resolution**: Added PROMPTS 20-22 to connect real UDL before production

**Verification Process Started (June 2025)**:
- **Goal**: Systematically verify and improve all prompt implementations
- **Method**: Two-phase approach - Planning then Implementation for each prompt
- **Focus**: Ensure UDL compliance, fix issues, enhance features
- **Version**: v4.0 - Comprehensive Verification Pass

## Implementation Status

| Prompt | Title | Status | Original Notes | Verification Date |
|--------|-------|--------|----------------|-------------------|
| 1 | PoC Learning Extraction | 📋 To Verify | LEARNINGS.md created (Original: Jan 2025) | - |
| 2 | UDL Integration Audit | 📋 To Verify | UDL_AUDIT_RESULTS.md created (Original: Jan 2025) | - |
| 3 | Foundation Setup | 📋 To Verify | LangGraph installed, architecture established (Original: Jan 2025) | - |
| 4 | Action Registry | 📋 To Verify | Tool factory pattern implemented (Original: Jan 2025) | - |
| 5 | Commerce State | 📋 To Verify | State definition with MessagesAnnotation (Original: Jan 2025) | - |
| 6 | Basic Graph | 📋 To Verify | Core workflow created (Original: Jan 2025) | - |
| 7 | Commerce Intelligence | 📋 To Verify | Mode detection, context enrichment (Original: Jan 2025) | - |
| 8 | Security Foundations | 📋 To Verify | Judge pattern implemented (Original: Jan 2025) | - |
| 9 | Core Commerce Actions | 📋 To Verify | All MVP actions created (Original: Jan 2025) | - |
| 10 | Performance Baseline | 📋 To Verify | Monitoring established (Original: Jan 2025) | - |
| 11 | Observability Foundation | 📋 To Verify | Logging, tracing, metrics (Original: Jan 2025) | - |
| 12 | B2B Bulk Operations | 📋 To Verify | CSV upload, bulk processing (Original: Jan 2025) | - |
| 13 | UDL Pattern Refactoring | 📋 To Verify | All code refactored for UDL (Original: Jan 2025) | - |
| 14 | Configuration System | 📋 To Verify | YAML/JSON config with hot-reload (Original: Jan 2025) | - |
| 15 | Observability Layer | 📋 To Verify | OpenTelemetry, metrics, profiling (Original: Jan 2025) | - |
| 16 | Error Handling Framework | 📋 To Verify | Comprehensive error management (Original: Jan 2025) | - |
| 17 | Testing Framework | 📋 To Verify | Unit, integration, security tests (Original: Jan 2025) | - |
| 18 | API Route Integration | 📋 To Verify | New API endpoint (Original: Jan 2025) | - |
| 19 | Frontend Integration | 📋 To Verify | New UI components (Original: Jan 2025) | - |
| 20 | Connect Core UDL Methods | 📋 To Verify | Replace mocks with real SDK | - |
| 21 | Implement Custom Extensions | 📋 To Verify | B2B middleware methods | - |
| 22 | Integration Testing | 📋 To Verify | Test with real backend | - |
| 23 | Production Readiness | 📋 To Verify | Deployment preparation | - |
| 24 | Documentation & Handoff | 📋 To Verify | Complete documentation (Original: Jan 2025) | - |
| 25 | Production Validation | 📋 To Verify | Final validation | - |

## Verification Process Guidelines (June 2025)

### Overview
Each prompt verification follows a two-phase approach to ensure quality while building on existing work:

### Phase 1: Planning Mode
1. **Review Original Requirements**: Read the prompt details from this guide
2. **Analyze Current Implementation**: 
   - Check actual code files for what was built
   - Compare against ARCHITECTURE_AND_PATTERNS.md patterns
   - Note any deviations from UDL-First principles
3. **Identify Gaps and Improvements**:
   - Missing features from original requirements
   - UDL integration issues (using mocks instead of real SDK)
   - Code quality improvements
   - Test coverage gaps
4. **Create Verification Plan**: Document what needs to be:
   - Kept as-is (working correctly)
   - Fixed (bugs or issues)
   - Enhanced (improvements)
   - Added (missing features)

### Phase 2: Implementation Mode
1. **Execute Verification Plan**: Make improvements while preserving working code
2. **Ensure UDL Compliance**: Replace any mocks with real SDK calls where possible
3. **Update Tests**: Add or fix tests to match implementation
4. **Update Documentation**: If implementation differs from docs in `features/ai-shopping-assistant/docs/`
5. **Mark as Verified**: Update status in this table with date

### Documentation Sources
- **Primary Guides** (use these for implementation):
  - This IMPLEMENTATION_GUIDE.md - The plan
  - ARCHITECTURE_AND_PATTERNS.md - Technical patterns
  - LEARNINGS_AND_ISSUES.md - Known issues
- **Ground Truth**: Actual code files
- **Outputs to Verify**: `features/ai-shopping-assistant/docs/` files

### Verification Checklist Template
For each prompt:
- [ ] Original requirements reviewed
- [ ] Current implementation analyzed
- [ ] UDL compliance verified
- [ ] Tests present and passing
- [ ] Documentation accurate
- [ ] Status updated to "✓ Verified"

## Core Architecture Vision

```typescript
// The conceptual breakthrough: Tools ARE the configuration
// Commerce operations become a configuration concern, not a code concern

interface AlokaiCommerceArchitecture {
  // Layer 0: Data Access - ALWAYS through UDL (The Foundation)
  dataAccess: {
    products: UDL.products;      // NOT direct API calls
    inventory: UDL.inventory;    // NOT mock services
    pricing: UDL.pricing;        // NOT hardcoded values
    cart: UDL.cart;             // NOT custom implementations
    customer: UDL.customer;      // NOT fake data
    // ALL commerce data flows through UDL
  };
  
  // Layer 1: Configuration-Driven Tools (The Innovation)
  actions: Map<string, ActionDefinition>;
  
  // Layer 2: Commerce Intelligence (The Moat - Powered by UDL's Speed)
  intelligence: {
    modeDetection: B2CB2BEngine;
    contextEnrichment: CommerceContext;
    intentPrediction: PatternEngine;
    securityLayer: SecurityJudge;  // Built-in from start
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

// Validated LangGraph Pattern
import { MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// State definition using MessagesAnnotation.spec
const CommerceStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  mode: Annotation<"b2c" | "b2b">()
    .reducer((_, next) => next ?? "b2c"),
  // Additional commerce-specific state...
});
```

## UDL Integration Requirements

**CRITICAL**: Every prompt must enforce UDL-First principles:

### UDL Integration Checklist (For Every Prompt)
□ Does this use UDL for ALL data access?
□ Are there any direct API calls? (RED FLAG)
□ Do the types extend from UDL types?
□ Is the mock aligned with UDL structure?
□ Are custom extensions properly defined in middleware?

### Why UDL Matters
1. **Consistency**: UDL provides consistent data structure regardless of backend
2. **Performance**: UDL's optimizations give us the <50ms advantage
3. **Flexibility**: Can switch backends without changing AI assistant code
4. **Intelligence**: Commerce Intelligence Layer depends on UDL's unified view
5. **Maintenance**: One place to update when backends change

### Correct vs Incorrect Patterns

```typescript
// CORRECT: All data through UDL
class SearchProductsAction {
  async execute(params: SearchParams, context: Context) {
    // Use UDL for unified access
    const products = await context.sdk.unified.searchProducts({
      search: params.query,
      filter: params.filters
    });
    
    // UDL handles backend differences
    const inventory = await context.sdk.unified.checkInventory(
      products.map(p => p.id)
    );
    
    return this.enrichWithInventory(products, inventory);
  }
}

// INCORRECT: Direct backend calls or mocks
class WrongSearchAction {
  async execute(params: SearchParams) {
    // DON'T DO THIS - bypasses UDL
    const products = await fetch('/api/sap/products');
    // This breaks Alokai's architecture!
    
    // ALSO WRONG - using non-existent methods
    const products = await sdk.commerce.getProducts();
  }
}
```

## Remediation Prompts

### PROMPT 2: UDL Integration Audit
**Goal**: Audit PROMPTS 1-12 implementations for UDL compliance

**Prompt to Claude**:
```
"Perform a comprehensive UDL integration audit of the implementations from PROMPTS 1-12:
1. Document all instances where UDL should be used but isn't
2. Identify all mock implementations that need UDL alignment
3. Find all incorrect SDK usage patterns (e.g., sdk.commerce.* instead of sdk.unified.*)
4. Create a remediation checklist for each prompt
5. Update UDL_INTEGRATION_ISSUES.md with detailed findings

Create UDL_AUDIT_RESULTS.md with specific code locations and required changes."
```

**Expected Deliverables**:
- UDL_AUDIT_RESULTS.md with comprehensive findings
- Line-by-line audit of incorrect patterns
- Remediation checklist per prompt
- Priority ranking of fixes needed

### PROMPT 13: UDL Pattern Refactoring
**Goal**: Refactor all existing implementations to use proper UDL patterns

**Prompt to Claude**:
```
"Based on the UDL audit results, refactor all existing implementations:
1. Replace all direct API calls with UDL methods
2. Update all mocks to match exact UDL response structures
3. Fix all action implementations to use sdk.unified.* methods
4. Implement proper custom extensions for B2B operations
5. Add TODO comments showing migration from mocks to real SDK
6. Update all type definitions to extend from UDL types

Ensure every data access goes through UDL, no exceptions."
```

**Expected Deliverables**:
- Refactored action implementations using UDL
- Updated mock implementations with UDL structure
- Custom extension definitions for B2B
- Type definitions extending UDL types
- Migration TODO comments throughout

## Implementation Prompts

### PROMPT 1: PoC Learning Extraction
**Goal**: Extract and document learnings from the existing PoC

**Prompt to Claude**:
```
"Review the existing PoC implementation in features/ai-assistant and document:
1. The action framework pattern that worked well
2. Performance bottlenecks discovered
3. Security concerns identified
4. Key architectural decisions to preserve
5. Patterns to avoid in production
Create a LEARNINGS.md file with these insights to guide our greenfield implementation."
```

**Expected Deliverables**:
- LEARNINGS.md with categorized insights
- Performance baseline measurements
- Security vulnerability list
- Architecture decision record
- Anti-pattern documentation

**Success Criteria**:
- Clear understanding of what to keep vs. discard
- Quantified performance data
- Actionable security improvements identified

---

### PROMPT 3: Foundation Setup with Architecture Principles
**Goal**: Set up LangGraph and create the action framework foundation with production principles

**Updated with Validation Findings**:
- Use MessagesAnnotation.spec for message handling instead of custom implementation
- Import ToolNode from "@langchain/langgraph/prebuilt" for tool execution
- Implement Command pattern for state updates from tools using getCurrentTaskInput()

**Prompt to Claude**:
```
"Set up LangGraph.js in the shopping-assistant project with EXPLICIT UDL integration patterns. Create a new features/ai-shopping-assistant directory for our greenfield implementation. 

Establish these architectural principles in code:
1. UDL-First: Every data access MUST go through the Unified Data Layer - no direct backend calls
2. Type safety everywhere (no 'any' types) - extend from Alokai's existing UDL types
3. Configuration-driven from day one
4. Security hooks in all data flows
5. Performance monitoring built into every component
6. Structured logging for observability

Create ARCHITECTURE.md documenting these principles, UDL integration patterns, and the foundational structure for a configuration-driven action framework. Include specific examples of correct UDL usage."
```

**Expected Deliverables**:
- Package.json updated with LangGraph dependencies
- Fresh directory structure created
- Type definitions for ActionDefinition interface
- Initial tool factory implementation
- Core configuration system setup
- ARCHITECTURE.md with principles and patterns

**Success Criteria**:
- Can import and use LangGraph
- Type-safe action definition structure
- Configuration-driven from the start
- Monitoring hooks in place

---

### PROMPT 4: Action Registry Implementation
**Goal**: Create the tool factory and registry system

**Prompt to Claude**:
```
"Implement the LangGraphActionFactory and CommerceToolRegistry classes based on the Tool Factory Pattern we identified. The factory should convert ActionDefinition format into LangGraph tools with proper Zod schemas. The registry should support runtime tool registration for configuration-driven extensibility. 

Key implementation details from validation:
1. Use the tool() function from @langchain/core/tools
2. Access state in tools using config.configurable.getCurrentTaskInput()
3. Return Command objects for state updates
4. Create example actions for search, cart, and comparison."
```

**Expected Deliverables**:
- `action-factory.ts` with tool creation logic
- `tool-registry.ts` with dynamic registration
- Schema generation from parameter descriptions
- Example actions demonstrating the pattern

**Success Criteria**:
- Can dynamically create LangGraph tools from action definitions
- Zod schemas properly validate inputs
- Tools execute with proper context
- Configuration-driven extensibility proven

---

### PROMPT 5: Commerce State Definition
**Goal**: Define the LangGraph state for commerce operations

**Prompt to Claude**:
```
"Create the CommerceState using LangGraph's Annotation pattern. Use MessagesAnnotation.spec as the base for message handling. Include cart state, search results, user context, mode (B2C/B2B), and security context. Also add tracking for available actions, performance metrics, and commerce-specific context.

Implement using:
- Annotation.Root() for the main state
- MessagesAnnotation.spec for messages
- Custom annotations for commerce fields
- Proper reducers that handle Command objects from tools"
```

**Expected Deliverables**:
- `state/commerce-state.ts` with full state definition
- Proper reducers for each state field
- Type exports for use in tools
- Integration with existing types from features/ai-assistant/types.ts
- Security context included

**Success Criteria**:
- State properly typed with TypeScript
- Reducers handle updates correctly
- Compatible with existing data structures
- Security tracking built in

---

### PROMPT 6: Basic Graph Construction
**Goal**: Build the core LangGraph workflow

**Prompt to Claude**:
```
"Create the main CommerceAgentGraph class that uses our tool registry and state. Implement basic nodes: detectIntent, enrichContext, selectAction, formatResponse. Use the prebuilt ToolNode for tool execution. 

Key patterns from validation:
1. Use StateGraph with proper type parameters
2. Conditional edges using object mapping: {continue: "toolNode", end: END}
3. ToolNode handles tool execution automatically
4. Model invocation returns tool_calls array
5. Support nested subgraphs for complex flows"
```

**Expected Deliverables**:
- `graphs/commerce-graph.ts` with main workflow
- Node implementations for each step
- Conditional routing logic
- Graph compilation method

**Success Criteria**:
- Graph compiles without errors
- Can process a simple query through all nodes
- Tools execute within the graph context

---

### PROMPT 7: Commerce Intelligence Layer
**Goal**: Add the intelligence that makes this valuable

**Prompt to Claude**:
```
"Implement the Commerce Intelligence layer with B2C/B2B mode detection, context enrichment, and intent prediction. This should analyze queries to determine shopping mode, enrich them with commerce context, and predict likely next actions. Integration points with the graph nodes created in Prompt 6."
```

**Expected Deliverables**:
- `intelligence/mode-detector.ts` for B2C/B2B detection
- `intelligence/context-enricher.ts` for query enhancement  
- `intelligence/intent-predictor.ts` for action prediction
- Integration with graph nodes

**Success Criteria**:
- Accurately detects B2C vs B2B intent
- Enriches queries with relevant context
- Suggests appropriate next actions

---

### PROMPT 8: Security Foundations
**Goal**: Implement security from the ground up

**Prompt to Claude**:
```
"Implement the security layer with the Judge pattern for input/output validation. Create validators for prompt injection, price manipulation, and business rule enforcement. This should be integrated into the graph from the start, not added later. Include security context in CommerceState and add security checks to all node transitions."
```

**Expected Deliverables**:
- `security/judge.ts` with validation patterns
- `security/validators.ts` for specific threats
- Input sanitization implementation
- Output filtering logic
- Security integration in graph nodes

**Success Criteria**:
- All inputs validated before processing
- Outputs checked for safety
- Prompt injection tests pass
- Business rules enforced

---

### PROMPT 9: Core Commerce Actions
**Goal**: Implement all core commerce actions with intelligence

**🚨 CRITICAL UDL REQUIREMENT**: ALL actions MUST use Alokai's Unified Data Layer:
- Search: `sdk.unified.searchProducts()` - NO direct API calls
- Products: `sdk.unified.getProductDetails()` - NO mock data
- Cart: `sdk.unified.addCartLineItem()`, etc. - NO custom implementations
- Inventory: `sdk.unified.checkInventory()` - NO hardcoded availability
- B2B: `sdk.customExtension.*` methods - NO fake B2B logic

**Prompt to Claude**:
```
"Implement the complete set of commerce actions using ONLY UDL for data access. Each action must:
1. Use UDL.products for product data - NO direct backend calls
2. Use UDL.inventory for stock checks - NO mock availability
3. Use UDL.pricing for price calculations - NO hardcoded prices
4. Use UDL.cart for cart operations - NO custom cart logic
5. Use sdk.customExtension for B2B operations - properly defined in middleware

No direct API calls - everything through UDL's unified interface. Each action should include B2C/B2B mode awareness, security validation, and proper intelligence hooks. If an SDK method doesn't exist, document what custom extension is needed."
```

**Expected Deliverables**:
- Full set of commerce actions
- B2C/B2B differentiation in each action
- Review-based search capability
- Product comparison implementation
- Security checks in each action

**Success Criteria**:
- All MVP use cases supported
- Actions adapt based on mode
- Superior to basic implementations
- Secure by design

---

### PROMPT 10: Performance Baseline
**Goal**: Establish performance monitoring and baseline

**Prompt to Claude**:
```
"Implement performance monitoring and run baseline tests. Add timing to each graph node, implement basic caching for the tool registry, and create a performance dashboard. Verify we can achieve <250ms responses for basic queries before proceeding. Include performance budgets for each component."
```

**Expected Deliverables**:
- Performance monitoring implementation
- Node-level timing
- Basic caching layer
- Performance dashboard mockup
- Baseline test results

**Success Criteria**:
- Can measure latency at each step
- Basic queries under 250ms
- Caching improves performance
- Clear performance visibility

---

### PROMPT 11: Observability Foundation
**Goal**: Build comprehensive observability

**Prompt to Claude**:
```
"Implement comprehensive observability:
1. Structured logging for every action with correlation IDs
2. Distributed tracing for graph execution
3. Metrics collection (latency, success rate, mode detection accuracy)
4. Real-time dashboard mockup
5. Alert thresholds for performance degradation
This is not just for production - we need this during development."
```

**Expected Deliverables**:
- Structured logging implementation
- Tracing integration
- Metrics collection system
- Dashboard design
- Alert configuration

**Success Criteria**:
- Every action traceable
- Performance visible in real-time
- Alerts trigger on degradation
- Development debugging improved

---

### PROMPT 12: B2B Bulk Operations
**Goal**: Implement CSV and bulk handling as core feature

**Prompt to Claude**:
```
"Implement CSV upload and bulk operation handling for B2B use cases. Create a bulk operation action that can process 100+ items efficiently. Include progress streaming for long operations, intelligent batching, and smart alternative suggestions for out-of-stock items. This is a core feature, not a nice-to-have."
```

**Expected Deliverables**:
- CSV parsing implementation
- Bulk operation action
- Progress streaming
- Intelligent batching logic
- Alternative suggestion algorithm

**Success Criteria**:
- Can process 100 items in <30 seconds
- Progress updates stream smoothly
- Out-of-stock handled gracefully
- B2B users satisfied with experience

---

### PROMPT 14: Configuration System Enhanced
**Goal**: Enable runtime configuration of actions with governance

**Prompt to Claude**:
```
"Create a configuration system with:
1. YAML/JSON loading for action definitions
2. Hot-reload in development
3. Configuration validation with clear error messages
4. Version control for configurations
5. A/B testing support for trying new actions
6. Business user-friendly configuration UI mockup
Include at least 10 example configurations covering all use cases."
```

**Expected Deliverables**:
- Configuration loader implementation
- YAML/JSON schema for actions
- Runtime validation
- Hot-reload mechanism
- Version control system
- UI mockup for business users
- 10+ example configurations

**Success Criteria**:
- Can define new actions in config files
- Actions immediately available after config change
- Validation prevents invalid configurations
- Business users can understand the system

---

### PROMPT 15: Observability Layer Complete
**Goal**: Complete observability implementation

**Prompt to Claude**:
```
"Complete the observability layer implementation:
1. OpenTelemetry integration for distributed tracing
2. Structured logging with context propagation
3. Metrics collection (Prometheus format)
4. Custom LangGraph instrumentation
5. Trace context propagation across async boundaries
6. Dashboard configuration for Grafana
7. Performance profiling utilities"
```

**Expected Deliverables**:
- OpenTelemetry setup
- Logger implementation
- Metrics collectors
- LangGraph instrumentation
- Context propagation
- Dashboard configs
- Profiling tools

**Success Criteria**:
- Full trace visibility
- Metrics exported properly
- Context preserved across calls
- Performance bottlenecks identifiable

---

### PROMPT 16: Error Handling Framework
**Goal**: Comprehensive error management

**Prompt to Claude**:
```
"Implement a comprehensive error handling framework:
1. Structured error types hierarchy
2. Recovery strategies (retry, circuit breaker, fallback)
3. User-friendly error messages
4. Error reporting and monitoring
5. Graph error boundaries
6. State recovery mechanisms"
```

**Expected Deliverables**:
- Error type definitions
- Recovery strategy implementations
- Error message templates
- Reporting system
- Error boundaries for graph
- Recovery mechanisms

**Success Criteria**:
- All errors properly categorized
- Recovery strategies work
- Users see helpful messages
- Errors tracked and reported

---

### PROMPT 17: Testing Framework Enhanced
**Goal**: Comprehensive testing including security and performance

**Prompt to Claude**:
```
"Set up comprehensive testing including:
1. Unit tests for all components
2. Integration tests for graph flows
3. Security test suite (prompt injection, price manipulation)
4. Performance benchmarks (<250ms verification)
5. B2B bulk operation tests
Use the existing test setup as a reference but include security and performance from the start."
```

**Expected Deliverables**:
- Unit tests for all components
- Integration tests for graph flows
- Security test suite
- Performance test suite
- B2B operation tests
- Test utilities and helpers
- CI/CD integration

**Success Criteria**:
- >80% code coverage
- All critical paths tested
- Security vulnerabilities caught
- Performance regressions detected
- Tests run in CI pipeline

---

### PROMPT 18: API Route Integration
**Goal**: Create the API endpoint for our new system

**Prompt to Claude**:
```
"Create a new API route for our LangGraph commerce agent at /api/ai-shopping-assistant. Include proper error handling, request validation, streaming support, and response formatting. Follow the patterns from the external docs for response structure including UI components."
```

**Expected Deliverables**:
- New API route implementation
- Request/response validation
- Error handling
- Streaming endpoint support
- OpenAPI documentation

**Success Criteria**:
- Clean API design
- Supports all features
- Proper error messages
- Well documented

---

### PROMPT 19: Frontend Integration
**Goal**: Create new frontend components for the enhanced assistant

**Prompt to Claude**:
```
"Create new frontend components and hooks for our AI shopping assistant. Build a new chat interface that supports streaming, displays rich UI components (product cards, comparisons, cart preview), and handles both B2C and B2B modes. Create this in a new directory to avoid conflicts."
```

**Expected Deliverables**:
- New `use-shopping-assistant.ts` hook
- Enhanced chat interface component
- Rich UI component integration
- Mode-aware UI adjustments
- B2B bulk upload interface
- Integration with LangGraph streaming modes ("updates" | "messages")

**Success Criteria**:
- Streaming works smoothly
- Rich components display properly
- B2C/B2B modes reflected in UI
- Bulk operations intuitive

---

### PROMPT 20: Connect Core UDL Methods
**Goal**: Replace mock implementations with real SDK calls for core commerce operations

**Prompt to Claude**:
```
"Replace all mock UDL implementations with real SDK calls:
1. Update all action implementations in features/ai-shopping-assistant/actions/implementations/
2. Replace mock calls in search-implementation.ts to use real sdk.unified.searchProducts()
3. Replace mock calls in cart-implementation.ts to use real sdk.unified cart methods
4. Replace mock calls in checkout-implementation.ts to use real sdk.unified checkout methods
5. Update context to pass real SDK instance instead of mock
6. Add proper error handling for SDK failures
7. Remove all imports from mocks/ directory
8. Test each action with real middleware connection"
```

**Expected Deliverables**:
- Updated action implementations using real SDK
- Proper error handling for API failures
- Context updates to inject real SDK
- Removal of mock dependencies
- Integration test updates

**Success Criteria**:
- All actions work with real UDL
- No mock imports remain
- Error handling works properly
- Performance acceptable with real APIs

---

### PROMPT 21: Implement Custom Extensions in Middleware
**Goal**: Create real custom extension methods in middleware to replace B2B mocks

**Prompt to Claude**:
```
"Implement custom extension methods in middleware to replace B2B mocks:
1. Create getBulkPricing method in apps/storefront-middleware/api/custom-methods/
2. Create checkBulkAvailability method with real inventory checks
3. Create requestProductSamples method integrated with order system
4. Create getAccountCredit method connected to ERP/accounting
5. Create scheduleProductDemo method with calendar integration
6. Create applyTaxExemption method with tax service integration
7. Update findSimilarProducts to use real product data
8. Register all methods in middleware configuration
9. Update frontend to use sdk.customExtension.* instead of mocks"
```

**Expected Deliverables**:
- Custom methods implementation in middleware
- Integration with backend systems
- Method registration in config
- Frontend updates to use real methods
- API documentation

**Success Criteria**:
- All B2B features work with real data
- Custom methods properly registered
- Frontend successfully calls real methods
- Performance meets B2B requirements

---

### PROMPT 22: Integration Testing with Real Data
**Goal**: Verify all functionality works with real UDL instead of mocks

**Prompt to Claude**:
```
"Create comprehensive integration tests with real UDL:
1. Update test utilities to support real SDK configuration
2. Create test data setup/teardown procedures
3. Test all commerce actions with real backend
4. Test B2B scenarios with real custom extensions
5. Performance benchmarks with actual API calls
6. Test error scenarios and edge cases
7. Update mock factory to be used only in unit tests
8. Document how to run tests with real backend"
```

**Expected Deliverables**:
- Integration test suite updates
- Test data management utilities
- Performance benchmarks with real APIs
- Test configuration for real backend
- Updated test documentation

**Success Criteria**:
- All integration tests pass with real backend
- Performance meets targets (<250ms)
- Test data properly managed
- Clear documentation for test setup

---

### PROMPT 23: Production Readiness
**Goal**: Prepare for production deployment

**Prompt to Claude**:
```
"Prepare the LangGraph implementation for production deployment. Add proper logging, monitoring, error tracking, and observability. Create deployment configuration for GCP, implement health checks, and document operational procedures."
```

**Expected Deliverables**:
- Enhanced logging implementation
- Production monitoring setup
- Deployment configuration
- Health check endpoints
- Operational documentation

**Success Criteria**:
- Production-ready code
- Observable system behavior
- Clear deployment process
- Operational runbooks

---

### PROMPT 24: Documentation & Handoff Enhanced
**Goal**: Complete documentation for all stakeholders

**Prompt to Claude**:
```
"Create comprehensive documentation including:
1. Architecture overview with diagrams
2. Configuration cookbook with 20+ examples
3. Performance tuning guide
4. Security best practices
5. Troubleshooting runbook
6. AI agent integration guide (how AI agents can extend this)
7. Business user guide for configuration
Update CLAUDE.md with the new patterns learned."
```

**Expected Deliverables**:
- Architecture documentation with diagrams
- Configuration cookbook (20+ examples)
- Performance tuning guide
- Security best practices
- Troubleshooting runbook
- AI integration guide
- Business user guide
- Updated CLAUDE.md

**Success Criteria**:
- Team can understand and extend the system
- Business users can configure actions
- Clear examples for common tasks
- Troubleshooting covers known issues

---

### PROMPT 25: Production Validation
**Goal**: Final validation before launch

**Prompt to Claude**:
```
"Run a comprehensive validation:
1. All MVP use cases work correctly
2. Performance meets 200-250ms target consistently
3. Security tests pass (prompt injection, price manipulation)
4. Configuration system allows non-code extensions
5. B2C/B2B mode switching works accurately
6. B2B bulk operations complete in <30s for 100 items
Create a LAUNCH_CHECKLIST.md with go/no-go criteria and results."
```

**Expected Deliverables**:
- Complete test execution results
- Performance benchmark report
- Security audit results
- Configuration validation
- Mode switching accuracy report
- LAUNCH_CHECKLIST.md

**Success Criteria**:
- All tests pass
- Performance targets met
- No security vulnerabilities
- Ready for production

## Key Implementation Patterns

### Tool Factory Pattern (Validated ✅)
```typescript
class LangGraphActionFactory {
  createTool(action: ActionDefinition) {
    return tool(
      async (params, config) => {
        // Access current state
        const state = config.configurable?.getCurrentTaskInput?.();
        const context = state?.context;
        const mode = context?.mode || 'b2c';
        
        // Process with commerce intelligence
        const enrichedParams = action.preProcess?.(params, mode) ?? params;
        const result = await action.execute(enrichedParams, context);
        const enhanced = action.postProcess?.(result, mode) ?? result;
        
        // Return Command for state update
        return new Command({
          update: {
            lastAction: action.name,
            actionResults: enhanced
          }
        });
      },
      {
        name: action.name.toLowerCase(),
        description: action.description,
        schema: this.generateZodSchema(action.parameters)
      }
    );
  }
}
```

### State Definition Pattern (Validated ✅)
```typescript
import { Annotation, MessagesAnnotation, Command } from "@langchain/langgraph";

const CommerceStateAnnotation = Annotation.Root({
  // Use prebuilt message handling
  ...MessagesAnnotation.spec,
  
  // Commerce-specific state
  mode: Annotation<"b2c" | "b2b">()
    .reducer((current, update) => update ?? current ?? "b2c"),
  
  cartState: Annotation<CartState>()
    .reducer((current, update) => {
      if (update instanceof Command) {
        return { ...current, ...update.update.cartState };
      }
      return update ?? current;
    }),
    
  // Performance tracking
  metrics: Annotation<PerformanceMetrics>()
});
```

### Graph Construction Pattern (Validated ✅)
```typescript
import { StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const workflow = new StateGraph(CommerceStateAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldUseTool, {
    continue: "tools",
    end: END
  })
  .addEdge("tools", "agent");
  
const graph = workflow.compile();
```

## Key Design Principles

### 0. UDL-First Architecture (HIGHEST PRIORITY)
- ALL data access through Unified Data Layer
- No direct backend API calls ever
- Leverage UDL's <50ms performance advantage
- Consistent data structure across all backends
- Custom extensions properly defined in middleware

### 1. Configuration-Driven Tools
- Actions are configuration, not code
- Business users can extend capabilities
- Runtime flexibility without deployment

### 2. Commerce Intelligence First (Powered by UDL)
- Every decision enhanced by commerce context from UDL
- B2C/B2B awareness throughout
- Pattern-based predictions using unified data
- State enrichment via Command pattern

### 3. Greenfield Freedom
- Build the ideal solution without constraints
- Implement best practices from day one
- No technical debt from legacy code

### 4. Type Safety Throughout
- Full TypeScript coverage
- Runtime validation with Zod
- No any types
- Proper generic types for StateGraph<TState, TInput>

### 5. Performance Conscious
- 200-250ms target response time
- Streaming for perceived performance
- Intelligent caching

### 6. Security by Design
- Judge pattern from the start
- All inputs validated
- Business rules enforced

### 7. Observable by Default
- Every action logged
- Performance visible
- Debugging built in

## Version History

### v4.0 - Verification Pass (June 2025)

#### Executive Summary
Version 4.0 introduces a systematic verification process to ensure all implementations meet quality standards and properly integrate with UDL.

#### Key Changes
1. **Added Verification Process Guidelines**: Two-phase approach for each prompt
2. **Reset Implementation Status**: All prompts marked "To Verify" for systematic review
3. **Added Verification Date Column**: Track when each prompt is verified
4. **Clarified Documentation Sources**: Primary guides vs implementation results
5. **Added Verification Checklist**: Standardized approach for each prompt

#### Why These Changes
- Ensure all implementations properly use UDL
- Identify and fix any issues from original implementation
- Improve code quality and test coverage
- Validate documentation accuracy
- Provide clear audit trail of verification work

### v3.1 - Mock Replacement Prompts (January 2025)

#### Executive Summary
Version 3.1 adds three new prompts (20-22) to replace UDL-compliant mocks with real SDK integration before attempting production deployment.

#### Key Changes
1. **Added PROMPT 20**: Connect Core UDL Methods - Replace mock implementations with real SDK
2. **Added PROMPT 21**: Implement Custom Extensions - Create real B2B methods in middleware
3. **Added PROMPT 22**: Integration Testing - Verify everything works with real backend
4. **Deferred PROMPT 17**: Production Readiness moved after mock replacement

#### Why These Changes
- Frontend implementation revealed extensive use of mocks following UDL patterns
- System works but uses fake data instead of real commerce data
- Need to connect real backend before production deployment
- Ensures all features work with actual UDL before going live

### v3.0 - UDL-First Architecture (January 2025)

#### Executive Summary
Version 3.0 addresses the critical architectural oversight discovered in January 2025: **the AI Shopping Assistant was not properly integrated with Alokai's Unified Data Layer (UDL)**, which is Alokai's core competitive advantage.

#### Key Changes

1. **Title Change**
   - **From**: "AI Shopping Assistant LangGraph Implementation Plan"
   - **To**: "Alokai UDL-Powered AI Shopping Assistant Implementation Plan"
   - **Why**: Makes it crystal clear that UDL is not optional but foundational

2. **Architecture Reordering**
   Added **Layer 0: Data Access** as the foundation:
   ```typescript
   dataAccess: {
     products: UDL.products;      // NOT direct API calls
     inventory: UDL.inventory;    // NOT mock services
     pricing: UDL.pricing;        // NOT hardcoded values
     cart: UDL.cart;             // NOT custom implementations
     customer: UDL.customer;      // NOT fake data
   }
   ```

3. **New Remediation Prompts**
   - PROMPT 2: UDL Integration Audit
   - PROMPT 13: UDL Pattern Refactoring

4. **UDL Integration Checklist**
   Mandatory checklist for EVERY prompt

5. **Updated Key Design Principles**
   Added UDL-First as Principle 0 (highest priority)

6. **Prompt Updates**
   All prompts now explicitly require UDL integration

#### Why These Changes Matter
1. **UDL is Alokai's Moat**: Provides unified access to 20+ backends with <50ms performance
2. **Consistency**: Without UDL, we're just building another chatbot
3. **Flexibility**: Can switch backends without changing AI code
4. **Performance**: UDL's optimizations are crucial for meeting targets
5. **Maintenance**: One place to update when backends change

### v2.2 - Production-Ready Patterns
- Security and performance moved earlier in the process
- PoC learnings extraction added as first step
- B2B bulk operations elevated to core feature
- Observability built in from the start
- Total prompts increased to 19 for comprehensive coverage
- Validated patterns against official LangGraph.js documentation
- Updated to use MessagesAnnotation.spec for message handling
- Incorporated ToolNode prebuilt component
- Added Command pattern for state updates from tools

### v2.0 - LangGraph Patterns Validation
- Tool Factory Pattern validated
- State management patterns updated
- Graph construction patterns confirmed
- Command pattern for state updates

### v1.0 - Initial Implementation Plan
- Original 15 prompts
- Basic LangGraph integration
- Configuration-driven approach

## Benefits of Greenfield Approach

1. **Clean Architecture**: Start with the optimal LangGraph patterns identified
2. **No Compromises**: Implement the full vision from external docs
3. **Faster Development**: No time spent on compatibility layers
4. **Better Testing**: Clean test suite without legacy considerations
5. **Team Clarity**: One clear way to do things, not multiple patterns
6. **Production Quality**: Security and performance from day one

## Success Metrics

### Technical Metrics
- Response time P95 <250ms
- >80% test coverage
- Zero runtime type errors
- <1% error rate in production
- 0 successful security breaches

### Business Metrics
- Configuration-driven extensibility proven
- B2C/B2B mode detection accuracy >90%
- Improved conversion through intelligence
- Reduced development time for new features
- Business users creating actions

## Risk Mitigation

### Technical Risks
- **LangGraph complexity**: Mitigated by abstraction layers
- **Performance concerns**: Addressed through early monitoring
- **Security vulnerabilities**: Judge pattern from start

### Process Risks
- **Prompt clarity**: Each prompt is specific and measurable
- **Context loss**: Each prompt builds clearly on previous work
- **Scope creep**: Fixed deliverables per prompt

## Conclusion

This UDL-First approach ensures the AI Shopping Assistant is deeply integrated with Alokai's core architecture, not just an add-on. The Unified Data Layer is THE foundational pattern that enables:
- Consistent commerce data across 20+ backends
- <50ms data access performance
- Backend flexibility without code changes
- True commerce intelligence through unified view

The key insights:
1. **UDL is Alokai's moat** - The AI assistant is valuable because it leverages UDL's unified commerce data
2. **Tools as configuration** - Transforms how commerce AI can be extended
3. **Commerce patterns over AI patterns** - This is an Alokai solution that uses AI, not an AI solution that happens to work with Alokai
4. **Mock replacement is critical** - The system must connect to real UDL before production (PROMPTS 20-22)

With v3.0 updates, we ensure:
- UDL integration from day one
- Remediation path for already-implemented prompts
- Security and performance built on UDL's foundation
- Patterns validated against both LangGraph.js and Alokai best practices
- Full type safety extending from UDL types