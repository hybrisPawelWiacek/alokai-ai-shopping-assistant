import { describe, it, expect } from '@jest/globals';
import { IntentPredictor } from '../intent-predictor';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import type { CommerceState } from '../../state';
import { CommerceStateAnnotation } from '../../state';

describe('IntentPredictor', () => {
  const createMockState = (overrides: Partial<CommerceState> = {}): CommerceState => {
    const defaultState = CommerceStateAnnotation.spec.default();
    return {
      ...defaultState,
      ...overrides
    } as CommerceState;
  };

  describe('predictNextIntent', () => {
    it('should predict get_details after search', () => {
      const state = createMockState({
        messages: [
          new HumanMessage('Show me laptops'),
          new AIMessage('Here are some laptops...', { detectedIntent: 'search' })
        ]
      });
      
      const predictions = IntentPredictor.predictNextIntent(state);
      
      expect(predictions).toHaveLength(3);
      expect(predictions[0].intent).toBe('get_details');
      expect(predictions[0].confidence).toBeGreaterThan(0.3);
      expect(predictions[0].reasoning).toContain('typically want more information');
    });

    it('should predict add_to_cart after compare', () => {
      const state = createMockState({
        messages: [
          new HumanMessage('Compare these laptops'),
          new AIMessage('Comparison results...', { detectedIntent: 'compare' })
        ],
        comparison: { items: ['prod1', 'prod2'] }
      });
      
      const predictions = IntentPredictor.predictNextIntent(state);
      
      expect(predictions[0].intent).toBe('add_to_cart');
      expect(predictions[0].confidence).toBeGreaterThan(0.5);
      expect(predictions[0].suggestedActions).toContain('add_item');
    });

    it('should predict checkout after add_to_cart', () => {
      const state = createMockState({
        messages: [
          new HumanMessage('Add this to cart'),
          new AIMessage('Added to cart', { detectedIntent: 'add_to_cart' })
        ],
        cart: { items: [{ id: '1', quantity: 1 }], total: 100 }
      });
      
      const predictions = IntentPredictor.predictNextIntent(state);
      
      expect(predictions[0].intent).toBe('checkout');
      expect(predictions[0].confidence).toBeGreaterThan(0.5);
    });

    it('should use context when no history available', () => {
      const state = createMockState({
        messages: [],
        cart: { items: [], total: 0 }
      });
      
      const predictions = IntentPredictor.predictNextIntent(state);
      
      expect(predictions[0].intent).toBe('search');
      expect(predictions[0].reasoning).toContain('New session');
    });

    it('should adjust predictions for B2B mode', () => {
      const state = createMockState({
        mode: 'b2b',
        messages: [
          new HumanMessage('Show products'),
          new AIMessage('Here are products...', { detectedIntent: 'search' })
        ]
      });
      
      const predictions = IntentPredictor.predictNextIntent(state);
      const detailsPrediction = predictions.find(p => p.intent === 'get_details');
      
      expect(detailsPrediction).toBeDefined();
      expect(detailsPrediction!.confidence).toBeGreaterThan(0.4); // B2B users research more
    });

    it('should recognize patterns in history', () => {
      const state = createMockState({
        messages: [
          new HumanMessage('Search 1'),
          new AIMessage('Results 1', { detectedIntent: 'search' }),
          new HumanMessage('Details 1'),
          new AIMessage('Product details 1', { detectedIntent: 'get_details' }),
          new HumanMessage('Search 2'),
          new AIMessage('Results 2', { detectedIntent: 'search' })
        ]
      });
      
      const predictions = IntentPredictor.predictNextIntent(state);
      
      // Should predict get_details based on pattern
      expect(predictions[0].intent).toBe('get_details');
      expect(predictions[0].confidence).toBeGreaterThan(0.5);
    });
  });

  describe('recommendActions', () => {
    it('should recommend actions based on predictions', () => {
      const state = createMockState({
        messages: [
          new HumanMessage('Show me products'),
          new AIMessage('Here are products...', { detectedIntent: 'search' })
        ]
      });
      
      const recommendations = IntentPredictor.recommendActions(state);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].actionId).toBeTruthy();
      expect(recommendations[0].reason).toBeTruthy();
    });

    it('should suggest express checkout for multiple items', () => {
      const state = createMockState({
        mode: 'b2c',
        cart: {
          items: [
            { id: '1', quantity: 1 },
            { id: '2', quantity: 1 },
            { id: '3', quantity: 1 },
            { id: '4', quantity: 1 }
          ],
          total: 400
        }
      });
      
      const recommendations = IntentPredictor.recommendActions(state);
      const expressCheckout = recommendations.find(r => r.actionId === 'suggest_express_checkout');
      
      expect(expressCheckout).toBeDefined();
      expect(expressCheckout!.priority).toBe('medium');
      expect(expressCheckout!.reason).toContain('streamline purchase');
    });

    it('should suggest finding similar products for single comparison', () => {
      const state = createMockState({
        comparison: { items: ['prod1'] }
      });
      
      const recommendations = IntentPredictor.recommendActions(state);
      const findSimilar = recommendations.find(r => r.actionId === 'find_similar_products');
      
      expect(findSimilar).toBeDefined();
      expect(findSimilar!.priority).toBe('high');
      expect(findSimilar!.reason).toContain('need alternatives');
    });

    it('should prevent abandonment for long sessions', () => {
      const state = createMockState({
        context: { sessionId: `session-${Date.now() - 25 * 60 * 1000}` }, // 25 min old
        cart: { items: [{ id: '1', quantity: 1 }], total: 100 }
      });
      
      const recommendations = IntentPredictor.recommendActions(state);
      const assistance = recommendations.find(r => r.actionId === 'offer_assistance');
      
      expect(assistance).toBeDefined();
      expect(assistance!.priority).toBe('high');
      expect(assistance!.reason).toContain('prevent abandonment');
    });

    it('should identify prerequisites', () => {
      const state = createMockState({
        cart: { items: [], total: 0 }
      });
      
      const recommendations = IntentPredictor.recommendActions(state);
      const checkout = recommendations.find(r => r.actionId === 'checkout');
      
      if (checkout) {
        expect(checkout.prerequisites).toContain('add_items_to_cart');
      }
    });

    it('should deduplicate recommendations', () => {
      const state = createMockState({
        messages: [
          new HumanMessage('Search'),
          new AIMessage('Results', { detectedIntent: 'search' })
        ]
      });
      
      const recommendations = IntentPredictor.recommendActions(state);
      const actionIds = recommendations.map(r => r.actionId);
      const uniqueIds = new Set(actionIds);
      
      expect(actionIds.length).toBe(uniqueIds.size);
    });

    it('should sort by priority', () => {
      const state = createMockState({
        messages: [
          new HumanMessage('Add to cart'),
          new AIMessage('Added', { detectedIntent: 'add_to_cart' })
        ],
        cart: { items: [{ id: '1', quantity: 1 }], total: 100 }
      });
      
      const recommendations = IntentPredictor.recommendActions(state);
      
      // High priority should come first
      const priorities = recommendations.map(r => r.priority);
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      
      for (let i = 1; i < priorities.length; i++) {
        expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i-1]]);
      }
    });

    it('should provide B2B specific recommendations', () => {
      const state = createMockState({
        mode: 'b2b',
        messages: [
          new HumanMessage('Add items'),
          new AIMessage('Added', { detectedIntent: 'add_to_cart' })
        ],
        cart: { items: [{ id: '1', quantity: 50 }], total: 5000 }
      });
      
      const recommendations = IntentPredictor.recommendActions(state);
      const suggestedActions = recommendations.flatMap(r => r.actionId);
      
      expect(suggestedActions).toContain('get_bulk_discount');
    });
  });
});