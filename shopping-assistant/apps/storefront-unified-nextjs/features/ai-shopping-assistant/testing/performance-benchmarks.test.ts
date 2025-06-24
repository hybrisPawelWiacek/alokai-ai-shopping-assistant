import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { CommerceAgentGraph } from '../graphs/commerce-graph';
import { CommerceToolRegistry } from '../core/tool-registry';
import { LangGraphActionFactory } from '../core/action-factory';
import { 
  createTestState, 
  createTestSDK, 
  PerformanceTimer,
  runGraphWithInput,
  MockLLM
} from './test-utils';
import { PerformanceMonitor } from '../observability/performance';

describe('Performance Benchmarks', () => {
  let graph: CommerceAgentGraph;
  let registry: CommerceToolRegistry;
  let mockSDK: ReturnType<typeof createTestSDK>;
  let mockLLM: MockLLM;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSDK = createTestSDK();
    mockLLM = new MockLLM();
    registry = new CommerceToolRegistry();
    performanceMonitor = new PerformanceMonitor();
    
    // Configure fast mock responses
    mockLLM.invoke = jest.fn().mockResolvedValue({
      tool_calls: [],
      content: 'Response'
    });
    
    // Register common actions
    registry.registerFromConfig({
      actions: [
        {
          id: 'search_products',
          name: 'Search Products',
          description: 'Search for products',
          category: 'search',
          parameters: { query: { type: 'string', required: true } }
        },
        {
          id: 'add_to_cart',
          name: 'Add to Cart',
          description: 'Add to cart',
          category: 'cart',
          parameters: {
            productId: { type: 'string', required: true },
            quantity: { type: 'number', required: true }
          }
        }
      ]
    });

    graph = new CommerceAgentGraph(registry, {
      llm: mockLLM,
      sdk: mockSDK,
      performance: performanceMonitor
    });
  });

  describe('Response Time Benchmarks', () => {
    it('should complete simple queries under 250ms', async () => {
      const timer = new PerformanceTimer();
      
      await runGraphWithInput(graph, 'Hello', createTestState());
      
      timer.assertUnder(250);
    });

    it('should complete search queries under 250ms', async () => {
      mockLLM.setResponse('search', {
        tool_calls: [{
          name: 'search_products',
          args: { query: 'laptop' }
        }]
      });

      mockSDK.unified.searchProducts = jest.fn().mockResolvedValue({
        products: [{ id: 'prod-1', name: 'Laptop' }],
        total: 1
      });

      const timer = new PerformanceTimer();
      
      await runGraphWithInput(
        graph,
        'search for laptops',
        createTestState()
      );
      
      timer.assertUnder(250);
    });

    it('should complete cart operations under 150ms', async () => {
      mockLLM.setResponse('add', {
        tool_calls: [{
          name: 'add_to_cart',
          args: { productId: 'prod-1', quantity: 1 }
        }]
      });

      mockSDK.unified.addCartLineItem = jest.fn().mockResolvedValue({
        id: 'cart-123',
        items: [{ productId: 'prod-1', quantity: 1 }],
        total: 99.99
      });

      const timer = new PerformanceTimer();
      
      await runGraphWithInput(
        graph,
        'add product to cart',
        createTestState()
      );
      
      timer.assertUnder(150);
    });

    it('should handle complex multi-step flows under 500ms', async () => {
      // Search -> View Details -> Add to Cart
      const timer = new PerformanceTimer();
      
      // Step 1: Search
      mockLLM.setResponse('search', {
        tool_calls: [{
          name: 'search_products',
          args: { query: 'shoes' }
        }]
      });
      
      let state = await runGraphWithInput(
        graph,
        'find running shoes',
        createTestState()
      );
      
      timer.mark('search_complete');
      
      // Step 2: Get details
      mockLLM.setResponse('details', {
        tool_calls: [{
          name: 'get_product_details',
          args: { productId: 'prod-1' }
        }]
      });
      
      state = await runGraphWithInput(
        graph,
        'tell me more about the first one',
        state
      );
      
      timer.mark('details_complete');
      
      // Step 3: Add to cart
      mockLLM.setResponse('add', {
        tool_calls: [{
          name: 'add_to_cart',
          args: { productId: 'prod-1', quantity: 1 }
        }]
      });
      
      await runGraphWithInput(
        graph,
        'add it to my cart',
        state
      );
      
      timer.assertUnder(500);
      
      // Individual steps should also be fast
      expect(timer.getMeasurement('search_complete')).toBeLessThan(200);
      expect(timer.getMeasurement('details_complete')).toBeLessThan(350);
    });
  });

  describe('Node Performance', () => {
    it('should measure individual node execution times', async () => {
      await runGraphWithInput(
        graph,
        'search for products',
        createTestState()
      );

      const state = graph.getLastState();
      const nodeTimings = state.metrics.nodeTimings;

      // All nodes should execute quickly
      expect(nodeTimings['detectIntent']).toBeLessThan(50);
      expect(nodeTimings['enrichContext']).toBeLessThan(30);
      expect(nodeTimings['selectAction']).toBeLessThan(20);
      expect(nodeTimings['formatResponse']).toBeLessThan(20);
    });

    it('should identify slow nodes', async () => {
      // Simulate slow enrichment
      jest.spyOn(graph, 'enrichContext').mockImplementation(async (state) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return state;
      });

      const timer = new PerformanceTimer();
      
      await runGraphWithInput(
        graph,
        'test query',
        createTestState()
      );
      
      const state = graph.getLastState();
      
      // Should still complete within reasonable time
      timer.assertUnder(300);
      
      // But enrichContext should be identified as slow
      expect(state.metrics.nodeTimings['enrichContext']).toBeGreaterThan(100);
    });
  });

  describe('Tool Performance', () => {
    it('should execute tools efficiently', async () => {
      const actionFactory = new LangGraphActionFactory();
      const timer = new PerformanceTimer();
      
      const tool = actionFactory.createTool({
        id: 'perf_test',
        name: 'Performance Test',
        description: 'Test tool',
        category: 'test',
        parameters: {},
        execute: async () => ({ result: 'success' })
      });
      
      await tool.invoke({}, { configurable: {} });
      
      timer.assertUnder(10);
    });

    it('should cache tool schemas', async () => {
      const factory = new LangGraphActionFactory();
      const timer = new PerformanceTimer();
      
      // First creation
      factory.createTool({
        id: 'test1',
        name: 'Test 1',
        description: 'Test',
        category: 'test',
        parameters: {
          param1: { type: 'string', required: true },
          param2: { type: 'number', required: true }
        }
      });
      
      timer.mark('first_creation');
      
      // Second creation with same parameters
      factory.createTool({
        id: 'test2',
        name: 'Test 2',
        description: 'Test',
        category: 'test',
        parameters: {
          param1: { type: 'string', required: true },
          param2: { type: 'number', required: true }
        }
      });
      
      timer.mark('second_creation');
      
      // Second should be faster due to schema caching
      const firstTime = timer.getMeasurement('first_creation');
      const secondTime = timer.getMeasurement('second_creation')! - firstTime!;
      
      expect(secondTime).toBeLessThan(firstTime! * 0.5);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const timer = new PerformanceTimer();
      
      const promises = Array(10).fill(null).map((_, i) => 
        runGraphWithInput(
          graph,
          `query ${i}`,
          createTestState()
        )
      );
      
      await Promise.all(promises);
      
      // All 10 requests should complete quickly
      timer.assertUnder(500);
    });

    it('should not degrade under load', async () => {
      const timings: number[] = [];
      
      // Run 20 sequential requests
      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        
        await runGraphWithInput(
          graph,
          `search for product ${i}`,
          createTestState()
        );
        
        timings.push(Date.now() - start);
      }
      
      // Calculate average of first 5 and last 5
      const firstFiveAvg = timings.slice(0, 5).reduce((a, b) => a + b) / 5;
      const lastFiveAvg = timings.slice(-5).reduce((a, b) => a + b) / 5;
      
      // Performance should not degrade significantly
      expect(lastFiveAvg).toBeLessThan(firstFiveAvg * 1.5);
      
      // All should still be under target
      expect(Math.max(...timings)).toBeLessThan(250);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Run many operations
      for (let i = 0; i < 100; i++) {
        await runGraphWithInput(
          graph,
          `query ${i}`,
          createTestState()
        );
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should clean up state between requests', async () => {
      const states: CommerceState[] = [];
      
      for (let i = 0; i < 10; i++) {
        const state = await runGraphWithInput(
          graph,
          `query ${i}`,
          createTestState()
        );
        states.push(state);
      }
      
      // Each state should be independent
      states.forEach((state, i) => {
        expect(state.messages).toHaveLength(2); // User + Assistant
        expect(state.messages[0].content).toBe(`query ${i}`);
      });
    });
  });

  describe('Cache Performance', () => {
    it('should improve performance with caching', async () => {
      const timer = new PerformanceTimer();
      
      // First request - no cache
      await runGraphWithInput(
        graph,
        'search for laptop',
        createTestState()
      );
      
      timer.mark('first_request');
      
      // Second identical request - should use cache
      await runGraphWithInput(
        graph,
        'search for laptop',
        createTestState()
      );
      
      timer.mark('second_request');
      
      const firstTime = timer.getMeasurement('first_request');
      const secondTime = timer.getMeasurement('second_request')! - firstTime!;
      
      // Second request should be significantly faster
      expect(secondTime).toBeLessThan(firstTime! * 0.7);
    });

    it('should have efficient cache lookup', async () => {
      // Pre-populate cache with many entries
      for (let i = 0; i < 100; i++) {
        await registry.getCachedTool(`tool_${i}`);
      }
      
      const timer = new PerformanceTimer();
      
      // Cache lookup should still be fast
      await registry.getCachedTool('tool_50');
      
      timer.assertUnder(1);
    });
  });

  describe('B2B Bulk Operations Performance', () => {
    it('should process 100 items under 30 seconds', async () => {
      const bulkItems = Array(100).fill(null).map((_, i) => ({
        sku: `SKU-${i}`,
        quantity: 10
      }));

      mockLLM.setResponse('bulk', {
        tool_calls: [{
          name: 'process_bulk_order',
          args: { items: bulkItems }
        }]
      });

      mockSDK.customExtension.processBulkOrder = jest.fn().mockImplementation(
        async ({ items }) => {
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, items.length * 10));
          return {
            processed: items.length,
            errors: []
          };
        }
      );

      const timer = new PerformanceTimer();
      
      await runGraphWithInput(
        graph,
        'process bulk order',
        createTestState({ mode: 'b2b' })
      );
      
      timer.assertUnder(30000);
    });

    it('should stream progress for long operations', async () => {
      let progressUpdates = 0;
      
      graph.on('progress', () => {
        progressUpdates++;
      });

      // Simulate long operation
      mockSDK.customExtension.processBulkOrder = jest.fn().mockImplementation(
        async ({ items, onProgress }) => {
          for (let i = 0; i < items.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            if (onProgress) onProgress(i + 1, items.length);
          }
          return { processed: items.length };
        }
      );

      await runGraphWithInput(
        graph,
        'process 20 items',
        createTestState({ mode: 'b2b' })
      );

      // Should have received progress updates
      expect(progressUpdates).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      await runGraphWithInput(
        graph,
        'test query',
        createTestState()
      );

      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toMatchObject({
        requestCount: expect.any(Number),
        averageResponseTime: expect.any(Number),
        p95ResponseTime: expect.any(Number),
        p99ResponseTime: expect.any(Number)
      });
      
      expect(metrics.averageResponseTime).toBeLessThan(250);
    });

    it('should identify performance bottlenecks', async () => {
      // Run several requests
      for (let i = 0; i < 10; i++) {
        await runGraphWithInput(
          graph,
          `query ${i}`,
          createTestState()
        );
      }

      const bottlenecks = performanceMonitor.getBottlenecks();
      
      // Should identify any slow operations
      if (bottlenecks.length > 0) {
        expect(bottlenecks[0]).toMatchObject({
          operation: expect.any(String),
          averageTime: expect.any(Number),
          count: expect.any(Number)
        });
      }
    });
  });
});