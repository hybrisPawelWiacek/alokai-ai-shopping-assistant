import type { CommerceState } from '../state';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * Predicted intent with confidence score
 */
export interface IntentPrediction {
  intent: string;
  confidence: number;
  suggestedActions: string[];
  reasoning: string;
}

/**
 * Action recommendation with context
 */
export interface ActionRecommendation {
  actionId: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  prerequisites?: string[];
}

/**
 * Predicts user intent and recommends appropriate actions
 */
export class IntentPredictor {
  /**
   * Intent transition patterns - what typically follows each intent
   */
  private static readonly INTENT_TRANSITIONS: Record<string, { nextIntents: string[], weight: number }[]> = {
    search: [
      { nextIntents: ['get_details', 'compare'], weight: 0.4 },
      { nextIntents: ['add_to_cart'], weight: 0.3 },
      { nextIntents: ['search'], weight: 0.2 }, // Refine search
      { nextIntents: ['ask_question'], weight: 0.1 }
    ],
    get_details: [
      { nextIntents: ['add_to_cart'], weight: 0.5 },
      { nextIntents: ['compare'], weight: 0.2 },
      { nextIntents: ['ask_question'], weight: 0.2 },
      { nextIntents: ['search'], weight: 0.1 }
    ],
    compare: [
      { nextIntents: ['add_to_cart'], weight: 0.6 },
      { nextIntents: ['get_details'], weight: 0.2 },
      { nextIntents: ['ask_question'], weight: 0.1 },
      { nextIntents: ['remove_from_comparison'], weight: 0.1 }
    ],
    add_to_cart: [
      { nextIntents: ['checkout'], weight: 0.4 },
      { nextIntents: ['search'], weight: 0.3 }, // Continue shopping
      { nextIntents: ['view_cart'], weight: 0.2 },
      { nextIntents: ['update_cart'], weight: 0.1 }
    ],
    checkout: [
      { nextIntents: ['confirm_order'], weight: 0.7 },
      { nextIntents: ['update_cart'], weight: 0.2 },
      { nextIntents: ['ask_question'], weight: 0.1 }
    ],
    ask_question: [
      { nextIntents: ['search', 'get_details'], weight: 0.4 },
      { nextIntents: ['add_to_cart'], weight: 0.3 },
      { nextIntents: ['ask_question'], weight: 0.3 } // Follow-up
    ]
  };

  /**
   * Context-based action triggers
   */
  private static readonly CONTEXT_TRIGGERS = {
    emptyCart: {
      condition: (state: CommerceState) => state.cart.items.length === 0,
      suggestedActions: ['search_products', 'view_categories', 'get_recommendations']
    },
    hasCart: {
      condition: (state: CommerceState) => state.cart.items.length > 0,
      suggestedActions: ['view_cart', 'checkout', 'continue_shopping']
    },
    highCartValue: {
      condition: (state: CommerceState) => (state.cart.total || 0) > 500,
      suggestedActions: ['apply_discount', 'checkout', 'save_for_later']
    },
    comparison: {
      condition: (state: CommerceState) => state.comparison.items.length >= 2,
      suggestedActions: ['view_comparison', 'add_best_to_cart', 'get_expert_advice']
    },
    b2bMode: {
      condition: (state: CommerceState) => state.mode === 'b2b',
      suggestedActions: ['get_bulk_quote', 'check_inventory', 'setup_recurring_order']
    }
  };

