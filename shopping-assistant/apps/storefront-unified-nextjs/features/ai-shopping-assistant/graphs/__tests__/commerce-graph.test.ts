import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { CommerceAgentGraph } from '../commerce-graph';
import { CommerceToolRegistry } from '../../core/tool-registry';
import { LangGraphActionFactory } from '../../core/tool-factory';
import { CommerceStateAnnotation } from '../../state';
import type { ActionDefinition } from '../../types/action-definition';

// Mock the OpenAI model
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue(new AIMessage({
      content: '{"mode": "b2c", "intent": "search", "confidence": 0.9}',
      tool_calls: []
    })),
    bind: jest.fn().mockReturnThis()
  }))
}));

describe('CommerceAgentGraph', () => {
  let graph: CommerceAgentGraph;
  let registry: CommerceToolRegistry;
  let factory: LangGraphActionFactory;

  beforeEach(() => {
    // Create factory
    factory = new LangGraphActionFactory({
      enablePerformanceTracking: true,
      enableSecurityValidation: true
    });

    // Create registry
    registry = new CommerceToolRegistry(factory);

    // Create sample action
    const searchAction: ActionDefinition = {
      id: 'search',
      name: 'Search Products',
      description: 'Search for products',
      parameters: {} as any,
      supportedModes: ['b2c', 'b2b'],
      category: 'product',
      version: '1.0.0',
      isEnabled: true
    };

    // Register action
    const implementation = async (params: any, state: any) => [
      {
        type: 'ADD_MESSAGE' as const,
        payload: new AIMessage('Found 5 products')
      }
    ];

    registry.registerAction(searchAction, implementation);

    // Create graph
    graph = new CommerceAgentGraph(registry, {
      enableLogging: false
    });
  });

  describe('Graph Compilation', () => {
    it('should compile without errors', () => {
      const compiled = graph.compile();
      expect(compiled).toBeDefined();
      expect(compiled.nodes).toBeDefined();
    });

    it('should have all required nodes', () => {
      const compiled = graph.compile();
      const nodeNames = Object.keys(compiled.nodes);
      
      expect(nodeNames).toContain('detectIntent');
      expect(nodeNames).toContain('enrichContext');
      expect(nodeNames).toContain('selectAction');
      expect(nodeNames).toContain('toolNode');
      expect(nodeNames).toContain('formatResponse');
    });
  });

  describe('Graph Execution', () => {
    it('should process a simple query through all nodes', async () => {
      const compiled = graph.compile();
      const initialState = CommerceStateAnnotation.spec.default();
      
      // Add a user message
      const userMessage = new HumanMessage('Find me a laptop');
      const inputState = {
        ...initialState,
        messages: [userMessage]
      };

      // Execute the graph
      const result = await compiled.invoke(inputState, {
        configurable: {
          sessionId: 'test-session',
          getCurrentTaskInput: () => inputState
        }
      });

      // Verify results
      expect(result.messages.length).toBeGreaterThan(1);
      expect(result.mode).toBe('b2c');
      expect(result.context.detectedIntent).toBe('search');
      expect(result.context.intentConfidence).toBe(0.9);
    });

    it('should handle B2B mode detection', async () => {
      // Update mock to return B2B
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn().mockResolvedValue(new AIMessage({
          content: '{"mode": "b2b", "intent": "search", "confidence": 0.95}',
          tool_calls: []
        })),
        bind: jest.fn().mockReturnThis()
      }));

      const compiled = graph.compile();
      const initialState = CommerceStateAnnotation.spec.default();
      
      const userMessage = new HumanMessage('I need 100 laptops for my company');
      const inputState = {
        ...initialState,
        messages: [userMessage]
      };

      const result = await compiled.invoke(inputState, {
        configurable: {
          sessionId: 'test-session',
          getCurrentTaskInput: () => inputState
        }
      });

      expect(result.mode).toBe('b2b');
      expect(result.availableActions.suggested).toContain('search_bulk');
    });
  });

  describe('Conditional Routing', () => {
    it('should route to toolNode when tool calls are present', async () => {
      // Update mock to include tool calls
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn()
          .mockResolvedValueOnce(new AIMessage({
            content: '{"mode": "b2c", "intent": "search", "confidence": 0.9}',
            tool_calls: []
          }))
          .mockResolvedValueOnce(new AIMessage({
            content: 'Searching for products...',
            tool_calls: [{
              id: 'call_123',
              name: 'search',
              args: { query: 'laptop' }
            }]
          })),
        bind: jest.fn().mockReturnThis()
      }));

      const compiled = graph.compile();
      const initialState = CommerceStateAnnotation.spec.default();
      
      const userMessage = new HumanMessage('Find laptops');
      const inputState = {
        ...initialState,
        messages: [userMessage]
      };

      const result = await compiled.invoke(inputState, {
        configurable: {
          sessionId: 'test-session',
          getCurrentTaskInput: () => inputState
        }
      });

      // Should have tool call message
      const messages = result.messages;
      const hasToolCall = messages.some(msg => 
        msg._getType() === 'ai' && 
        'tool_calls' in msg && 
        msg.tool_calls?.length > 0
      );
      
      expect(hasToolCall).toBe(true);
    });

    it('should skip toolNode when no tool calls', async () => {
      // Mock to return no tool calls
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn().mockResolvedValue(new AIMessage({
          content: 'I can help you find laptops. What specific features are you looking for?',
          tool_calls: []
        })),
        bind: jest.fn().mockReturnThis()
      }));

      const compiled = graph.compile();
      const initialState = CommerceStateAnnotation.spec.default();
      
      const userMessage = new HumanMessage('Help me find a laptop');
      const inputState = {
        ...initialState,
        messages: [userMessage]
      };

      const result = await compiled.invoke(inputState, {
        configurable: {
          sessionId: 'test-session',
          getCurrentTaskInput: () => inputState
        }
      });

      // Should go directly to formatResponse
      expect(result.messages.length).toBeGreaterThanOrEqual(2);
      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage._getType()).toBe('ai');
    });
  });

  describe('Tool Updates', () => {
    it('should update tools dynamically', () => {
      // Add a new action
      const newAction: ActionDefinition = {
        id: 'compare',
        name: 'Compare Products',
        description: 'Compare multiple products',
        parameters: {} as any,
        supportedModes: ['b2c', 'b2b'],
        category: 'product',
        version: '1.0.0',
        isEnabled: true
      };

      const implementation = async () => [
        {
          type: 'ADD_MESSAGE' as const,
          payload: new AIMessage('Comparison complete')
        }
      ];

      registry.registerAction(newAction, implementation);
      
      // Update graph tools
      graph.updateTools(registry.getTools());
      
      // Recompile
      const compiled = graph.compile();
      expect(compiled).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle node errors gracefully', async () => {
      // Mock error in intent detection
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn().mockRejectedValue(new Error('API Error')),
        bind: jest.fn().mockReturnThis()
      }));

      const compiled = graph.compile();
      const initialState = CommerceStateAnnotation.spec.default();
      
      const userMessage = new HumanMessage('Find products');
      const inputState = {
        ...initialState,
        messages: [userMessage]
      };

      const result = await compiled.invoke(inputState, {
        configurable: {
          sessionId: 'test-session',
          getCurrentTaskInput: () => inputState
        }
      });

      // Should have error in state
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('API Error');
    });
  });
});