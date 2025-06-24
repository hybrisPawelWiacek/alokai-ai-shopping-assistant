import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CommerceAgentGraph } from '../commerce-graph';
import { CommerceToolRegistry } from '../../core/tool-registry';
import { createTestState, createTestSDK, runGraphWithInput, MockLLM } from '../../testing/test-utils';
import { CommerceStateAnnotation } from '../../state';
import type { CommerceState } from '../../state';

describe('Commerce Graph Integration Tests', () => {
  let graph: CommerceAgentGraph;
  let registry: CommerceToolRegistry;
  let mockSDK: ReturnType<typeof createTestSDK>;
  let mockLLM: MockLLM;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSDK = createTestSDK();
    mockLLM = new MockLLM();
    registry = new CommerceToolRegistry();
    
    // Register common actions
    registry.registerFromConfig({
      actions: [
        {
          id: 'search_products',
          name: 'Search Products',
          description: 'Search for products',
          category: 'search',
          parameters: {
            query: { type: 'string', required: true }
          }
        },
        {
          id: 'add_to_cart',
          name: 'Add to Cart',
          description: 'Add product to cart',
          category: 'cart',
          parameters: {
            productId: { type: 'string', required: true },
            quantity: { type: 'number', required: true }
          }
        },
        {
          id: 'get_product_details',
          name: 'Get Product Details',
          description: 'Get detailed product information',
          category: 'search',
          parameters: {
            productId: { type: 'string', required: true }
          }
        }
      ]
    });

    graph = new CommerceAgentGraph(registry, {
      llm: mockLLM,
      sdk: mockSDK
    });
  });

  describe('Complete User Flows', () => {
    it('should handle product search and add to cart flow', async () => {
      // Mock LLM responses
      mockLLM.setResponse('search for laptop', {
        tool_calls: [{
          name: 'search_products',
          args: { query: 'laptop' }
        }]
      });

      mockLLM.setResponse('add the first one', {
        tool_calls: [{
          name: 'add_to_cart',
          args: { productId: 'prod-1', quantity: 1 }
        }]
      });

      // Mock SDK responses
      mockSDK.unified.searchProducts = jest.fn().mockResolvedValue({
        products: [
          { id: 'prod-1', name: 'Gaming Laptop', price: 1299.99 },
          { id: 'prod-2', name: 'Business Laptop', price: 999.99 }
        ],
        total: 2
      });

      mockSDK.unified.addCartLineItem = jest.fn().mockResolvedValue({
        id: 'cart-123',
        items: [
          { id: 'item-1', productId: 'prod-1', quantity: 1, price: 1299.99 }
        ],
        total: 1299.99
      });

      // Run the flow
      const initialState = createTestState();
      
      // First query: search
      let state = await runGraphWithInput(
        graph,
        'I want to search for a laptop',
        initialState
      );

      expect(state.searchResults).toHaveLength(2);
      expect(state.searchResults[0].name).toBe('Gaming Laptop');

      // Second query: add to cart
      state = await runGraphWithInput(
        graph,
        'add the first one to my cart',
        state
      );

      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.total).toBe(1299.99);
    });

    it('should handle B2B mode detection and bulk operations', async () => {
      // Mock B2B customer
      mockSDK.unified.getCustomer = jest.fn().mockResolvedValue({
        id: 'cust-123',
        accountType: 'business',
        company: 'Acme Corp'
      });

      mockLLM.setResponse('order 100 units', {
        tool_calls: [{
          name: 'add_to_cart',
          args: { productId: 'prod-1', quantity: 100 }
        }]
      });

      mockSDK.customExtension.addToCartWithBulkPricing = jest.fn().mockResolvedValue({
        id: 'cart-123',
        items: [{
          id: 'item-1',
          productId: 'prod-1',
          quantity: 100,
          price: 89.99, // Bulk price
          subtotal: 8999.00
        }],
        total: 8999.00
      });

      const state = await runGraphWithInput(
        graph,
        'I need to order 100 units of product SKU-001',
        createTestState({ context: { customerId: 'cust-123' } })
      );

      expect(state.mode).toBe('b2b');
      expect(mockSDK.customExtension.addToCartWithBulkPricing).toHaveBeenCalled();
      expect(state.cart.items[0].price).toBe(89.99);
    });

    it('should handle product comparison flow', async () => {
      mockLLM.setResponse('compare', {
        tool_calls: [{
          name: 'compare_products',
          args: {
            productIds: ['prod-1', 'prod-2'],
            attributes: ['price', 'features', 'warranty']
          }
        }]
      });

      mockSDK.unified.getProductDetails = jest.fn()
        .mockResolvedValueOnce({
          id: 'prod-1',
          name: 'Laptop A',
          price: 999,
          features: ['16GB RAM', '512GB SSD'],
          warranty: '1 year'
        })
        .mockResolvedValueOnce({
          id: 'prod-2',
          name: 'Laptop B',
          price: 1299,
          features: ['32GB RAM', '1TB SSD'],
          warranty: '2 years'
        });

      const state = await runGraphWithInput(
        graph,
        'Compare laptop A and laptop B',
        createTestState()
      );

      expect(state.comparisonResults).toBeDefined();
      expect(state.comparisonResults.products).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockLLM.setResponse('search', {
        tool_calls: [{
          name: 'search_products',
          args: { query: 'laptop' }
        }]
      });

      mockSDK.unified.searchProducts = jest.fn().mockRejectedValue(
        new Error('API Error: Service unavailable')
      );

      const state = await runGraphWithInput(
        graph,
        'search for laptops',
        createTestState()
      );

      expect(state.error).toBeDefined();
      expect(state.messages).toContainEqual(
        expect.objectContaining({
          role: 'assistant',
          content: expect.stringContaining('error')
        })
      );
    });

    it('should handle invalid tool calls', async () => {
      mockLLM.setResponse('invalid', {
        tool_calls: [{
          name: 'non_existent_tool',
          args: {}
        }]
      });

      const state = await runGraphWithInput(
        graph,
        'do something invalid',
        createTestState()
      );

      expect(state.error).toBeDefined();
      expect(state.error.message).toContain('Tool not found');
    });

    it('should recover from partial failures', async () => {
      // First call fails
      mockSDK.unified.searchProducts = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          products: [{ id: 'prod-1', name: 'Product' }],
          total: 1
        });

      mockLLM.setResponse('search', {
        tool_calls: [{
          name: 'search_products',
          args: { query: 'product' }
        }]
      });

      // Should retry and succeed
      const state = await runGraphWithInput(
        graph,
        'search for products',
        createTestState()
      );

      expect(mockSDK.unified.searchProducts).toHaveBeenCalledTimes(2);
      expect(state.searchResults).toHaveLength(1);
    });
  });

  describe('State Management', () => {
    it('should maintain conversation context', async () => {
      mockLLM.setResponse('search laptop', {
        tool_calls: [{
          name: 'search_products',
          args: { query: 'laptop' }
        }]
      });

      mockSDK.unified.searchProducts = jest.fn().mockResolvedValue({
        products: [{ id: 'prod-1', name: 'Laptop', price: 999 }],
        total: 1
      });

      // First interaction
      let state = await runGraphWithInput(
        graph,
        'search for laptops',
        createTestState()
      );

      expect(state.messages).toHaveLength(2); // User + Assistant
      expect(state.lastAction).toBe('search_products');

      // Follow-up interaction
      mockLLM.setResponse('tell me more', {
        tool_calls: [{
          name: 'get_product_details',
          args: { productId: 'prod-1' }
        }]
      });

      state = await runGraphWithInput(
        graph,
        'tell me more about it',
        state
      );

      expect(state.messages).toHaveLength(4); // Previous + New
      expect(state.lastAction).toBe('get_product_details');
    });

    it('should update metrics during execution', async () => {
      const state = await runGraphWithInput(
        graph,
        'hello',
        createTestState()
      );

      expect(state.metrics.nodeTimings).toBeDefined();
      expect(state.metrics.totalExecutionTime).toBeGreaterThan(0);
      expect(state.metrics.nodeTimings['detectIntent']).toBeGreaterThan(0);
    });
  });

  describe('Intelligence Layer', () => {
    it('should enrich context based on user history', async () => {
      const stateWithHistory = createTestState({
        searchHistory: ['gaming laptop', 'high performance'],
        context: {
          preferences: { brand: 'Dell', priceRange: '1000-2000' }
        }
      });

      mockLLM.setResponse('laptop', {
        tool_calls: [{
          name: 'search_products',
          args: { 
            query: 'laptop',
            filters: { brand: 'Dell', minPrice: 1000, maxPrice: 2000 }
          }
        }]
      });

      const state = await runGraphWithInput(
        graph,
        'show me laptops',
        stateWithHistory
      );

      expect(mockSDK.unified.searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            brand: 'Dell'
          })
        })
      );
    });

    it('should predict next actions', async () => {
      // After search, should suggest viewing details or adding to cart
      mockLLM.setResponse('search', {
        tool_calls: [{
          name: 'search_products',
          args: { query: 'shoes' }
        }]
      });

      mockSDK.unified.searchProducts = jest.fn().mockResolvedValue({
        products: [{ id: 'prod-1', name: 'Running Shoes' }],
        total: 1
      });

      const state = await runGraphWithInput(
        graph,
        'find running shoes',
        createTestState()
      );

      expect(state.suggestedActions).toContain('get_product_details');
      expect(state.suggestedActions).toContain('add_to_cart');
    });
  });

  describe('Performance', () => {
    it('should complete simple queries under 250ms', async () => {
      mockLLM.setResponse('hello', {
        content: 'Hello! How can I help you shop today?'
      });

      const start = Date.now();
      await runGraphWithInput(graph, 'hello', createTestState());
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(250);
    });

    it('should handle concurrent operations efficiently', async () => {
      const promises = Array(5).fill(null).map((_, i) => 
        runGraphWithInput(
          graph,
          `search for product ${i}`,
          createTestState()
        )
      );

      const start = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(1000); // All 5 should complete within 1s
    });
  });

  describe('Tool Integration', () => {
    it('should pass correct context to tools', async () => {
      const mockTool = jest.fn().mockResolvedValue({ success: true });
      registry.register({
        id: 'test_tool',
        name: 'Test Tool',
        description: 'Test tool',
        category: 'test',
        parameters: {},
        execute: mockTool
      });

      mockLLM.setResponse('test', {
        tool_calls: [{
          name: 'test_tool',
          args: {}
        }]
      });

      const state = createTestState({
        mode: 'b2b',
        context: { customerId: 'cust-123' }
      });

      await runGraphWithInput(graph, 'test', state);

      expect(mockTool).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          state: expect.objectContaining({
            mode: 'b2b',
            context: expect.objectContaining({
              customerId: 'cust-123'
            })
          }),
          sdk: mockSDK
        })
      );
    });
  });
});