  /**
   * Predict the next likely intent based on conversation history
   */
  static predictNextIntent(state: CommerceState): IntentPrediction[] {
    const predictions: IntentPrediction[] = [];
    
    // Get recent intents from message history
    const recentIntents = state.messages
      .slice(-5)
      .filter(m => m.additional_kwargs?.detectedIntent)
      .map(m => m.additional_kwargs.detectedIntent as string);

    if (recentIntents.length === 0) {
      // No history - use context-based prediction
      return this.predictFromContext(state);
    }

    // Get the most recent intent
    const lastIntent = recentIntents[recentIntents.length - 1];
    const transitions = this.INTENT_TRANSITIONS[lastIntent] || [];

    // Calculate predictions based on transitions
    transitions.forEach(transition => {
      const confidence = this.calculateTransitionConfidence(
        transition,
        recentIntents,
        state
      );

      transition.nextIntents.forEach(nextIntent => {
        predictions.push({
          intent: nextIntent,
          confidence,
          suggestedActions: this.getActionsForIntent(nextIntent, state),
          reasoning: this.explainPrediction(lastIntent, nextIntent, state)
        });
      });
    });

    // Sort by confidence and return top predictions
    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Predict intent from context when no history available
   */
  private static predictFromContext(state: CommerceState): IntentPrediction[] {
    const predictions: IntentPrediction[] = [];

    // Check context triggers
    Object.entries(this.CONTEXT_TRIGGERS).forEach(([trigger, config]) => {
      if (config.condition(state)) {
        predictions.push({
          intent: 'contextual',
          confidence: 0.7,
          suggestedActions: config.suggestedActions,
          reasoning: `Based on ${trigger} context`
        });
      }
    });

    // Default predictions for new sessions
    if (predictions.length === 0) {
      predictions.push(
        {
          intent: 'search',
          confidence: 0.6,
          suggestedActions: ['search_products', 'browse_categories'],
          reasoning: 'New session typically starts with product discovery'
        },
        {
          intent: 'ask_question',
          confidence: 0.3,
          suggestedActions: ['get_help', 'chat_support'],
          reasoning: 'User might need assistance getting started'
        }
      );
    }

    return predictions;
  }

  /**
   * Calculate confidence for a specific transition
   */
  private static calculateTransitionConfidence(
    transition: { nextIntents: string[], weight: number },
    recentIntents: string[],
    state: CommerceState
  ): number {
    let confidence = transition.weight;

    // Boost confidence if pattern appears in history
    const pattern = recentIntents.slice(-2).join('->');
    if (recentIntents.length >= 2) {
      const historicalPatterns = this.extractPatterns(state.messages);
      const patternCount = historicalPatterns.filter(p => p === pattern).length;
      confidence += patternCount * 0.1;
    }

    // Adjust for context
    if (state.cart.items.length > 0 && transition.nextIntents.includes('checkout')) {
      confidence += 0.2;
    }

    if (state.comparison.items.length >= 2 && transition.nextIntents.includes('add_to_cart')) {
      confidence += 0.15;
    }

    // Mode adjustments
    if (state.mode === 'b2b') {
      if (transition.nextIntents.includes('get_details')) {
        confidence += 0.1; // B2B users research more
      }
      if (transition.nextIntents.includes('checkout')) {
        confidence -= 0.1; // B2B has longer cycles
      }
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * Extract intent patterns from message history
   */
  private static extractPatterns(messages: BaseMessage[]): string[] {
    const intents = messages
      .filter(m => m.additional_kwargs?.detectedIntent)
      .map(m => m.additional_kwargs.detectedIntent as string);

    const patterns: string[] = [];
    for (let i = 1; i < intents.length; i++) {
      patterns.push(`${intents[i-1]}->${intents[i]}`);
    }

    return patterns;
  }

  /**
   * Get relevant actions for a predicted intent
   */
  private static getActionsForIntent(intent: string, state: CommerceState): string[] {
    const actionMap: Record<string, string[]> = {
      search: ['search_products', 'filter_results', 'sort_results'],
      get_details: ['view_specifications', 'check_availability', 'see_reviews'],
      compare: ['add_to_comparison', 'view_comparison_table', 'get_recommendation'],
      add_to_cart: ['add_item', 'update_quantity', 'apply_coupon'],
      checkout: ['review_order', 'enter_shipping', 'select_payment'],
      ask_question: ['get_product_info', 'check_policies', 'contact_support']
    };

    const baseActions = actionMap[intent] || [];

    // Add mode-specific actions
    if (state.mode === 'b2b') {
      if (intent === 'add_to_cart') {
        baseActions.push('get_bulk_discount');
      }
      if (intent === 'checkout') {
        baseActions.push('generate_quote', 'setup_net_terms');
      }
    }

    return baseActions;
  }

  /**
   * Explain why a specific intent was predicted
   */
  private static explainPrediction(
    fromIntent: string,
    toIntent: string,
    state: CommerceState
  ): string {
    const explanations: Record<string, Record<string, string>> = {
      search: {
        get_details: 'Users typically want more information about products they find',
        compare: 'Comparing options is common after searching',
        add_to_cart: 'Direct purchase intent after finding the right product'
      },
      get_details: {
        add_to_cart: 'Detailed review often leads to purchase decision',
        compare: 'Users may want to compare after learning more',
        ask_question: 'Specific questions arise from product details'
      },
      compare: {
        add_to_cart: 'Comparison helps users make purchase decisions',
        get_details: 'Users may need more info on specific options',
        remove_from_comparison: 'Narrowing down choices'
      },
      add_to_cart: {
        checkout: 'Natural progression to complete purchase',
        search: 'Users often continue shopping after adding items',
        view_cart: 'Review selections before proceeding'
      }
    };

    const baseExplanation = explanations[fromIntent]?.[toIntent] || 
      `Common transition from ${fromIntent} to ${toIntent}`;

    // Add context-specific details
    const contextDetails: string[] = [];
    
    if (state.cart.items.length > 0) {
      contextDetails.push(`${state.cart.items.length} items in cart`);
    }
    
    if (state.mode === 'b2b') {
      contextDetails.push('B2B context influences decision flow');
    }

    return contextDetails.length > 0 
      ? `${baseExplanation} (${contextDetails.join(', ')})`
      : baseExplanation;
  }

  /**
   * Recommend specific actions based on current state
   */
  static recommendActions(state: CommerceState): ActionRecommendation[] {
    const recommendations: ActionRecommendation[] = [];
    const predictions = this.predictNextIntent(state);

    // Convert predictions to recommendations
    predictions.forEach(prediction => {
      prediction.suggestedActions.forEach((action, index) => {
        recommendations.push({
          actionId: action,
          priority: index === 0 ? 'high' : prediction.confidence > 0.7 ? 'medium' : 'low',
          reason: prediction.reasoning,
          prerequisites: this.getActionPrerequisites(action, state)
        });
      });
    });

    // Add context-based recommendations
    if (state.cart.items.length > 3 && state.mode === 'b2c') {
      recommendations.push({
        actionId: 'suggest_express_checkout',
        priority: 'medium',
        reason: 'Multiple items in cart - streamline purchase',
        prerequisites: []
      });
    }

    if (state.comparison.items.length === 1) {
      recommendations.push({
        actionId: 'find_similar_products',
        priority: 'high',
        reason: 'Only one item to compare - need alternatives',
        prerequisites: []
      });
    }

    // Abandonment prevention
    const sessionDuration = Date.now() - new Date(state.context.sessionId.split('-')[1] || Date.now()).getTime();
    if (sessionDuration > 20 * 60 * 1000 && state.cart.items.length > 0) {
      recommendations.push({
        actionId: 'offer_assistance',
        priority: 'high',
        reason: 'Long session with cart - prevent abandonment',
        prerequisites: []
      });
    }

    // Remove duplicates and sort by priority
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    return this.sortRecommendations(uniqueRecs);
  }

  /**
   * Get prerequisites for an action
   */
  private static getActionPrerequisites(action: string, state: CommerceState): string[] {
    const prerequisites: string[] = [];

    switch (action) {
      case 'checkout':
      case 'review_order':
        if (state.cart.items.length === 0) {
          prerequisites.push('add_items_to_cart');
        }
        break;

      case 'view_comparison_table':
        if (state.comparison.items.length < 2) {
          prerequisites.push('add_more_products_to_compare');
        }
        break;

      case 'apply_discount':
        if (!state.cart.couponCode) {
          prerequisites.push('have_valid_coupon_code');
        }
        break;

      case 'generate_quote':
        if (state.mode !== 'b2b') {
          prerequisites.push('switch_to_business_account');
        }
        break;
    }

    return prerequisites;
  }

  /**
   * Remove duplicate recommendations
   */
  private static deduplicateRecommendations(
    recommendations: ActionRecommendation[]
  ): ActionRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.actionId)) {
        return false;
      }
      seen.add(rec.actionId);
      return true;
    });
  }

  /**
   * Sort recommendations by priority
   */
  private static sortRecommendations(
    recommendations: ActionRecommendation[]
  ): ActionRecommendation[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }
}