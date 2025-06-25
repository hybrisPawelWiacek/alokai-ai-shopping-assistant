import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { logger, Loggers } from '../logger';
import { metrics, MetricsCollector } from '../metrics';
import { traceLangGraphNode, createAISpan, traceUDLCall } from '../telemetry';
import { AsyncContextManager, preserveContext } from '../context-propagation';
import { instrumentNode, instrumentGraph } from '../langgraph-instrumentation';
import { trace, context } from '@opentelemetry/api';

// Mock OpenTelemetry
jest.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: jest.fn(() => ({
      startSpan: jest.fn(() => ({
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn(),
        recordException: jest.fn()
      }))
    })),
    getActiveSpan: jest.fn()
  },
  context: {
    active: jest.fn(),
    with: jest.fn((ctx, fn) => fn())
  },
  SpanStatusCode: { UNSET: 0, OK: 1, ERROR: 2 }
}));

describe('Observability Layer Tests', () => {
  describe('Structured Logging', () => {
    beforeEach(() => {
      // Reset logger configuration
      (logger as any).config = {
        minLevel: 'debug',
        outputFormat: 'json'
      };
    });

    it('should log with correlation ID from context', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Test', 'Test message', {
        sessionId: 'test-session',
        correlationId: 'test-correlation'
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logOutput = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.level).toBe('info');
      expect(parsed.component).toBe('Test');
      expect(parsed.message).toBe('Test message');
      expect(parsed.context.sessionId).toBe('test-session');
      expect(parsed.context.correlationId).toBe('test-correlation');
      
      consoleSpy.mockRestore();
    });

    it('should use component-specific loggers', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      Loggers.AI.info('AI operation completed', { duration: 100 });
      Loggers.Graph.debug('Graph node executed', { node: 'detectIntent' });
      Loggers.Security.warn('Suspicious pattern detected', { pattern: 'sql_injection' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      
      const logs = consoleSpy.mock.calls.map(call => JSON.parse(call[0]));
      expect(logs[0].component).toBe('AI');
      expect(logs[1].component).toBe('Graph');
      expect(logs[2].component).toBe('Security');
      
      consoleSpy.mockRestore();
    });

    it('should respect log level filtering', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      (logger as any).config.minLevel = 'warn';
      
      logger.debug('Test', 'Debug message');
      logger.info('Test', 'Info message');
      logger.warn('Test', 'Warning message');
      logger.error('Test', 'Error message');
      
      expect(consoleSpy).toHaveBeenCalledTimes(2); // Only warn and error
      
      consoleSpy.mockRestore();
    });
  });

  describe('Distributed Tracing', () => {
    it('should trace LangGraph nodes', async () => {
      const mockSpan = {
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn()
      };
      
      const mockTracer = {
        startSpan: jest.fn(() => mockSpan)
      };
      
      (trace.getTracer as jest.Mock).mockReturnValue(mockTracer);
      
      const result = await traceLangGraphNode('testNode', async (span) => {
        expect(span).toBe(mockSpan);
        return { success: true };
      });
      
      expect(result).toEqual({ success: true });
      expect(mockTracer.startSpan).toHaveBeenCalledWith('ai.node.testNode');
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 1 });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle errors in traced nodes', async () => {
      const mockSpan = {
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn(),
        recordException: jest.fn()
      };
      
      const mockTracer = {
        startSpan: jest.fn(() => mockSpan)
      };
      
      (trace.getTracer as jest.Mock).mockReturnValue(mockTracer);
      
      const error = new Error('Test error');
      
      await expect(
        traceLangGraphNode('errorNode', async () => {
          throw error;
        })
      ).rejects.toThrow('Test error');
      
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: 2,
        message: 'Test error'
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should trace UDL calls with custom attributes', async () => {
      const mockSpan = {
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn()
      };
      
      const mockTracer = {
        startSpan: jest.fn(() => mockSpan)
      };
      
      (trace.getTracer as jest.Mock).mockReturnValue(mockTracer);
      
      await traceUDLCall('searchProducts', async (span) => {
        span.setAttributes({
          'udl.search.query': 'laptops',
          'udl.search.filters': 'category:electronics'
        });
        return { products: [] };
      });
      
      expect(mockTracer.startSpan).toHaveBeenCalledWith('ai.udl.searchProducts');
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'udl.search.query': 'laptops',
        'udl.search.filters': 'category:electronics'
      });
    });
  });

  describe('Metrics Collection', () => {
    let metricsCollector: MetricsCollector;

    beforeEach(() => {
      metricsCollector = new MetricsCollector();
    });

    it('should record node execution metrics', () => {
      const recordSpy = jest.spyOn(metricsCollector, 'recordNodeExecution');
      
      metricsCollector.recordNodeExecution('detectIntent', 150, true);
      metricsCollector.recordNodeExecution('enrichContext', 75, true);
      metricsCollector.recordNodeExecution('selectAction', 200, false);
      
      expect(recordSpy).toHaveBeenCalledTimes(3);
      expect(recordSpy).toHaveBeenCalledWith('detectIntent', 150, true);
      expect(recordSpy).toHaveBeenCalledWith('enrichContext', 75, true);
      expect(recordSpy).toHaveBeenCalledWith('selectAction', 200, false);
    });

    it('should record action execution metrics', () => {
      const recordSpy = jest.spyOn(metricsCollector, 'recordActionExecution');
      
      metricsCollector.recordActionExecution('search', 100, true, 'b2c');
      metricsCollector.recordActionExecution('add_to_cart', 50, true, 'b2b');
      
      expect(recordSpy).toHaveBeenCalledTimes(2);
    });

    it('should record UDL call metrics', () => {
      const recordSpy = jest.spyOn(metricsCollector, 'recordUDLCall');
      
      metricsCollector.recordUDLCall('searchProducts', 80, true, true);
      metricsCollector.recordUDLCall('getProductDetails', 40, true, false);
      
      expect(recordSpy).toHaveBeenCalledTimes(2);
    });

    it('should track business metrics', () => {
      const recordSpy = jest.spyOn(metricsCollector, 'recordCartConversion');
      
      metricsCollector.recordCartConversion(true, 'b2c');
      metricsCollector.recordSearchSuccess(true, 10);
      metricsCollector.recordB2BQuote(5000, 'approved');
      
      expect(recordSpy).toHaveBeenCalledWith(true, 'b2c');
    });
  });

  describe('Context Propagation', () => {
    it('should preserve context across async operations', async () => {
      const contextManager = new AsyncContextManager();
      
      contextManager.setContext({
        correlationId: 'test-correlation',
        sessionId: 'test-session',
        userId: 'test-user'
      });
      
      await preserveContext(async () => {
        const context = contextManager.getContext();
        expect(context.correlationId).toBe('test-correlation');
        expect(context.sessionId).toBe('test-session');
        
        // Nested async operation
        await Promise.resolve().then(() => {
          const nestedContext = contextManager.getContext();
          expect(nestedContext.correlationId).toBe('test-correlation');
        });
      });
    });

    it('should propagate trace context in headers', () => {
      const contextManager = new AsyncContextManager();
      
      contextManager.setContext({
        correlationId: 'test-correlation',
        traceId: 'test-trace',
        spanId: 'test-span'
      });
      
      const headers = contextManager.getTraceHeaders();
      expect(headers['x-correlation-id']).toBe('test-correlation');
      expect(headers['traceparent']).toContain('test-trace');
    });
  });

  describe('LangGraph Instrumentation', () => {
    it('should instrument graph nodes', async () => {
      const mockNode = jest.fn(async (state) => ({ ...state, processed: true }));
      const instrumentedNode = instrumentNode('testNode', mockNode);
      
      const state = { messages: [], mode: 'b2c' };
      const result = await instrumentedNode(state);
      
      expect(mockNode).toHaveBeenCalledWith(state, undefined);
      expect(result.processed).toBe(true);
    });

    it('should capture state snapshots', async () => {
      const captureSnapshots = true;
      const mockNode = jest.fn(async (state) => ({ 
        ...state, 
        value: state.value + 1 
      }));
      
      const instrumentedNode = instrumentNode('testNode', mockNode, {
        captureStateSnapshots: captureSnapshots
      });
      
      const initialState = { value: 0 };
      const result = await instrumentedNode(initialState);
      
      expect(result.value).toBe(1);
    });

    it('should handle node errors gracefully', async () => {
      const error = new Error('Node error');
      const mockNode = jest.fn(async () => {
        throw error;
      });
      
      const instrumentedNode = instrumentNode('errorNode', mockNode);
      
      await expect(instrumentedNode({})).rejects.toThrow('Node error');
    });
  });

  describe('Integration Tests', () => {
    it('should propagate correlation ID through entire flow', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const correlationId = 'integration-test-123';
      
      // Simulate a request flow
      await preserveContext(async () => {
        // Set initial context
        AsyncContextManager.getInstance().setContext({
          correlationId,
          sessionId: 'session-123'
        });
        
        // Log at different points
        logger.info('API', 'Request received', { endpoint: '/chat' });
        
        await traceLangGraphNode('detectIntent', async (span) => {
          logger.info('Graph', 'Detecting intent');
          span.setAttributes({ 'ai.intent': 'search' });
        });
        
        await traceUDLCall('searchProducts', async (span) => {
          logger.info('UDL', 'Searching products');
          return { products: [] };
        });
        
        logger.info('API', 'Response sent');
      });
      
      // Verify all logs have the same correlation ID
      const logs = consoleSpy.mock.calls.map(call => JSON.parse(call[0]));
      expect(logs).toHaveLength(4);
      logs.forEach(log => {
        expect(log.context.correlationId).toBe(correlationId);
      });
      
      consoleSpy.mockRestore();
    });
  });
});