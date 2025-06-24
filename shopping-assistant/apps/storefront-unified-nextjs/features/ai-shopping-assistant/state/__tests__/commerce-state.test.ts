import { describe, it, expect } from '@jest/globals';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import {
  CommerceStateAnnotation,
  applyCommandsToState,
  createMessageCommand,
  isActionAvailable,
  getNodeAverageTime
} from '../commerce-state';
import type { StateUpdateCommand } from '../../types/action-definition';

describe('CommerceState', () => {
  describe('State Initialization', () => {
    it('should create initial state with defaults', () => {
      const initialState = CommerceStateAnnotation.spec.default();
      
      expect(initialState.mode).toBe('unknown');
      expect(initialState.messages).toEqual([]);
      expect(initialState.cart.items).toEqual([]);
      expect(initialState.context.locale).toBe('en-US');
      expect(initialState.context.currency).toBe('USD');
      expect(initialState.security.validationPassed).toBe(true);
      expect(initialState.performance.toolExecutionCount).toBe(0);
    });
  });
  
  describe('Message Handling', () => {
    it('should handle message updates through MessagesAnnotation', () => {
      const state = CommerceStateAnnotation.spec.default();
      const message = new HumanMessage('Find me a laptop');
      
      const updated = CommerceStateAnnotation.spec.applyUpdates(state, {
        messages: [message]
      });
      
      expect(updated.messages).toHaveLength(1);
      expect(updated.messages[0]).toBe(message);
    });
  });
  
  describe('Command Processing', () => {
    it('should apply ADD_MESSAGE commands', () => {
      const state = CommerceStateAnnotation.spec.default();
      const commands: StateUpdateCommand[] = [{
        type: 'ADD_MESSAGE',
        payload: new AIMessage('Found 5 laptops matching your criteria')
      }];
      
      const updates = applyCommandsToState(state, commands);
      expect(updates.messages).toHaveLength(1);
      expect(updates.messages?.[0].content).toBe('Found 5 laptops matching your criteria');
    });
    
    it('should apply UPDATE_CART commands', () => {
      const state = CommerceStateAnnotation.spec.default();
      const commands: StateUpdateCommand[] = [{
        type: 'UPDATE_CART',
        payload: {
          items: [{
            productId: 'laptop-123',
            quantity: 1,
            price: 999.99,
            name: 'Premium Laptop'
          }],
          subtotal: 999.99,
          total: 1099.99
        }
      }];
      
      const updates = applyCommandsToState(state, commands);
      expect(updates.cart?.items).toHaveLength(1);
      expect(updates.cart?.total).toBe(1099.99);
    });
    
    it('should apply UPDATE_CONTEXT commands', () => {
      const state = CommerceStateAnnotation.spec.default();
      const commands: StateUpdateCommand[] = [{
        type: 'UPDATE_CONTEXT',
        payload: {
          customerId: 'cust-123',
          lastSearch: {
            query: 'gaming laptop',
            resultCount: 10,
            timestamp: '2024-01-01T12:00:00Z'
          }
        }
      }];
      
      const updates = applyCommandsToState(state, commands);
      expect(updates.context?.customerId).toBe('cust-123');
      expect(updates.context?.lastSearch?.query).toBe('gaming laptop');
    });
    
    it('should apply SET_MODE commands', () => {
      const state = CommerceStateAnnotation.spec.default();
      const commands: StateUpdateCommand[] = [{
        type: 'SET_MODE',
        payload: { mode: 'b2b' }
      }];
      
      const updates = applyCommandsToState(state, commands);
      expect(updates.mode).toBe('b2b');
    });
    
    it('should apply multiple commands in sequence', () => {
      const state = CommerceStateAnnotation.spec.default();
      const commands: StateUpdateCommand[] = [
        {
          type: 'SET_MODE',
          payload: { mode: 'b2c' }
        },
        {
          type: 'UPDATE_CONTEXT',
          payload: { customerId: 'retail-123' }
        },
        {
          type: 'ADD_MESSAGE',
          payload: new HumanMessage('Show me products')
        }
      ];
      
      const updates = applyCommandsToState(state, commands);
      expect(updates.mode).toBe('b2c');
      expect(updates.context?.customerId).toBe('retail-123');
      expect(updates.messages).toHaveLength(1);
    });
  });
  
  describe('Helper Functions', () => {
    it('should create message commands', () => {
      const command = createMessageCommand('assistant', 'Here are your results', {
        productCount: 5
      });
      
      expect(command.type).toBe('ADD_MESSAGE');
      expect(command.payload.role).toBe('assistant');
      expect(command.payload.content).toBe('Here are your results');
      expect(command.payload.productCount).toBe(5);
    });
    
    it('should check action availability', () => {
      const state = CommerceStateAnnotation.spec.default();
      const updatedState = CommerceStateAnnotation.spec.applyUpdates(state, {
        availableActions: {
          suggested: ['search', 'compare'],
          enabled: ['search', 'addToCart'],
          disabled: ['checkout'],
          reasonsForDisabling: {
            checkout: 'Cart is empty'
          }
        }
      });
      
      expect(isActionAvailable(updatedState, 'search')).toBe(true);
      expect(isActionAvailable(updatedState, 'checkout')).toBe(false);
      expect(isActionAvailable(updatedState, 'compare')).toBe(false); // Not in enabled list
    });
    
    it('should calculate average node execution time', () => {
      const state = CommerceStateAnnotation.spec.default();
      const updatedState = CommerceStateAnnotation.spec.applyUpdates(state, {
        performance: {
          nodeExecutionTimes: {
            detectIntent: [100, 120, 110],
            enrichContext: [50, 60, 55]
          },
          totalExecutionTime: 0,
          toolExecutionCount: 0,
          cacheHits: 0,
          cacheMisses: 0
        }
      });
      
      expect(getNodeAverageTime(updatedState, 'detectIntent')).toBe(110);
      expect(getNodeAverageTime(updatedState, 'enrichContext')).toBe(55);
      expect(getNodeAverageTime(updatedState, 'nonExistent')).toBe(0);
    });
  });
  
  describe('Reducer Logic', () => {
    it('should merge context updates', () => {
      const state = CommerceStateAnnotation.spec.default();
      
      // First update
      let updated = CommerceStateAnnotation.spec.applyUpdates(state, {
        context: {
          customerId: 'cust-123'
        }
      });
      
      // Second update should merge, not replace
      updated = CommerceStateAnnotation.spec.applyUpdates(updated, {
        context: {
          lastSearch: {
            query: 'laptop',
            resultCount: 5,
            timestamp: '2024-01-01T12:00:00Z'
          }
        }
      });
      
      expect(updated.context.customerId).toBe('cust-123');
      expect(updated.context.lastSearch?.query).toBe('laptop');
      expect(updated.context.locale).toBe('en-US'); // Original default preserved
    });
    
    it('should accumulate performance metrics', () => {
      const state = CommerceStateAnnotation.spec.default();
      
      // First performance update
      let updated = CommerceStateAnnotation.spec.applyUpdates(state, {
        performance: {
          nodeExecutionTimes: { node1: [100] },
          toolExecutionCount: 1,
          cacheHits: 2,
          cacheMisses: 1,
          totalExecutionTime: 100
        }
      });
      
      // Second update should accumulate
      updated = CommerceStateAnnotation.spec.applyUpdates(updated, {
        performance: {
          nodeExecutionTimes: { node1: [120], node2: [50] },
          toolExecutionCount: 2,
          cacheHits: 3,
          cacheMisses: 0,
          totalExecutionTime: 200
        }
      });
      
      expect(updated.performance.nodeExecutionTimes.node1).toEqual([100, 120]);
      expect(updated.performance.nodeExecutionTimes.node2).toEqual([50]);
      expect(updated.performance.toolExecutionCount).toBe(3);
      expect(updated.performance.cacheHits).toBe(5);
      expect(updated.performance.cacheMisses).toBe(1);
    });
  });
});