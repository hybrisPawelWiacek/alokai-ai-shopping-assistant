# Commerce Agent Graph

This module implements the main LangGraph workflow for the AI Shopping Assistant.

## Overview

The `CommerceAgentGraph` orchestrates the conversation flow through multiple nodes:

1. **detectIntent** - Analyzes user input to determine shopping mode (B2C/B2B) and intent
2. **enrichContext** - Adds commerce-specific context and determines available actions  
3. **selectAction** - Uses LLM with bound tools to select appropriate actions
4. **toolNode** - Executes selected tools (using prebuilt ToolNode)
5. **formatResponse** - Formats the final response for the user

## Graph Flow

```
START → detectIntent → enrichContext → selectAction → [conditional]
                                                           ↓
                                                    toolNode (if tools called)
                                                           ↓
                                                    formatResponse → END
```

## Key Features

### Conditional Routing
The graph uses conditional edges to determine whether to execute tools:
```typescript
graph.addConditionalEdges(
  'selectAction',
  shouldCallTool,
  {
    continue: 'toolNode',
    end: 'formatResponse'
  }
);
```

### Mode Detection
Automatically detects B2C vs B2B mode based on:
- Order quantities
- Business language
- Account type indicators
- Bulk pricing requests

### Context Enrichment
Enriches conversations with:
- Available actions based on state
- Security validations
- Performance tracking
- User history and preferences

### Tool Integration
- Uses ToolNode from `@langchain/langgraph/prebuilt`
- Dynamically binds tools based on mode and context
- Supports runtime tool updates

## Usage

```typescript
import { CommerceAgentGraph } from './graphs';
import { CommerceToolRegistry } from './core/tool-registry';

// Create registry and register tools
const registry = new CommerceToolRegistry(factory);
registry.registerAction(searchAction, searchImplementation);

// Create and compile graph
const graph = new CommerceAgentGraph(registry, {
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  enableLogging: true
});

const compiled = graph.compile();

// Execute with state
const result = await compiled.invoke(state, {
  configurable: {
    sessionId: 'session-123',
    getCurrentTaskInput: () => state
  }
});
```

## Node Details

### detectIntent Node
- Uses GPT-4 with JSON response format
- Classifies intent: search, compare, add_to_cart, get_details, checkout, ask_question
- Detects shopping mode with confidence score
- Extracts entities (products, quantities, prices)

### enrichContext Node  
- Determines available actions based on cart, comparison, and user state
- Performs security checks for suspicious patterns
- Calculates contextual enrichments (session duration, cart value, etc.)
- Suggests next actions based on intent

### selectAction Node
- Binds appropriate tools to the model
- Builds rich system prompt with mode-specific instructions
- Handles tool selection based on user intent
- Returns AI message with potential tool calls

### formatResponse Node
- Formats tool results into user-friendly messages
- Applies mode-specific formatting (B2B vs B2C)
- Generates contextual suggestions
- Handles errors gracefully

## Testing

The graph includes comprehensive tests covering:
- Graph compilation
- Node execution flow
- Conditional routing logic
- Mode detection (B2C/B2B)
- Error handling
- Dynamic tool updates

Run tests:
```bash
npm test graphs/__tests__/commerce-graph.test.ts
```