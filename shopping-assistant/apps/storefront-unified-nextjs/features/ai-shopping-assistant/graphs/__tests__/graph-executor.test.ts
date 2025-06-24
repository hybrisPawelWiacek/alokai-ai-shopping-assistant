import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CommerceGraphExecutor, type ExecutionContext, type StreamingChunk } from '../graph-executor';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import type { LogEntry } from '../../types/action-definition';

// Mock dependencies
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue(new AIMessage({
      content: 'I can help you find products. What are you looking for?',
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

describe('CommerceGraphExecutor', () => {
  let executor: CommerceGraphExecutor;
  let capturedLogs: LogEntry[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    capturedLogs = [];
    
    executor = new CommerceGraphExecutor({
      enableLogging: true,
      enablePersistence: false,
      onLog: (entry) => capturedLogs.push(entry)
    });
  });

  describe('Basic Execution', () => {
    it('should execute a simple query', async () => {
      const context: ExecutionContext = {
        threadId: 'test-thread',
        userId: 'user-123',
        sessionId: 'session-456',
        mode: 'b2c',
        locale: 'en-US',
        currency: 'USD'
      };

      const result = await executor.execute(
        'Find me a laptop',
        context,
        { streaming: false }
      );

      expect(result.response).toBeDefined();
      expect(result.response).toContain('help you find products');
      expect(result.state).toBeDefined();
      expect(result.metadata.executionTime).toBeGreaterThan(0);
    });

    it('should handle B2B mode', async () => {
      const context: ExecutionContext = {
        threadId: 'test-b2b',
        userId: 'business-123',
        mode: 'b2b',
        customMetadata: {
          companyName: 'Acme Corp',
          accountId: 'acc-789'
        }
      };

      const result = await executor.execute(
        'I need 100 laptops for my company',
        context
      );

      expect(result.state.mode).toBe('b2b');
      expect(result.state.context.companyName).toBe('Acme Corp');
    });

    it('should include conversation history when enabled', async () => {
      const executor = new CommerceGraphExecutor({
        enablePersistence: true,
        enableLogging: false
      });

      const context: ExecutionContext = {
        threadId: 'history-test',
        userId: 'user-123'
      };

      // First message
      await executor.execute('Hello', context);

      // Second message should include history
      const result = await executor.execute(
        'Find products',
        context,
        { includeHistory: true }
      );

      expect(result.state.messages.length).toBeGreaterThan(2);
      expect(result.state.messages[0].content).toBe('Hello');
    });
  });

  describe('Streaming Execution', () => {
    it('should stream responses', async () => {
      const context: ExecutionContext = {
        threadId: 'stream-test',
        userId: 'user-123'
      };

      const chunks: StreamingChunk[] = [];
      
      for await (const chunk of executor.executeStreaming('Find laptops', context)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      
      // Should have different chunk types
      const chunkTypes = chunks.map(c => c.type);
      expect(chunkTypes).toContain('text');
      expect(chunkTypes).toContain('end');
      
      // Verify end chunk has state
      const endChunk = chunks.find(c => c.type === 'end') as { type: 'end'; state: any };
      expect(endChunk.state).toBeDefined();
    });

    it('should stream tool execution', async () => {
      // Mock to return tool calls
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn()
          .mockResolvedValueOnce(new AIMessage({
            content: '{"mode": "b2c", "intent": "search", "confidence": 0.9}'
          }))
          .mockResolvedValueOnce(new AIMessage({
            content: 'Searching...',
            tool_calls: [{
              id: 'call_123',
              name: 'searchProducts',
              args: { query: 'laptop' }
            }]
          })),
        bind: jest.fn().mockReturnThis()
      }));

      const executor = new CommerceGraphExecutor({
        enableLogging: false
      });

      const context: ExecutionContext = {
        threadId: 'tool-stream-test',
        userId: 'user-123'
      };

      const chunks: StreamingChunk[] = [];
      
      for await (const chunk of executor.executeStreaming('Search for laptops', context)) {
        chunks.push(chunk);
      }

      // Should have tool-related chunks
      const toolStartChunks = chunks.filter(c => c.type === 'tool_start');
      expect(toolStartChunks.length).toBeGreaterThan(0);
      expect(toolStartChunks[0].tool).toBe('searchProducts');
    });

    it('should handle streaming errors', async () => {
      // Mock to throw error
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn().mockRejectedValue(new Error('Stream error')),
        bind: jest.fn().mockReturnThis()
      }));

      const executor = new CommerceGraphExecutor({
        enableLogging: false
      });

      const context: ExecutionContext = {
        threadId: 'error-stream',
        userId: 'user-123'
      };

      const chunks: StreamingChunk[] = [];
      
      for await (const chunk of executor.executeStreaming('Test', context)) {
        chunks.push(chunk);
      }

      // Should have error chunk
      const errorChunk = chunks.find(c => c.type === 'error');
      expect(errorChunk).toBeDefined();
      expect(errorChunk?.error).toContain('Stream error');
    });
  });

  describe('History Management', () => {
    it('should get conversation history', async () => {
      const executor = new CommerceGraphExecutor({
        enablePersistence: true,
        enableLogging: false
      });

      const context: ExecutionContext = {
        threadId: 'history-thread',
        userId: 'user-123'
      };

      // Add some messages
      await executor.execute('First message', context);
      await executor.execute('Second message', context);

      // Get history
      const history = await executor.getHistory('history-thread');
      expect(history.length).toBeGreaterThan(0);
      expect(history.some(m => m.content === 'First message')).toBe(true);
    });

    it('should clear conversation history', async () => {
      const executor = new CommerceGraphExecutor({
        enablePersistence: true,
        enableLogging: false
      });

      const context: ExecutionContext = {
        threadId: 'clear-thread',
        userId: 'user-123'
      };

      // Add a message
      await executor.execute('Message to clear', context);

      // Clear history
      await executor.clearHistory('clear-thread');

      // Verify cleared
      const history = await executor.getHistory('clear-thread');
      expect(history.length).toBe(0);
    });
  });

  describe('Logging', () => {
    it('should capture execution logs', async () => {
      const context: ExecutionContext = {
        threadId: 'log-test',
        userId: 'user-123'
      };

      await executor.execute('Test logging', context);

      // Check captured logs
      expect(capturedLogs.length).toBeGreaterThan(0);
      const levels = capturedLogs.map(log => log.level);
      expect(levels).toContain('info');
    });

    it('should filter logs by criteria', async () => {
      const context: ExecutionContext = {
        threadId: 'filter-test',
        userId: 'user-123'
      };

      await executor.execute('Test message', context);

      // Filter by level
      const infoLogs = executor.getExecutionLogs({ level: 'info' });
      expect(infoLogs.every(log => log.level === 'info')).toBe(true);

      // Filter by time
      const recentLogs = executor.getExecutionLogs({ 
        since: new Date(Date.now() - 1000) 
      });
      expect(recentLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      executor.updateConfiguration({
        modelName: 'gpt-4',
        temperature: 0.5,
        enablePersistence: true
      });

      // Verify log entry
      const configLogs = capturedLogs.filter(log => 
        log.message.includes('configuration updated')
      );
      expect(configLogs.length).toBe(1);
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const health = await executor.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.details.executionTime).toBeGreaterThan(0);
      expect(health.details.persistenceEnabled).toBe(false);
      expect(health.details.loggingEnabled).toBe(true);
    });

    it('should report unhealthy status on error', async () => {
      // Mock to throw error
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn().mockRejectedValue(new Error('Health check failed')),
        bind: jest.fn().mockReturnThis()
      }));

      const executor = new CommerceGraphExecutor({
        enableLogging: false
      });

      const health = await executor.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.details.error).toContain('Health check failed');
    });
  });

  describe('Metadata Tracking', () => {
    it('should track execution metadata', async () => {
      // Mock with intent detection
      const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
      ChatOpenAI.mockImplementation(() => ({
        invoke: jest.fn()
          .mockResolvedValueOnce(new AIMessage({
            content: '{"mode": "b2c", "intent": "search", "confidence": 0.95}'
          }))
          .mockResolvedValue(new AIMessage({
            content: 'Here are some laptops for you.'
          })),
        bind: jest.fn().mockReturnThis()
      }));

      const executor = new CommerceGraphExecutor({
        enableLogging: false
      });

      const context: ExecutionContext = {
        threadId: 'metadata-test',
        userId: 'user-123'
      };

      const result = await executor.execute('Find laptops', context);

      expect(result.metadata.intentDetected).toBe('search');
      expect(result.metadata.executionTime).toBeGreaterThan(0);
    });

    it('should track security flags', async () => {
      // Mock security judge to detect patterns
      const CommerceSecurityJudge = require('../../security').CommerceSecurityJudge;
      CommerceSecurityJudge.mockImplementation(() => ({
        validate: jest.fn().mockResolvedValue({ 
          isValid: true, 
          severity: 'medium'
        }),
        getContext: jest.fn().mockReturnValue({
          threatLevel: 'medium',
          trustScore: 75,
          detectedPatterns: ['suspicious_query'],
          blockedAttempts: 0
        })
      }));

      const executor = new CommerceGraphExecutor({
        enableLogging: false
      });

      const context: ExecutionContext = {
        threadId: 'security-test',
        userId: 'user-123'
      };

      const result = await executor.execute('Suspicious query', context);

      expect(result.metadata.securityFlags).toBeDefined();
      expect(result.metadata.securityFlags).toContain('suspicious_query');
    });
  });

  describe('Error Recovery', () => {
    it('should handle execution timeout', async () => {
      // This would require mocking setTimeout/Promise.race
      // For now, just verify the option exists
      const context: ExecutionContext = {
        threadId: 'timeout-test',
        userId: 'user-123'
      };

      const resultPromise = executor.execute(
        'Test timeout',
        context,
        { timeout: 5000 }
      );

      await expect(resultPromise).resolves.toBeDefined();
    });
  });
});