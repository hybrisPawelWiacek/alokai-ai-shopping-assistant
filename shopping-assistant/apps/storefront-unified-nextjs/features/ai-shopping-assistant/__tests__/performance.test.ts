import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { performance } from 'perf_hooks';
import { CommerceStateAnnotation, type CommerceState } from '../state';
import { CommerceAgentGraph } from '../graphs/commerce-graph';
import { CommerceToolRegistry } from '../core/tool-registry';
import { createMockSDK } from '../mocks/mock-sdk-factory';
import { HumanMessage } from '@langchain/core/messages';
import { PerformanceProfiler, globalProfiler } from '../observability/profiler';

// Mock action implementations for testing
import * as searchImpl from '../actions/implementations/search-implementation';
import * as cartImpl from '../actions/implementations/cart-implementation';
import * as productImpl from '../actions/implementations/product-implementation';

// Action definitions
import searchActions from '../actions/search.json';
import cartActions from '../actions/cart.json';
import productActions from '../actions/product.json';

describe('AI Shopping Assistant Performance Tests', () => {
  let toolRegistry: CommerceToolRegistry;
  let agentGraph: CommerceAgentGraph;
  let mockSDK: any;
  let profiler: PerformanceProfiler;

  beforeEach(async () => {
    // Initialize profiler
    profiler = new PerformanceProfiler({
      autoLog: false,
      logThreshold: 50,
      captureMemory: true
    });

    // Create mock SDK
    mockSDK = createMockSDK();

    // Initialize tool registry with caching enabled
    toolRegistry = new CommerceToolRegistry({
      enablePerformanceTracking: true,
      enableSecurityValidation: true,
      enableCaching: true,
      cacheSize: 100
    });

    // Register tools
    const implementations = {
      search: searchImpl.searchImplementation,
      search_bulk: searchImpl.searchBulkImplementation,
      add_to_cart: cartImpl.addToCartImplementation,
      update_cart: cartImpl.updateCartImplementation,
      remove_from_cart: cartImpl.removeFromCartImplementation,
      get_cart: cartImpl.getCartImplementation,
      get_product_details: productImpl.getProductDetailsImplementation,
      add_to_comparison: productImpl.addToComparisonImplementation,
      compare_products: productImpl.compareProductsImplementation,
      clear_comparison: productImpl.clearComparisonImplementation
    };

    // Register actions from JSON definitions
    [...searchActions.actions, ...cartActions.actions, ...productActions.actions].forEach(action => {
      const impl = implementations[action.id as keyof typeof implementations];
      if (impl) {
        toolRegistry.register(action as any, impl);
      }
    });

    // Create agent graph
    agentGraph = new CommerceAgentGraph(toolRegistry, {
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.3,
      enableLogging: false
    });
  });

  afterEach(() => {
    profiler.clear();
    toolRegistry.clear();
  });

  describe('Response Time Tests', () => {
    it('should respond to basic search query in under 250ms', async () => {
      const state: CommerceState = {
        ...CommerceStateAnnotation.spec.default(),
        messages: [new HumanMessage('show me laptops')],
        context: {
          ...CommerceStateAnnotation.spec.context.default(),
          sdk: mockSDK
        }
      };

      const { result, profile } = await profiler.profile(
        'basic_search_query',
        async () => {
          const compiled = await agentGraph.compile();
          return await compiled.invoke(state, {
            recursionLimit: 5,
            configurable: { sessionId: 'perf-test-1' }
          });
        }
      );

      expect(profile.duration).toBeLessThan(250);
      expect(result.messages.length).toBeGreaterThan(1);
    });

    it('should handle cart operations in under 200ms', async () => {
      const state: CommerceState = {
        ...CommerceStateAnnotation.spec.default(),
        messages: [new HumanMessage('add product-123 to cart')],
        context: {
          ...CommerceStateAnnotation.spec.context.default(),
          sdk: mockSDK
        }
      };

      const { result, profile } = await profiler.profile(
        'cart_operation',
        async () => {
          const compiled = await agentGraph.compile();
          return await compiled.invoke(state, {
            recursionLimit: 5,
            configurable: { sessionId: 'perf-test-2' }
          });
        }
      );

      expect(profile.duration).toBeLessThan(200);
      expect(result.cart.items.length).toBeGreaterThan(0);
    });

    it('should handle complex queries in under 500ms', async () => {
      const state: CommerceState = {
        ...CommerceStateAnnotation.spec.default(),
        messages: [new HumanMessage('compare gaming laptops under $1500 with at least 16GB RAM')],
        context: {
          ...CommerceStateAnnotation.spec.context.default(),
          sdk: mockSDK
        }
      };

      const { result, profile } = await profiler.profile(
        'complex_query',
        async () => {
          const compiled = await agentGraph.compile();
          return await compiled.invoke(state, {
            recursionLimit: 10,
            configurable: { sessionId: 'perf-test-3' }
          });
        }
      );

      expect(profile.duration).toBeLessThan(500);
      expect(result.messages.length).toBeGreaterThan(1);
    });
  });

  describe('Tool Registry Cache Performance', () => {
    it('should achieve >80% cache hit rate after warm-up', async () => {
      // Warm up cache by registering and accessing tools multiple times
      const testActions = searchActions.actions.slice(0, 3);
      
      // First pass - cache misses
      testActions.forEach(action => {
        toolRegistry.getTool(action.id);
      });

      // Clear stats
      const initialStats = toolRegistry.getCacheStats();
      expect(initialStats.hitRate).toBe(0);

      // Second pass - should hit cache
      for (let i = 0; i < 10; i++) {
        testActions.forEach(action => {
          toolRegistry.getTool(action.id);
        });
      }

      const finalStats = toolRegistry.getCacheStats();
      expect(finalStats.hitRate).toBeGreaterThan(0.8);
      expect(finalStats.cacheHits).toBeGreaterThan(finalStats.cacheMisses);
    });

    it('should maintain cache size limits', () => {
      // Registry was created with cacheSize: 100
      // Try to register more than 100 tools
      for (let i = 0; i < 150; i++) {
        const mockAction = {
          id: `test_action_${i}`,
          name: `Test Action ${i}`,
          description: 'Test action',
          parameters: searchActions.actions[0].parameters,
          category: 'search',
          mode: 'both'
        };
        
        try {
          toolRegistry.register(mockAction as any, async () => []);
        } catch (e) {
          // Ignore duplicate errors
        }
      }

      const stats = toolRegistry.getCacheStats();
      expect(stats.toolCacheSize).toBeLessThanOrEqual(100);
    });
  });

  describe('Node Execution Performance', () => {
    it('should track individual node execution times', async () => {
      const state: CommerceState = {
        ...CommerceStateAnnotation.spec.default(),
        messages: [new HumanMessage('show me products')],
        context: {
          ...CommerceStateAnnotation.spec.context.default(),
          sdk: mockSDK
        }
      };

      const compiled = await agentGraph.compile();
      const result = await compiled.invoke(state, {
        recursionLimit: 5,
        configurable: { sessionId: 'perf-test-node' }
      });

      // Check that node execution times were tracked
      const { nodeExecutionTimes } = result.performance;
      expect(Object.keys(nodeExecutionTimes).length).toBeGreaterThan(0);
      
      // Common nodes that should be tracked
      const expectedNodes = ['detectIntent', 'enrichContext', 'selectAction', 'formatResponse'];
      expectedNodes.forEach(node => {
        if (nodeExecutionTimes[node]) {
          const times = nodeExecutionTimes[node];
          expect(times.length).toBeGreaterThan(0);
          times.forEach(time => {
            expect(time).toBeGreaterThan(0);
            expect(time).toBeLessThan(200); // No single node should take >200ms
          });
        }
      });
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle 10 concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map((_, index) => ({
        state: {
          ...CommerceStateAnnotation.spec.default(),
          messages: [new HumanMessage(`search query ${index}`)],
          context: {
            ...CommerceStateAnnotation.spec.context.default(),
            sdk: mockSDK,
            sessionId: `concurrent-test-${index}`
          }
        },
        sessionId: `concurrent-test-${index}`
      }));

      const compiled = await agentGraph.compile();
      
      const { result: results, profile } = await profiler.profile(
        'concurrent_requests',
        async () => {
          return await Promise.all(
            requests.map(({ state, sessionId }) =>
              compiled.invoke(state, {
                recursionLimit: 5,
                configurable: { sessionId }
              })
            )
          );
        }
      );

      // All requests should complete
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result.messages.length).toBeGreaterThan(1);
      });

      // Average time per request should still be reasonable
      const avgTimePerRequest = profile.duration / 10;
      expect(avgTimePerRequest).toBeLessThan(300); // 300ms average per request
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during repeated operations', async () => {
      const iterations = 50;
      const memoryBefore = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        const state: CommerceState = {
          ...CommerceStateAnnotation.spec.default(),
          messages: [new HumanMessage(`test query ${i}`)],
          context: {
            ...CommerceStateAnnotation.spec.context.default(),
            sdk: mockSDK,
            sessionId: `memory-test-${i}`
          }
        };

        const compiled = await agentGraph.compile();
        await compiled.invoke(state, {
          recursionLimit: 3,
          configurable: { sessionId: `memory-test-${i}` }
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;
      const memoryIncreasePerIteration = memoryIncrease / iterations;

      // Memory increase per iteration should be minimal
      expect(memoryIncreasePerIteration).toBeLessThan(1024 * 1024); // Less than 1MB per iteration
    });
  });

  describe('Performance Profiler Integration', () => {
    it('should generate accurate performance reports', () => {
      // Add some test operations
      profiler.start('operation1');
      setTimeout(() => profiler.end('operation1'), 50);
      
      profiler.start('operation2');
      setTimeout(() => profiler.end('operation2'), 100);

      // Get summary
      const summary = profiler.getSummary();
      expect(summary.totalOperations).toBeGreaterThanOrEqual(2);
      expect(summary.averageDuration).toBeGreaterThan(0);
      expect(summary.slowestOperation).toBeDefined();
    });

    it('should track memory statistics', () => {
      const memStats = profiler.getMemoryStats();
      if (memStats) {
        expect(memStats.current).toBeDefined();
        expect(memStats.peak).toBeDefined();
        expect(memStats.average).toBeDefined();
        expect(memStats.current.heapUsed).toBeGreaterThan(0);
      }
    });
  });
});