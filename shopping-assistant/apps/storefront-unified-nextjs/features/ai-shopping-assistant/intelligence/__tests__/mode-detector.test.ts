import { describe, it, expect } from '@jest/globals';
import { ModeDetector } from '../mode-detector';
import { HumanMessage } from '@langchain/core/messages';
import type { CommerceState } from '../../state';

describe('ModeDetector', () => {
  describe('detectMode', () => {
    it('should detect B2B mode from quantity indicators', () => {
      const result = ModeDetector.detectMode('I need 500 units of laptops for my company');
      
      expect(result.mode).toBe('b2b');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.indicators).toContain('Quantity of 500 detected');
      expect(result.signals.quantitySignals).toBeGreaterThan(0);
    });

    it('should detect B2B mode from business language', () => {
      const result = ModeDetector.detectMode('Can you send me a purchase order for these items?');
      
      expect(result.mode).toBe('b2b');
      expect(result.indicators).toContain('Business terminology used');
      expect(result.signals.businessLanguageSignals).toBeGreaterThan(0);
    });

    it('should detect B2B mode from bulk pricing requests', () => {
      const result = ModeDetector.detectMode('What is the bulk pricing for orders over 100?');
      
      expect(result.mode).toBe('b2b');
      expect(result.indicators).toContain('Bulk pricing request');
      expect(result.signals.bulkPricingSignals).toBeGreaterThan(0);
    });

    it('should detect B2C mode from personal language', () => {
      const result = ModeDetector.detectMode('I need a laptop for my home office');
      
      expect(result.mode).toBe('b2c');
      expect(result.indicators).toContain('Personal context detected');
    });

    it('should detect B2C mode from small quantities', () => {
      const result = ModeDetector.detectMode('I want to buy one iPhone');
      
      expect(result.mode).toBe('b2c');
      expect(result.indicators).toContain('Small quantity mentioned');
    });

    it('should return unknown mode when no clear indicators', () => {
      const result = ModeDetector.detectMode('Show me products');
      
      expect(result.mode).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should use cart context for mode detection', () => {
      const state = {
        mode: 'unknown',
        cart: {
          items: Array(75).fill({ quantity: 1 }),
          total: 7500
        }
      } as Partial<CommerceState>;
      
      const result = ModeDetector.detectMode('Add more to my order', state as CommerceState);
      
      expect(result.mode).toBe('b2b');
      expect(result.indicators).toContain('Cart contains 75 items');
    });
  });

  describe('analyzeConversation', () => {
    it('should aggregate mode detection across multiple messages', () => {
      const messages = [
        new HumanMessage('Hello'),
        new HumanMessage('I need 200 laptops'),
        new HumanMessage('Can you provide bulk discount?'),
        new HumanMessage('We need them for our corporate offices')
      ];
      
      const result = ModeDetector.analyzeConversation(messages);
      
      expect(result.mode).toBe('b2b');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.signals.quantitySignals).toBeGreaterThan(0);
      expect(result.signals.bulkPricingSignals).toBeGreaterThan(0);
      expect(result.signals.businessLanguageSignals).toBeGreaterThan(0);
    });

    it('should weight recent messages more heavily', () => {
      const messages = [
        new HumanMessage('I need 1000 units'), // Old B2B signal
        new HumanMessage('Actually, I just need one for myself'), // Recent B2C signal
        new HumanMessage('For my personal use at home') // Recent B2C signal
      ];
      
      const result = ModeDetector.analyzeConversation(messages);
      
      expect(result.mode).toBe('b2c');
    });

    it('should handle empty conversation history', () => {
      const result = ModeDetector.analyzeConversation([]);
      
      expect(result.mode).toBe('unknown');
      expect(result.confidence).toBe(0);
    });
  });

  describe('getModeContext', () => {
    it('should return B2B context', () => {
      const context = ModeDetector.getModeContext('b2b');
      
      expect(context).toContain('business customer');
      expect(context).toContain('Bulk quantities');
      expect(context).toContain('Purchase orders');
    });

    it('should return B2C context', () => {
      const context = ModeDetector.getModeContext('b2c');
      
      expect(context).toContain('retail customer');
      expect(context).toContain('Personal preferences');
      expect(context).toContain('Home delivery');
    });

    it('should return unknown mode context', () => {
      const context = ModeDetector.getModeContext('unknown');
      
      expect(context).toContain('not yet determined');
      expect(context).toContain('Look for clues');
    });
  });
});