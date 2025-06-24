import type { BaseMessage } from '@langchain/core/messages';
import type { CommerceState, CommerceContext } from '../state';

/**
 * Context enrichment result
 */
export interface EnrichmentResult {
  enrichedContext: Partial<CommerceContext>;
  insights: string[];
  suggestions: string[];
  metadata: {
    sessionDuration: number;
    interactionCount: number;
    cartValue: number;
    abandonmentRisk: 'low' | 'medium' | 'high';
  };
}

/**
 * Product entity extracted from queries
 */
export interface ProductEntity {
  name?: string;
  category?: string;
  brand?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  attributes?: Record<string, any>;
}

/**
 * Enriches queries and conversation context with commerce-specific intelligence
 */
export class ContextEnricher {
  /**
   * Extract product entities from a message
   */
  static extractProductEntities(message: string): ProductEntity[] {
    const entities: ProductEntity[] = [];
    
    // Category patterns
    const categoryPatterns = [
      /\b(laptop|computer|phone|tablet|tv|television|camera|headphones?|speakers?|monitor|keyboard|mouse|printer|router|smart\s*watch|fitness\s*tracker)\b/gi,
      /\b(shirt|pants|jeans|dress|shoes|jacket|coat|sweater|hoodie|accessories|jewelry|watch|bag|backpack)\b/gi,
      /\b(furniture|chair|desk|table|sofa|couch|bed|mattress|lamp|shelf|cabinet|drawer)\b/gi,
      /\b(appliance|refrigerator|washer|dryer|dishwasher|microwave|oven|stove|vacuum|blender|coffee\s*maker)\b/gi
    ];

    // Brand patterns
    const brandPatterns = /\b(apple|samsung|sony|dell|hp|lenovo|asus|microsoft|google|amazon|nike|adidas|puma|levi'?s?|gucci|prada|ikea|west\s*elm|wayfair)\b/gi;

    // Price patterns
    const pricePatterns = [
      /under\s*\$?(\d+)/i,
      /below\s*\$?(\d+)/i,
      /less\s*than\s*\$?(\d+)/i,
      /\$?(\d+)\s*-\s*\$?(\d+)/,
      /between\s*\$?(\d+)\s*and\s*\$?(\d+)/i,
      /around\s*\$?(\d+)/i,
      /about\s*\$?(\d+)/i
    ];

    // Extract categories
    categoryPatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            category: match.toLowerCase()
          });
        });
      }
    });

    // Extract brands
    const brandMatches = message.match(brandPatterns);
    if (brandMatches) {
      brandMatches.forEach(brand => {
        // Find if this brand is associated with a category
        const associatedEntity = entities.find(e => 
          message.toLowerCase().includes(`${brand.toLowerCase()} ${e.category}`)
        );
        
        if (associatedEntity) {
          associatedEntity.brand = brand;
        } else {
          entities.push({ brand });
        }
      });
    }

    // Extract price ranges
    pricePatterns.forEach(pattern => {
      const match = message.match(pattern);
      if (match) {
        const priceRange: { min?: number; max?: number } = {};
        
        if (pattern.source.includes('under') || pattern.source.includes('below') || pattern.source.includes('less')) {
          priceRange.max = parseInt(match[1]);
        } else if (pattern.source.includes('around') || pattern.source.includes('about')) {
          priceRange.min = parseInt(match[1]) * 0.8;
          priceRange.max = parseInt(match[1]) * 1.2;
        } else if (match[2]) {
          priceRange.min = parseInt(match[1]);
          priceRange.max = parseInt(match[2]);
        }
        
        // Apply to most recent entity or create new one
        if (entities.length > 0) {
          entities[entities.length - 1].priceRange = priceRange;
        } else {
          entities.push({ priceRange });
        }
      }
    });

    // Extract attributes
    const attributePatterns = {
      color: /\b(red|blue|green|black|white|gray|grey|silver|gold|pink|purple|orange|yellow|brown)\b/gi,
      size: /\b(small|medium|large|xl|xxl|tiny|huge|compact|portable|\d+\s*inch|\d+"\s)/gi,
      condition: /\b(new|used|refurbished|open\s*box|like\s*new)\b/gi,
      features: /\b(wireless|bluetooth|waterproof|fast|quiet|energy\s*efficient|smart|eco\s*friendly|organic)\b/gi
    };

    Object.entries(attributePatterns).forEach(([key, pattern]) => {
      const matches = message.match(pattern);
      if (matches) {
        // Apply to most recent entity or create new one
        if (entities.length > 0) {
          if (!entities[entities.length - 1].attributes) {
            entities[entities.length - 1].attributes = {};
          }
          entities[entities.length - 1].attributes![key] = matches.map(m => m.toLowerCase());
        }
      }
    });

    return entities;
  }

  /**
   * Analyze shopping behavior patterns
   */
  static analyzeShoppingBehavior(state: CommerceState): {
    pattern: 'browsing' | 'comparing' | 'ready_to_buy' | 'researching';
    confidence: number;
  } {
    const messageCount = state.messages.length;
    const cartItemCount = state.cart.items.length;
    const comparisonCount = state.comparison.items.length;
    const hasViewedDetails = state.context.viewedProducts?.length > 0;
    
    // Analyze recent intents
    const recentIntents = state.messages
      .slice(-5)
      .map(m => m.additional_kwargs?.detectedIntent)
      .filter(Boolean);

    if (cartItemCount > 0 && recentIntents.includes('checkout')) {
      return { pattern: 'ready_to_buy', confidence: 0.9 };
    }

    if (comparisonCount >= 2) {
      return { pattern: 'comparing', confidence: 0.85 };
    }

    if (hasViewedDetails || recentIntents.includes('get_details')) {
      return { pattern: 'researching', confidence: 0.7 };
    }

    return { pattern: 'browsing', confidence: 0.6 };
  }

  /**
   * Calculate abandonment risk based on session patterns
   */
  static calculateAbandonmentRisk(state: CommerceState): 'low' | 'medium' | 'high' {
    const sessionDuration = Date.now() - new Date(state.context.sessionId.split('-')[1] || Date.now()).getTime();
    const cartValue = state.cart.total || 0;
    const cartAge = state.cart.lastModified ? Date.now() - new Date(state.cart.lastModified).getTime() : 0;
    
    // High risk indicators
    const longSession = sessionDuration > 30 * 60 * 1000; // > 30 minutes
    const highCartValue = cartValue > 500;
    const staleCart = cartAge > 10 * 60 * 1000; // > 10 minutes since last cart update
    const noRecentActivity = state.messages.length > 0 && 
      (Date.now() - new Date(state.messages[state.messages.length - 1].additional_kwargs?.timestamp || Date.now()).getTime()) > 5 * 60 * 1000;

    const riskScore = 
      (longSession ? 1 : 0) +
      (highCartValue ? 1 : 0) +
      (staleCart ? 2 : 0) +
      (noRecentActivity ? 2 : 0);

    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Enrich the current context with commerce intelligence
   */
  static enrichContext(state: CommerceState, currentMessage?: BaseMessage): EnrichmentResult {
    const insights: string[] = [];
    const suggestions: string[] = [];
    const enrichedContext: Partial<CommerceContext> = {};

    // Extract entities from current message
    if (currentMessage && currentMessage._getType() === 'human') {
      const entities = this.extractProductEntities(currentMessage.content as string);
      if (entities.length > 0) {
        enrichedContext.searchEntities = entities;
        insights.push(`Identified ${entities.length} product reference(s) in query`);
      }
    }

    // Analyze shopping behavior
    const behavior = this.analyzeShoppingBehavior(state);
    enrichedContext.shoppingPattern = behavior.pattern;
    insights.push(`User is in ${behavior.pattern} mode (${Math.round(behavior.confidence * 100)}% confidence)`);

    // Session metadata
    const sessionStart = new Date(state.context.sessionId.split('-')[1] || Date.now());
    const sessionDuration = Date.now() - sessionStart.getTime();
    const interactionCount = state.messages.filter(m => m._getType() === 'human').length;
    const cartValue = state.cart.total || 0;
    const abandonmentRisk = this.calculateAbandonmentRisk(state);

    // Generate contextual suggestions based on behavior
    switch (behavior.pattern) {
      case 'browsing':
        suggestions.push('Help narrow down product search');
        suggestions.push('Suggest popular categories');
        if (state.mode === 'b2b') {
          suggestions.push('Mention bulk pricing options');
        }
        break;

      case 'comparing':
        suggestions.push('Highlight key differences');
        suggestions.push('Provide comparison table');
        suggestions.push('Recommend based on needs');
        break;

      case 'researching':
        suggestions.push('Provide detailed specifications');
        suggestions.push('Share customer reviews');
        suggestions.push('Mention warranty/support');
        break;

      case 'ready_to_buy':
        suggestions.push('Streamline checkout');
        suggestions.push('Mention shipping options');
        if (abandonmentRisk === 'high') {
          suggestions.push('Offer assistance or incentive');
        }
        break;
    }

    // Add abandonment prevention suggestions
    if (abandonmentRisk === 'high') {
      insights.push('High abandonment risk detected');
      enrichedContext.requiresIntervention = true;
      suggestions.push('Proactively offer help');
      if (cartValue > 100) {
        suggestions.push('Mention free shipping threshold');
      }
    }

    // Mode-specific enrichments
    if (state.mode === 'b2b') {
      enrichedContext.b2bFeatures = {
        showBulkPricing: true,
        showNetTerms: true,
        showTaxExempt: true,
        minimumOrderQuantity: 10
      };
      insights.push('B2B context activated');
    }

    // Cart insights
    if (state.cart.items.length > 0) {
      const avgItemValue = cartValue / state.cart.items.length;
      if (avgItemValue > 200) {
        insights.push('High-value items in cart');
        suggestions.push('Emphasize quality and warranty');
      }
      
      // Check for complementary products
      const categories = state.cart.items
        .map(item => item.category)
        .filter(Boolean);
      
      if (categories.length > 0) {
        enrichedContext.cartCategories = [...new Set(categories)];
        suggestions.push('Suggest complementary products');
      }
    }

    // Time-based insights
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      insights.push('Business hours - likely work-related purchase');
    } else if (hour >= 20 || hour <= 6) {
      insights.push('After hours - likely personal shopping');
    }

    return {
      enrichedContext,
      insights,
      suggestions,
      metadata: {
        sessionDuration,
        interactionCount,
        cartValue,
        abandonmentRisk
      }
    };
  }

  /**
   * Generate contextual prompts for the AI
   */
  static generateContextualPrompt(enrichment: EnrichmentResult, mode: 'b2c' | 'b2b'): string {
    const parts: string[] = [];

    // Add behavior context
    if (enrichment.enrichedContext.shoppingPattern) {
      parts.push(`The user is currently ${enrichment.enrichedContext.shoppingPattern}.`);
    }

    // Add risk context
    if (enrichment.metadata.abandonmentRisk === 'high') {
      parts.push('The user shows signs of cart abandonment. Be proactive and helpful.');
    }

    // Add mode-specific guidance
    if (mode === 'b2b') {
      parts.push('Focus on business value, efficiency, and bulk capabilities.');
    } else {
      parts.push('Focus on personal benefits, ease of use, and customer satisfaction.');
    }

    // Add suggestions
    if (enrichment.suggestions.length > 0) {
      parts.push(`Consider: ${enrichment.suggestions.join(', ')}`);
    }

    return parts.join(' ');
  }
}