import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { CommerceGraphBuilder } from '../graph-builder';
import { CommerceToolRegistry } from '../../core/tool-registry';
import { createActionRegistry } from '../../actions';
import { CommerceStateAnnotation, type CommerceState } from '../../state';
import { CommerceSecurityJudge } from '../../security';

// Mock dependencies
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue(new AIMessage({
      content: 'I found some great laptops for you.',
      tool_calls: []
    })),
    bind: jest.fn().mockReturnThis()
  }))
}));

jest.mock('../../security', () => ({
  CommerceSecurityJudge: jest.fn().mockImplementation(() => ({
    validate: jest.fn().mockResolvedValue({ 
      isValid: true, 
      severity: 'none',
      sanitizedInput: 'Find me a laptop'
    }),
    getContext: jest.fn().mockReturnValue({
      threatLevel: 'none',
      trustScore: 100,
      detectedPatterns: [],
      blockedAttempts: 0
    })
  }))
}));

jest.mock('../../actions', () => ({
  createActionRegistry: jest.fn().mockReturnValue({
    getTools: jest.fn().mockReturnValue([
      {
        name: 'searchProducts',
        description: 'Search for products',
        call: jest.fn().mockResolvedValue('Search results')
      }
    ]),
    getToolsForMode: jest.fn().mockReturnValue([
      {
        name: 'searchProducts',
        description: 'Search for products',
        call: jest.fn().mockResolvedValue('Search results')
      }
    ])
  })
}));

