import { describe, it, expect } from '@jest/globals';
import { ContextEnricher } from '../context-enricher';
import { HumanMessage } from '@langchain/core/messages';
import type { CommerceState } from '../../state';
import { CommerceStateAnnotation } from '../../state';

describe('ContextEnricher', () => {
  const createMockState = (overrides: Partial<CommerceState> = {}): CommerceState => {
    const defaultState = CommerceStateAnnotation.spec.default();
    return {
      ...defaultState,
      ...overrides
    } as CommerceState;
  };

  describe('extractProductEntities', () => {
    it('should extract product categories', () => {
      const entities = ContextEnricher.extractProductEntities('I need a laptop and a monitor for work');
      
      expect(entities).toHaveLength(2);
      expect(entities[0].category).toBe('laptop');
      expect(entities[1].category).toBe('monitor');
    });

    it('should extract brands', () => {
      const entities = ContextEnricher.extractProductEntities('Looking for Apple laptop or Dell monitor');
      
      expect(entities).toHaveLength(2);
      expect(entities[0]).toMatchObject({ category: 'laptop', brand: 'Apple' });
      expect(entities[1]).toMatchObject({ category: 'monitor', brand: 'Dell' });
    });

    it('should extract price ranges', () => {
      const entities = ContextEnricher.extractProductEntities('Laptop under $1000');
      
      expect(entities[0].priceRange).toEqual({ max: 1000 });
    });

    it('should extract price ranges with min and max', () => {
      const entities = ContextEnricher.extractProductEntities('Phone between $500 and $800');
      
      expect(entities[0].priceRange).toEqual({ min: 500, max: 800 });
    });

    it('should extract attributes', () => {
      const entities = ContextEnricher.extractProductEntities('Black wireless headphones');
      
      expect(entities[0].attributes).toMatchObject({
        color: ['black'],
        features: ['wireless']
      });
    });

    it('should handle complex queries', () => {
      const entities = ContextEnricher.extractProductEntities(
        'I need 2 Dell laptops under $1500, preferably 15 inch with fast processors'
      );
      
      expect(entities[0]).toMatchObject({
        category: 'laptop',
        brand: 'Dell',
        priceRange: { max: 1500 },
        attributes: {
          size: ['15 inch'],
          features: ['fast']
        }
      });
    });
  });

  describe('analyzeShoppingBehavior', () => {
    it('should detect browsing pattern', () => {
      const state = createMockState({
        messages: [new HumanMessage('Show me laptops')],
        cart: { items: [], total: 0 },
        comparison: { items: [] }
      });
      
      const result = ContextEnricher.analyzeShoppingBehavior(state);
      
      expect(result.pattern).toBe('browsing');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect comparing pattern', () => {
      const state = createMockState({
        comparison: { items: ['prod1', 'prod2'] }
      });
      
      const result = ContextEnricher.analyzeShoppingBehavior(state);
      
      expect(result.pattern).toBe('comparing');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect ready to buy pattern', () => {
      const state = createMockState({
        cart: { items: [{ id: '1', quantity: 1 }], total: 100 },
        messages: [
          new HumanMessage('Add to cart'),
          new HumanMessage('Checkout', { detectedIntent: 'checkout' })
        ]
      });
      
      const result = ContextEnricher.analyzeShoppingBehavior(state);
      
      expect(result.pattern).toBe('ready_to_buy');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect researching pattern', () => {
      const state = createMockState({
        context: { viewedProducts: ['prod1', 'prod2'] }
      });
      
      const result = ContextEnricher.analyzeShoppingBehavior(state);
      
      expect(result.pattern).toBe('researching');
      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('calculateAbandonmentRisk', () => {
    it('should return low risk for fresh sessions', () => {
      const state = createMockState({
        context: { sessionId: `session-${Date.now()}` },
        cart: { items: [], total: 0 }
      });
      
      const risk = ContextEnricher.calculateAbandonmentRisk(state);
      
      expect(risk).toBe('low');
    });

    it('should return high risk for stale carts', () => {
      const state = createMockState({
        context: { sessionId: `session-${Date.now() - 45 * 60 * 1000}` }, // 45 min old
        cart: { 
          items: [{ id: '1', quantity: 1 }], 
          total: 600,
          lastModified: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 min old
        }
      });
      
      const risk = ContextEnricher.calculateAbandonmentRisk(state);
      
      expect(risk).toBe('high');
    });

    it('should return medium risk for moderate indicators', () => {
      const state = createMockState({
        context: { sessionId: `session-${Date.now() - 20 * 60 * 1000}` }, // 20 min old
        cart: { items: [{ id: '1', quantity: 1 }], total: 200 }
      });
      
      const risk = ContextEnricher.calculateAbandonmentRisk(state);
      
      expect(risk).toBe('medium');
    });
  });

  describe('enrichContext', () => {
    it('should provide comprehensive enrichment', () => {
      const state = createMockState({
        mode: 'b2c',
        messages: [new HumanMessage('I need a laptop under $1000')],
        cart: { items: [{ id: '1', quantity: 1 }], total: 500 },
        context: { sessionId: `session-${Date.now()}` }
      });
      
      const currentMessage = state.messages[0];
      const result = ContextEnricher.enrichContext(state, currentMessage);
      
      expect(result.enrichedContext.searchEntities).toBeDefined();
      expect(result.enrichedContext.searchEntities![0]).toMatchObject({
        category: 'laptop',
        priceRange: { max: 1000 }
      });
      expect(result.enrichedContext.shoppingPattern).toBe('browsing');
      expect(result.insights).toContain('Identified 1 product reference(s) in query');
      expect(result.metadata.cartValue).toBe(500);
      expect(result.metadata.abandonmentRisk).toBe('low');
    });

    it('should generate B2B specific enrichments', () => {
      const state = createMockState({
        mode: 'b2b',
        messages: [new HumanMessage('Bulk order inquiry')]
      });
      
      const result = ContextEnricher.enrichContext(state);
      
      expect(result.enrichedContext.b2bFeatures).toMatchObject({
        showBulkPricing: true,
        showNetTerms: true,
        showTaxExempt: true,
        minimumOrderQuantity: 10
      });
      expect(result.insights).toContain('B2B context activated');
    });

    it('should provide cart insights', () => {
      const state = createMockState({
        cart: {
          items: [
            { id: '1', quantity: 1, category: 'electronics', price: 300 },
            { id: '2', quantity: 1, category: 'electronics', price: 400 }
          ],
          total: 700
        }
      });
      
      const result = ContextEnricher.enrichContext(state);
      
      expect(result.insights).toContain('High-value items in cart');
      expect(result.enrichedContext.cartCategories).toEqual(['electronics']);
      expect(result.suggestions).toContain('Emphasize quality and warranty');
      expect(result.suggestions).toContain('Suggest complementary products');
    });

    it('should provide time-based insights', () => {
      // Mock business hours (10 AM)
      const originalHours = Date.prototype.getHours;
      Date.prototype.getHours = jest.fn(() => 10);
      
      const state = createMockState({});
      const result = ContextEnricher.enrichContext(state);
      
      expect(result.insights).toContain('Business hours - likely work-related purchase');
      
      // Restore
      Date.prototype.getHours = originalHours;
    });

    it('should handle abandonment prevention', () => {
      const state = createMockState({
        context: { sessionId: `session-${Date.now() - 45 * 60 * 1000}` },
        cart: { 
          items: [{ id: '1', quantity: 1 }], 
          total: 600,
          lastModified: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        }
      });
      
      const result = ContextEnricher.enrichContext(state);
      
      expect(result.insights).toContain('High abandonment risk detected');
      expect(result.enrichedContext.requiresIntervention).toBe(true);
      expect(result.suggestions).toContain('Proactively offer help');
      expect(result.suggestions).toContain('Mention free shipping threshold');
    });
  });

  describe('generateContextualPrompt', () => {
    it('should generate appropriate prompts', () => {
      const enrichment = {
        enrichedContext: {
          shoppingPattern: 'comparing' as const
        },
        insights: [],
        suggestions: ['Highlight key differences', 'Provide comparison table'],
        metadata: {
          sessionDuration: 10000,
          interactionCount: 5,
          cartValue: 200,
          abandonmentRisk: 'low' as const
        }
      };
      
      const prompt = ContextEnricher.generateContextualPrompt(enrichment, 'b2c');
      
      expect(prompt).toContain('The user is currently comparing');
      expect(prompt).toContain('Focus on personal benefits');
      expect(prompt).toContain('Consider: Highlight key differences, Provide comparison table');
    });

    it('should include abandonment risk in prompt', () => {
      const enrichment = {
        enrichedContext: {},
        insights: [],
        suggestions: [],
        metadata: {
          sessionDuration: 30000,
          interactionCount: 10,
          cartValue: 500,
          abandonmentRisk: 'high' as const
        }
      };
      
      const prompt = ContextEnricher.generateContextualPrompt(enrichment, 'b2c');
      
      expect(prompt).toContain('signs of cart abandonment');
      expect(prompt).toContain('Be proactive and helpful');
    });
  });
});