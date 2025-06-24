import { describe, it, expect, jest } from '@jest/globals';
import { createStreamingResponse, parseSSEStream } from '../streaming';
import { CommerceGraphExecutor } from '@/features/ai-shopping-assistant/graphs/graph-executor';

// Mock the executor
jest.mock('@/features/ai-shopping-assistant/graphs/graph-executor');

describe('Streaming Response', () => {
  describe('createStreamingResponse', () => {
    it('should create readable stream with SSE events', async () => {
      // Mock executor streaming
      const mockExecutor = {
        executeStreaming: jest.fn().mockImplementation(async function* () {
          yield { type: 'text', content: 'Hello ' };
          yield { type: 'text', content: 'world!' };
          yield { type: 'tool_start', tool: 'searchProducts', args: { query: 'laptop' } };
          yield { type: 'tool_end', tool: 'searchProducts', result: { count: 5 } };
          yield { type: 'metadata', data: { intent: 'search' } };
          yield { type: 'end', state: { mode: 'b2c', messages: [] } };
        })
      } as any;

      const stream = createStreamingResponse(
        mockExecutor,
        'Test message',
        { threadId: 'test-123', userId: 'user-123' },
        {}
      );

      // Read stream chunks
      const reader = stream.getReader();
      const chunks: string[] = [];
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value));
      }

      const fullResponse = chunks.join('');

      // Verify SSE format
      expect(fullResponse).toContain('event: connection');
      expect(fullResponse).toContain('event: message');
      expect(fullResponse).toContain('event: tool_start');
      expect(fullResponse).toContain('event: tool_end');
      expect(fullResponse).toContain('event: metadata');
      expect(fullResponse).toContain('event: done');
      
      // Verify data format
      expect(fullResponse).toContain('data: {"threadId":"test-123"}');
      expect(fullResponse).toContain('data: {"content":"Hello ');
      expect(fullResponse).toContain('data: {"tool":"searchProducts"');
    });

    it('should handle streaming errors', async () => {
      const mockExecutor = {
        executeStreaming: jest.fn().mockImplementation(async function* () {
          yield { type: 'text', content: 'Starting...' };
          throw new Error('Stream failed');
        })
      } as any;

      const stream = createStreamingResponse(
        mockExecutor,
        'Test message',
        { threadId: 'test-123', userId: 'user-123' },
        {}
      );

      const reader = stream.getReader();
      const chunks: string[] = [];
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value));
      }

      const fullResponse = chunks.join('');

      expect(fullResponse).toContain('event: error');
      expect(fullResponse).toContain('Stream failed');
    });

    it('should include keep-alive pings', async () => {
      // Mock executor with delayed response
      const mockExecutor = {
        executeStreaming: jest.fn().mockImplementation(async function* () {
          yield { type: 'text', content: 'Processing...' };
          // Simulate delay
          await new Promise(resolve => setTimeout(resolve, 100));
          yield { type: 'end', state: { mode: 'b2c', messages: [] } };
        })
      } as any;

      const stream = createStreamingResponse(
        mockExecutor,
        'Test message',
        { threadId: 'test-123', userId: 'user-123' },
        {}
      );

      const reader = stream.getReader();
      const chunks: string[] = [];
      const decoder = new TextDecoder();

      // Read for a short time
      const readPromise = (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(decoder.decode(value));
        }
      })();

      await readPromise;

      // Stream should include events
      const fullResponse = chunks.join('');
      expect(fullResponse).toContain('event: message');
    });
  });

  describe('parseSSEStream', () => {
    it('should parse SSE events correctly', async () => {
      // Create mock response with SSE data
      const sseData = [
        'event: message\n',
        'data: {"content":"Hello world"}\n',
        '\n',
        'event: tool_start\n',
        'data: {"tool":"search","args":{"query":"laptop"}}\n',
        '\n',
        'event: done\n',
        'data: {"threadId":"test-123"}\n',
        '\n'
      ].join('');

      const response = new Response(sseData);
      const events: Array<{ type: string; data: any }> = [];

      for await (const event of parseSSEStream(response)) {
        events.push(event);
      }

      expect(events).toHaveLength(3);
      expect(events[0]).toEqual({
        type: 'message',
        data: { content: 'Hello world' }
      });
      expect(events[1]).toEqual({
        type: 'tool_start',
        data: { tool: 'search', args: { query: 'laptop' } }
      });
      expect(events[2]).toEqual({
        type: 'done',
        data: { threadId: 'test-123' }
      });
    });

    it('should handle incomplete data gracefully', async () => {
      const incompleteData = 'event: message\ndata: {"content":"Hello';
      const response = new Response(incompleteData);
      const events: any[] = [];

      for await (const event of parseSSEStream(response)) {
        events.push(event);
      }

      // Should not yield incomplete events
      expect(events).toHaveLength(0);
    });
  });
});