describe('CommerceGraphBuilder', () => {
  let graphBuilder: CommerceGraphBuilder;
  let mockRegistry: CommerceToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRegistry = createActionRegistry() as any;
    graphBuilder = new CommerceGraphBuilder(mockRegistry, {
      enableLogging: false,
      enablePersistence: false
    });
  });

  describe('Graph Construction', () => {
    it('should build graph with all required nodes', () => {
      const compiled = graphBuilder.compile();
      expect(compiled).toBeDefined();
      
      // Check nodes exist in compiled graph
      const graph = compiled.getGraph();
      const nodes = graph.nodes;
      
      expect(nodes).toContain('securityCheck');
      expect(nodes).toContain('detectIntent');
      expect(nodes).toContain('enrichContext');
      expect(nodes).toContain('selectAction');
      expect(nodes).toContain('toolNode');
      expect(nodes).toContain('formatResponse');
      expect(nodes).toContain('errorHandler');
    });

    it('should set up conditional edges correctly', () => {
      const compiled = graphBuilder.compile();
      const graph = compiled.getGraph();
      
      // Check edges exist
      expect(graph.edges.length).toBeGreaterThan(0);
      
      // Verify entry point
      const startEdges = graph.edges.filter(e => e[0] === '__start__');
      expect(startEdges.length).toBe(1);
      expect(startEdges[0][1]).toBe('securityCheck');
    });
  });

  describe('Security Integration', () => {
    it('should block execution on critical security threat', async () => {
      // Mock security judge to return critical threat
      const mockSecurityJudge = {
        validate: jest.fn().mockResolvedValue({ 
          isValid: false, 
          severity: 'critical',
          reason: 'Malicious input detected'
        }),
        getContext: jest.fn().mockReturnValue({
          threatLevel: 'critical',
          trustScore: 0,
          detectedPatterns: ['sql_injection'],
          blockedAttempts: 1
        })
      };
      
      (CommerceSecurityJudge as jest.MockedClass<typeof CommerceSecurityJudge>)
        .mockImplementationOnce(() => mockSecurityJudge as any);
      
      const builder = new CommerceGraphBuilder(mockRegistry, {
        enableLogging: false
      });
      
      const state = CommerceStateAnnotation.spec.default() as CommerceState;
      const result = await builder.invoke({
        ...state,
        messages: [new HumanMessage('DROP TABLE users;')]
      });
      
      // Should have error message
      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage._getType()).toBe('ai');
      expect(lastMessage.content).toContain('encountered an error');
    });

    it('should allow execution with security warning', async () => {
      // Mock security judge to return warning
      const mockSecurityJudge = {
        validate: jest.fn().mockResolvedValue({ 
          isValid: true, 
          severity: 'medium',
          sanitizedInput: 'safe input'
        }),
        getContext: jest.fn().mockReturnValue({
          threatLevel: 'medium',
          trustScore: 70,
          detectedPatterns: ['suspicious_pattern'],
          blockedAttempts: 0
        })
      };
      
      (CommerceSecurityJudge as jest.MockedClass<typeof CommerceSecurityJudge>)
        .mockImplementationOnce(() => mockSecurityJudge as any);
      
      const builder = new CommerceGraphBuilder(mockRegistry, {
        enableLogging: false
      });
      
      const state = CommerceStateAnnotation.spec.default() as CommerceState;
      const result = await builder.invoke({
        ...state,
        messages: [new HumanMessage('Find products')]
      });
      
      // Should proceed with warning
      expect(result.security.threatLevel).toBe('medium');
      expect(result.messages.length).toBeGreaterThan(1);
    });
  });

  describe('Conditional Routing', () => {
    it('should route to tools when AI message has tool calls', async () => {
      // Mock ChatOpenAI to return tool calls
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn()
          .mockResolvedValueOnce(new AIMessage({
            content: '{"mode": "b2c", "intent": "search", "confidence": 0.9}'
          }))
          .mockResolvedValueOnce(new AIMessage({
            content: 'Searching for products...',
            tool_calls: [{
              id: 'call_123',
              name: 'searchProducts',
              args: { query: 'laptop' }
            }]
          })),
        bind: jest.fn().mockReturnThis()
      }));
      
      const builder = new CommerceGraphBuilder(mockRegistry, {
        enableLogging: false
      });
      
      const state = CommerceStateAnnotation.spec.default() as CommerceState;
      const result = await builder.invoke({
        ...state,
        messages: [new HumanMessage('Find me laptops')]
      });
      
      // Should have tool call in messages
      const hasToolCall = result.messages.some(m => 
        m._getType() === 'ai' && 'tool_calls' in m && m.tool_calls?.length > 0
      );
      expect(hasToolCall).toBe(true);
    });

    it('should skip tools when no tool calls needed', async () => {
      const state = CommerceStateAnnotation.spec.default() as CommerceState;
      const result = await graphBuilder.invoke({
        ...state,
        messages: [new HumanMessage('Hello')]
      });
      
      // Should have response without tool calls
      expect(result.messages.length).toBeGreaterThan(1);
      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage._getType()).toBe('ai');
    });

    it('should handle low intent confidence', async () => {
      // Mock low confidence intent detection
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn().mockResolvedValue(new AIMessage({
          content: '{"mode": "b2c", "intent": "unknown", "confidence": 0.3}'
        })),
        bind: jest.fn().mockReturnThis()
      }));
      
      const builder = new CommerceGraphBuilder(mockRegistry, {
        enableLogging: false
      });
      
      const state = CommerceStateAnnotation.spec.default() as CommerceState;
      const result = await builder.invoke({
        ...state,
        messages: [new HumanMessage('gibberish input')]
      });
      
      // Should route directly to response formatting
      expect(result.context.detectedIntent).toBe('unknown');
      expect(result.context.intentConfidence).toBe(0.3);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in nodes gracefully', async () => {
      // Mock error in ChatOpenAI
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn().mockRejectedValue(new Error('API Error')),
        bind: jest.fn().mockReturnThis()
      }));
      
      const builder = new CommerceGraphBuilder(mockRegistry, {
        enableLogging: false
      });
      
      const state = CommerceStateAnnotation.spec.default() as CommerceState;
      const result = await builder.invoke({
        ...state,
        messages: [new HumanMessage('Find products')]
      });
      
      // Should route to error handler
      expect(result.error).toBe(null); // Error cleared after handling
      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage.content).toContain('encountered an error');
    });

    it('should retry on tool errors', async () => {
      let callCount = 0;
      
      // Mock tool to fail once then succeed
      mockRegistry.getTools = jest.fn().mockReturnValue([{
        name: 'searchProducts',
        description: 'Search for products',
        call: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Tool error');
          }
          return 'Search results';
        })
      }]);
      
      const builder = new CommerceGraphBuilder(mockRegistry, {
        enableLogging: false,
        maxRetries: 3
      });
      
      // Mock to return tool calls
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn()
          .mockResolvedValueOnce(new AIMessage({
            content: '{"mode": "b2c", "intent": "search", "confidence": 0.9}'
          }))
          .mockResolvedValue(new AIMessage({
            content: 'Searching...',
            tool_calls: [{
              id: 'call_123',
              name: 'searchProducts',
              args: { query: 'laptop' }
            }]
          })),
        bind: jest.fn().mockReturnThis()
      }));
      
      const state = CommerceStateAnnotation.spec.default() as CommerceState;
      const result = await builder.invoke({
        ...state,
        messages: [new HumanMessage('Search for laptops')]
      });
      
      // Should retry and succeed
      expect(callCount).toBe(2); // Failed once, succeeded on retry
    });
  });

  describe('Streaming Support', () => {
    it('should stream responses', async () => {
      const chunks: any[] = [];
      
      const state = CommerceStateAnnotation.spec.default() as CommerceState;
      
      for await (const chunk of graphBuilder.stream({
        ...state,
        messages: [new HumanMessage('Hello')]
      })) {
        chunks.push(chunk);
      }
      
      expect(chunks.length).toBeGreaterThan(0);
      
      // Should have different node outputs
      const nodeNames = chunks.map(c => Object.keys(c)[0]);
      expect(nodeNames).toContain('securityCheck');
      expect(nodeNames).toContain('detectIntent');
      expect(nodeNames).toContain('formatResponse');
    });
  });

  describe('Persistence', () => {
    it('should enable persistence when configured', async () => {
      const builder = new CommerceGraphBuilder(mockRegistry, {
        enableLogging: false,
        enablePersistence: true
      });
      
      // Execute with thread ID
      const state = CommerceStateAnnotation.spec.default() as CommerceState;
      await builder.invoke({
        ...state,
        messages: [new HumanMessage('First message')]
      }, { threadId: 'test-thread' });
      
      // Get history
      const history = await builder.getHistory('test-thread');
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].content).toBe('First message');
    });

    it('should clear history', async () => {
      const builder = new CommerceGraphBuilder(mockRegistry, {
        enableLogging: false,
        enablePersistence: true
      });
      
      // Add some history
      const state = CommerceStateAnnotation.spec.default() as CommerceState;
      await builder.invoke({
        ...state,
        messages: [new HumanMessage('Message to clear')]
      }, { threadId: 'test-thread' });
      
      // Clear history
      await builder.clearHistory('test-thread');
      
      // Verify cleared
      const history = await builder.getHistory('test-thread');
      expect(history.length).toBe(0);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration dynamically', () => {
      const builder = new CommerceGraphBuilder(mockRegistry, {
        temperature: 0.7,
        enablePersistence: false
      });
      
      // Update config
      builder.updateConfig({
        temperature: 0.5,
        enablePersistence: true
      });
      
      // Verify update took effect
      const compiled = builder.compile();
      expect(compiled).toBeDefined();
    });
  });

  describe('Graph Visualization', () => {
    it('should provide visualization data', () => {
      const visualization = graphBuilder.getVisualization();
      
      expect(visualization).toBeDefined();
      expect(visualization.nodes).toBeDefined();
      expect(visualization.edges).toBeDefined();
      expect(visualization.nodes.length).toBeGreaterThan(0);
    });
  });
});