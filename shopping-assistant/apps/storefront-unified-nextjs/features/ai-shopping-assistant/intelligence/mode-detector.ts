import type { BaseMessage } from '@langchain/core/messages';
import type { CommerceState } from '../state';

/**
 * B2C/B2B mode detection result
 */
export interface ModeDetectionResult {
  mode: 'b2c' | 'b2b' | 'unknown';
  confidence: number;
  indicators: string[];
  signals: {
    quantitySignals: number;
    businessLanguageSignals: number;
    accountTypeSignals: number;
    bulkPricingSignals: number;
  };
}

/**
 * Detects whether the user is in B2C or B2B shopping mode
 * Uses pattern matching and signal analysis for accurate detection
 */
export class ModeDetector {
  // B2B indicators and patterns
  private static readonly B2B_PATTERNS = {
    // Quantity indicators
    quantities: /\b(\d+\s*(?:units?|pieces?|boxes?|cases?|pallets?|bulk|wholesale|dozen|gross))\b/i,
    largeNumbers: /\b([1-9]\d{2,})\s*(?:items?|products?|units?)?\b/i,
    
    // Business language
    businessTerms: /\b(company|business|organization|corporate|enterprise|firm|procurement|purchase order|po|quote|rfq|invoice|net \d+|terms|vendor|supplier|reseller|distributor|tax exempt|ein|vat|wholesale account)\b/i,
    
    // Bulk pricing requests
    bulkPricing: /\b(bulk\s*(?:pricing|discount|order)|volume\s*(?:pricing|discount)|tier(?:ed)?\s*pricing|quantity\s*(?:discount|break)|wholesale\s*price)\b/i,
    
    // Account references
    accountTypes: /\b(business\s*account|corporate\s*account|trade\s*account|wholesale\s*account|dealer|reseller|b2b)\b/i,
    
    // Shipping and logistics
    logistics: /\b(freight|pallet\s*shipping|ltl|full\s*truck|loading\s*dock|commercial\s*address)\b/i
  };

  // B2C indicators and patterns
  private static readonly B2C_PATTERNS = {
    // Personal language
    personalTerms: /\b(my|me|i|personal|home|family|gift|present)\b/i,
    
    // Small quantities
    smallQuantities: /\b(one|a|an|single|couple|few)\b/i,
    
    // Consumer shipping
    consumerShipping: /\b(home\s*delivery|residential|apartment|free\s*shipping)\b/i,
    
    // Consumer payment
    consumerPayment: /\b(credit\s*card|paypal|afterpay|klarna|personal\s*check)\b/i
  };

  /**
   * Analyzes a message to detect shopping mode
   */
  static detectMode(message: string, state?: CommerceState): ModeDetectionResult {
    const signals = {
      quantitySignals: 0,
      businessLanguageSignals: 0,
      accountTypeSignals: 0,
      bulkPricingSignals: 0
    };
    
    const indicators: string[] = [];
    let b2bScore = 0;
    let b2cScore = 0;

    // Check B2B patterns
    if (this.B2B_PATTERNS.quantities.test(message)) {
      b2bScore += 2;
      signals.quantitySignals++;
      indicators.push('Large quantity mentioned');
    }

    if (this.B2B_PATTERNS.largeNumbers.test(message)) {
      const match = message.match(this.B2B_PATTERNS.largeNumbers);
      if (match && parseInt(match[1]) >= 100) {
        b2bScore += 3;
        signals.quantitySignals++;
        indicators.push(`Quantity of ${match[1]} detected`);
      }
    }

    if (this.B2B_PATTERNS.businessTerms.test(message)) {
      b2bScore += 2;
      signals.businessLanguageSignals++;
      indicators.push('Business terminology used');
    }

    if (this.B2B_PATTERNS.bulkPricing.test(message)) {
      b2bScore += 3;
      signals.bulkPricingSignals++;
      indicators.push('Bulk pricing request');
    }

    if (this.B2B_PATTERNS.accountTypes.test(message)) {
      b2bScore += 3;
      signals.accountTypeSignals++;
      indicators.push('Business account reference');
    }

    if (this.B2B_PATTERNS.logistics.test(message)) {
      b2bScore += 2;
      indicators.push('Commercial logistics mentioned');
    }

    // Check B2C patterns
    if (this.B2C_PATTERNS.personalTerms.test(message)) {
      b2cScore += 2;
      indicators.push('Personal context detected');
    }

    if (this.B2C_PATTERNS.smallQuantities.test(message)) {
      b2cScore += 1;
      indicators.push('Small quantity mentioned');
    }

    if (this.B2C_PATTERNS.consumerShipping.test(message)) {
      b2cScore += 1;
      indicators.push('Residential shipping');
    }

    if (this.B2C_PATTERNS.consumerPayment.test(message)) {
      b2cScore += 1;
      indicators.push('Consumer payment method');
    }

    // Check historical context if available
    if (state) {
      if (state.mode === 'b2b') {
        b2bScore += 1;
        indicators.push('Previous B2B context');
      } else if (state.mode === 'b2c') {
        b2cScore += 1;
        indicators.push('Previous B2C context');
      }

      // Check cart for bulk quantities
      if (state.cart.items.length > 0) {
        const totalQuantity = state.cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        if (totalQuantity >= 50) {
          b2bScore += 2;
          signals.quantitySignals++;
          indicators.push(`Cart contains ${totalQuantity} items`);
        }
      }
    }

    // Calculate confidence and determine mode
    const totalScore = b2bScore + b2cScore;
    let mode: 'b2c' | 'b2b' | 'unknown' = 'unknown';
    let confidence = 0;

    if (totalScore === 0) {
      mode = 'unknown';
      confidence = 0;
    } else if (b2bScore > b2cScore) {
      mode = 'b2b';
      confidence = b2bScore / (b2bScore + b2cScore);
    } else if (b2cScore > b2bScore) {
      mode = 'b2c';
      confidence = b2cScore / (b2bScore + b2cScore);
    } else {
      // Tie - default to B2C unless strong B2B signals
      mode = signals.quantitySignals >= 2 || signals.bulkPricingSignals >= 1 ? 'b2b' : 'b2c';
      confidence = 0.5;
    }

    return {
      mode,
      confidence: Math.round(confidence * 100) / 100,
      indicators,
      signals
    };
  }

