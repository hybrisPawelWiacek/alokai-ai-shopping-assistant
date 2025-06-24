import type { RunnableConfig } from '@langchain/core/runnables';
import type { CommerceState, AvailableActions } from '../../state';
import type { StateUpdateCommand } from '../../types/action-definition';
import { applyCommandsToState, isActionAvailable } from '../../state';
import { ContextEnricher } from '../../intelligence';

/**
 * Enriches the conversation context with commerce-specific information
 * Determines available actions, checks permissions, and adds contextual data
 */
export async function enrichContextNode(
  state: CommerceState,
  config?: RunnableConfig
): Promise<Partial<CommerceState>> {
  const startTime = performance.now();
  
  try {
    // Use ContextEnricher for intelligent context analysis
    const lastMessage = state.messages[state.messages.length - 1];
    const enrichment = ContextEnricher.enrichContext(state, lastMessage);
    
    // Determine available actions based on current state
    const availableActions = determineAvailableActions(state);
    
    // Merge intelligent enrichments with business logic enrichments
    const contextEnrichments = {
      ...buildContextEnrichments(state),
      ...enrichment.enrichedContext,
      enrichmentInsights: enrichment.insights,
      actionSuggestions: enrichment.suggestions
    };
    
    // Check for security constraints
    const securityChecks = performSecurityChecks(state);
    
    // Create state update commands
    const commands: StateUpdateCommand[] = [
      {
        type: 'SET_AVAILABLE_ACTIONS',
        payload: availableActions
      },
      {
        type: 'UPDATE_CONTEXT',
        payload: contextEnrichments
      }
    ];
    
    // Add security updates if needed
    if (securityChecks.hasIssues) {
      commands.push({
        type: 'UPDATE_SECURITY',
        payload: {
          suspiciousPatterns: securityChecks.patterns,
          lastValidation: new Date().toISOString()
        }
      });
    }
    
    // Track performance
    commands.push({
      type: 'UPDATE_PERFORMANCE',
      payload: {
        nodeExecutionTimes: {
          enrichContext: [performance.now() - startTime]
        }
      }
    });
    
    return applyCommandsToState(state, commands);
  } catch (error) {
    const errorCommand: StateUpdateCommand = {
      type: 'SET_ERROR',
      payload: new Error(`Context enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    };
    
    return applyCommandsToState(state, [errorCommand]);
  }
}

/**
 * Determines which actions are available based on current state
 */
function determineAvailableActions(state: CommerceState): AvailableActions {
  const hasItemsInCart = state.cart.items.length > 0;
  const hasComparison = state.comparison.items.length > 0;
  const isB2B = state.mode === 'b2b';
  
  // Base actions always available
  const baseActions = ['search', 'get_product_details', 'ask_question'];
  
  // Conditional actions
  const conditionalActions: string[] = [];
  
  if (hasItemsInCart) {
    conditionalActions.push('checkout', 'update_cart', 'remove_from_cart');
  } else {
    conditionalActions.push('add_to_cart');
  }
  
  if (hasComparison) {
    conditionalActions.push('compare_products', 'clear_comparison');
  } else if (state.comparison.items.length < 4) {
    conditionalActions.push('add_to_comparison');
  }
  
  // B2B specific actions
  const b2bActions = isB2B ? [
    'search_bulk',
    'get_quote',
    'check_inventory',
    'apply_tax_exemption',
    'create_purchase_order'
  ] : [];
  
  // B2C specific actions  
  const b2cActions = !isB2B ? [
    'track_order',
    'save_for_later',
    'apply_coupon'
  ] : [];
  
  const enabled = [...baseActions, ...conditionalActions, ...b2bActions, ...b2cActions];
  
  // Determine disabled actions
  const disabled: string[] = [];
  const reasonsForDisabling: Record<string, string> = {};
  
  if (!hasItemsInCart) {
    disabled.push('checkout');
    reasonsForDisabling.checkout = 'Cart is empty';
  }
  
  if (state.comparison.items.length >= 4) {
    disabled.push('add_to_comparison');
    reasonsForDisabling.add_to_comparison = 'Maximum 4 items for comparison';
  }
  
  if (!state.context.customerId) {
    disabled.push('save_for_later', 'track_order');
    reasonsForDisabling.save_for_later = 'Login required';
    reasonsForDisabling.track_order = 'Login required';
  }
  
  // Suggested actions based on context - enhanced with enrichment suggestions
  const basicSuggestions = determineSuggestedActions(state);
  const enrichmentRecommendations = state.context.actionSuggestions || [];
  
  // Merge and prioritize suggestions
  const suggested = [...new Set([...basicSuggestions, ...enrichmentRecommendations])]
    .filter(action => enabled.includes(action))
    .slice(0, 5); // Limit to top 5 suggestions
  
  return {
    suggested,
    enabled: enabled.filter(action => !disabled.includes(action)),
    disabled,
    reasonsForDisabling
  };
}

/**
 * Determines suggested actions based on user behavior and context
 */
function determineSuggestedActions(state: CommerceState): string[] {
  const { detectedIntent } = state.context;
  const isB2B = state.mode === 'b2b';
  
  // Map intents to suggested actions
  const intentSuggestions: Record<string, string[]> = {
    search: isB2B ? ['search_bulk', 'get_quote'] : ['search', 'compare'],
    compare: ['add_to_comparison', 'compare_products'],
    add_to_cart: ['add_to_cart', 'checkout'],
    get_details: ['get_product_details', 'add_to_cart'],
    checkout: ['checkout', 'apply_coupon'],
    ask_question: ['ask_question', 'search']
  };
  
  return intentSuggestions[detectedIntent || 'search'] || ['search'];
}

/**
 * Builds contextual enrichments based on state
 */
function buildContextEnrichments(state: CommerceState): Record<string, any> {
  const enrichments: Record<string, any> = {
    sessionDuration: Date.now() - new Date(state.context.sessionId.split('-')[1]).getTime(),
    cartValue: state.cart.total || 0,
    itemCount: state.cart.items.length,
    comparisonCount: state.comparison.items.length
  };
  
  // Add user history if available
  if (state.context.orderHistory) {
    enrichments.isReturningCustomer = true;
    enrichments.previousOrderCount = state.context.orderHistory.length;
    
    // Mock: Calculate average order value
    // TODO: Replace with real order history analysis
    enrichments.averageOrderValue = 250.00;
    enrichments.preferredCategories = ['Electronics', 'Audio'];
    enrichments.lastOrderDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  // Add location-based data
  if (state.context.geoLocation) {
    enrichments.nearestWarehouse = determineNearestWarehouse(state.context.geoLocation);
    enrichments.localCurrency = state.context.currency;
    
    // Mock: Add shipping estimates based on warehouse
    // TODO: Replace with real shipping service
    enrichments.estimatedShipping = {
      standard: '3-5 business days',
      express: '1-2 business days',
      sameDay: enrichments.nearestWarehouse.includes('west') ? 'Available' : 'Not available'
    };
  }
  
  // Add B2B specific enrichments
  if (state.mode === 'b2b') {
    // Mock: Add B2B account information
    // TODO: Replace with real B2B account service
    enrichments.accountTier = 'Gold';
    enrichments.volumeDiscountEligible = true;
    enrichments.netPaymentTerms = 'NET30';
    enrichments.taxExemptStatus = false;
    
    // Mock: Recent bulk order patterns
    enrichments.recentBulkOrders = {
      lastBulkOrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      averageBulkQuantity: 250,
      preferredOrderDay: 'Monday'
    };
  }
  
  // Add personalization hints
  // TODO: Replace with real personalization service
  enrichments.personalizationHints = {
    priceRange: state.mode === 'b2b' ? 'volume_buyer' : 'value_conscious',
    brandAffinity: ['AudioTech Pro', 'TechBrand'],
    browsingPattern: 'research_oriented',
    decisionSpeed: 'deliberate'
  };
  
  return enrichments;
}

/**
 * Performs security checks on the current state
 */
function performSecurityChecks(state: CommerceState): { hasIssues: boolean; patterns: string[] } {
  const patterns: string[] = [];
  
  // Check for suspicious patterns in messages
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage && lastMessage._getType() === 'human') {
    const content = lastMessage.content as string;
    
    // Price manipulation attempts
    if (/price.*0|free|discount.*100|hack|exploit/i.test(content)) {
      patterns.push('potential_price_manipulation');
    }
    
    // SQL injection patterns
    if (/('|")\s*(or|and)\s*('|")|union\s+select|drop\s+table/i.test(content)) {
      patterns.push('sql_injection_attempt');
    }
    
    // Excessive quantity requests
    const quantities = content.match(/\d+/g)?.map(Number) || [];
    if (quantities.some(q => q > 10000)) {
      patterns.push('excessive_quantity_request');
    }
  }
  
  // Check rate limiting
  const recentMessages = state.messages.filter(msg => {
    const msgTime = new Date(msg.additional_kwargs?.timestamp || 0).getTime();
    return Date.now() - msgTime < 60000; // Last minute
  });
  
  if (recentMessages.length > 20) {
    patterns.push('rate_limit_warning');
  }
  
  return {
    hasIssues: patterns.length > 0,
    patterns
  };
}

/**
 * Mock function to determine nearest warehouse
 * TODO: Replace with real geo-location service integration using:
 * const warehouses = await sdk.customExtension.getWarehouseLocations();
 * return findNearestWarehouse(geoLocation, warehouses);
 */
function determineNearestWarehouse(geoLocation: any): string {
  // Mock implementation that simulates real warehouse selection
  // In production, this would call a warehouse service API
  
  if (!geoLocation) {
    return 'warehouse-default';
  }
  
  // Mock logic based on coordinates or region
  const mockWarehouses = [
    { id: 'warehouse-us-west-1', region: 'west', lat: 37.7749, lng: -122.4194 },
    { id: 'warehouse-us-east-1', region: 'east', lat: 40.7128, lng: -74.0060 },
    { id: 'warehouse-us-central-1', region: 'central', lat: 41.8781, lng: -87.6298 },
    { id: 'warehouse-eu-west-1', region: 'europe', lat: 51.5074, lng: -0.1278 }
  ];
  
  // Simple mock selection based on longitude
  if (geoLocation.lng < -100) {
    return 'warehouse-us-west-1';
  } else if (geoLocation.lng < -80) {
    return 'warehouse-us-central-1';
  } else if (geoLocation.lng < 0) {
    return 'warehouse-us-east-1';
  } else {
    return 'warehouse-eu-west-1';
  }
}