  /**
   * Analyzes conversation history for mode detection
   */
  static analyzeConversation(messages: BaseMessage[], currentState?: CommerceState): ModeDetectionResult {
    let aggregatedResult: ModeDetectionResult = {
      mode: 'unknown',
      confidence: 0,
      indicators: [],
      signals: {
        quantitySignals: 0,
        businessLanguageSignals: 0,
        accountTypeSignals: 0,
        bulkPricingSignals: 0
      }
    };

    // Analyze recent messages (last 5)
    const recentMessages = messages.slice(-5);
    const results: ModeDetectionResult[] = [];

    recentMessages.forEach(msg => {
      if (msg._getType() === 'human') {
        const result = this.detectMode(msg.content as string, currentState);
        results.push(result);
      }
    });

    if (results.length === 0) {
      return aggregatedResult;
    }

    // Aggregate results with recency weighting
    let weightedB2bScore = 0;
    let weightedB2cScore = 0;
    let totalWeight = 0;

    results.forEach((result, index) => {
      const weight = (index + 1) / results.length; // More recent = higher weight
      
      if (result.mode === 'b2b') {
        weightedB2bScore += result.confidence * weight;
      } else if (result.mode === 'b2c') {
        weightedB2cScore += result.confidence * weight;
      }
      
      totalWeight += weight;

      // Aggregate signals
      aggregatedResult.signals.quantitySignals += result.signals.quantitySignals;
      aggregatedResult.signals.businessLanguageSignals += result.signals.businessLanguageSignals;
      aggregatedResult.signals.accountTypeSignals += result.signals.accountTypeSignals;
      aggregatedResult.signals.bulkPricingSignals += result.signals.bulkPricingSignals;
    });

    // Combine indicators
    const allIndicators = new Set<string>();
    results.forEach(r => r.indicators.forEach(i => allIndicators.add(i)));
    aggregatedResult.indicators = Array.from(allIndicators);

    // Determine final mode
    if (totalWeight > 0) {
      const normalizedB2b = weightedB2bScore / totalWeight;
      const normalizedB2c = weightedB2cScore / totalWeight;

      if (normalizedB2b > normalizedB2c) {
        aggregatedResult.mode = 'b2b';
        aggregatedResult.confidence = normalizedB2b;
      } else if (normalizedB2c > normalizedB2b) {
        aggregatedResult.mode = 'b2c';
        aggregatedResult.confidence = normalizedB2c;
      } else {
        // Check signal strength for tie-breaking
        const strongB2bSignals = aggregatedResult.signals.quantitySignals >= 2 || 
                                aggregatedResult.signals.bulkPricingSignals >= 1 ||
                                aggregatedResult.signals.accountTypeSignals >= 1;
        
        aggregatedResult.mode = strongB2bSignals ? 'b2b' : 'b2c';
        aggregatedResult.confidence = 0.5;
      }
    }

    return aggregatedResult;
  }

  /**
   * Get mode-specific context for prompts
   */
  static getModeContext(mode: 'b2c' | 'b2b' | 'unknown'): string {
    switch (mode) {
      case 'b2b':
        return `You are assisting a business customer. Focus on:
- Bulk quantities and volume pricing
- Business account features and terms
- Purchase orders and invoicing
- Commercial shipping options
- Professional, efficient communication
- ROI and business value propositions`;

      case 'b2c':
        return `You are assisting a retail customer. Focus on:
- Individual product benefits and features  
- Personal preferences and needs
- Easy checkout and payment options
- Home delivery and tracking
- Friendly, helpful communication
- Value and satisfaction`;

      default:
        return `Shopping mode is not yet determined. Look for clues about whether this is a business or personal purchase to provide the most relevant assistance.`;
    }
  }
}