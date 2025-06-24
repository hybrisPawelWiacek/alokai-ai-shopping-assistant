import { CommerceToolRegistry } from '../core/tool-registry';
import { SchemaBuilder, type ParameterDescription } from '../core/schema-builder';
import type { ActionDefinition } from '../types/action-definition';

// Import action definitions
import searchActions from './search.json';
import cartActions from './cart.json';
import comparisonActions from './comparison.json';
import checkoutActions from './checkout.json';
import b2bActions from './b2b.json';

// Import implementations
import { searchProductsImplementation, getProductDetailsImplementation } from './implementations/search-implementation';
import { 
  addToCartImplementation, 
  updateCartItemImplementation, 
  removeFromCartImplementation, 
  getCartImplementation, 
  clearCartImplementation 
} from './implementations/cart-implementation';
import {
  compareProductsImplementation,
  addToComparisonImplementation,
  removeFromComparisonImplementation,
  getComparisonListImplementation,
  clearComparisonImplementation
} from './implementations/comparison-implementation';
import {
  checkoutImplementation,
  applyCouponImplementation,
  calculateShippingImplementation,
  createQuoteImplementation,
  createPurchaseOrderImplementation
} from './implementations/checkout-implementation';
import {
  requestBulkPricingImplementation,
  checkBulkAvailabilityImplementation,
  requestSampleImplementation,
  getAccountCreditImplementation,
  scheduleProductDemoImplementation,
  getTaxExemptionImplementation
} from './implementations/b2b-implementation';

/**
 * Converts JSON action definitions to properly typed ActionDefinition objects
 * with Zod schemas built from parameter descriptions
 */
function convertJsonToActionDefinition(
  jsonDef: any
): ActionDefinition {
  // Build Zod schema from parameter descriptions
  const parameters = SchemaBuilder.buildSchema(jsonDef.parameters || {});
  const returns = SchemaBuilder.buildSchema(jsonDef.returns?.properties || {});

  return {
    ...jsonDef,
    parameters,
    returns
  };
}

/**
 * Creates and configures the action registry with all available actions
 */
export function createActionRegistry(config?: {
  logger?: (entry: any) => void;
}): CommerceToolRegistry {
  const registry = new CommerceToolRegistry({
    enablePerformanceTracking: true,
    enableSecurityValidation: true,
    logger: config?.logger,
    onToolChange: (event) => {
      console.log(`Tool ${event.type}: ${event.toolId}`);
    }
  });

  // Register search actions
  registry.register(
    convertJsonToActionDefinition(searchActions.searchProducts),
    searchProductsImplementation
  );

  registry.register(
    convertJsonToActionDefinition(searchActions.getProductDetails),
    getProductDetailsImplementation
  );

  // Register cart actions
  registry.register(
    convertJsonToActionDefinition(cartActions.addToCart),
    addToCartImplementation
  );

  registry.register(
    convertJsonToActionDefinition(cartActions.updateCartItem),
    updateCartItemImplementation
  );

  registry.register(
    convertJsonToActionDefinition(cartActions.removeFromCart),
    removeFromCartImplementation
  );

  registry.register(
    convertJsonToActionDefinition(cartActions.getCart),
    getCartImplementation
  );

  registry.register(
    convertJsonToActionDefinition(cartActions.clearCart),
    clearCartImplementation
  );

  // Register comparison actions
  registry.register(
    convertJsonToActionDefinition(comparisonActions.compareProducts),
    compareProductsImplementation
  );

  registry.register(
    convertJsonToActionDefinition(comparisonActions.addToComparison),
    addToComparisonImplementation
  );

  registry.register(
    convertJsonToActionDefinition(comparisonActions.removeFromComparison),
    removeFromComparisonImplementation
  );

  registry.register(
    convertJsonToActionDefinition(comparisonActions.getComparisonList),
    getComparisonListImplementation
  );

  registry.register(
    convertJsonToActionDefinition(comparisonActions.clearComparison),
    clearComparisonImplementation
  );

  // Register checkout actions
  registry.register(
    convertJsonToActionDefinition(checkoutActions.checkout),
    checkoutImplementation
  );

  registry.register(
    convertJsonToActionDefinition(checkoutActions.applyCoupon),
    applyCouponImplementation
  );

  registry.register(
    convertJsonToActionDefinition(checkoutActions.calculateShipping),
    calculateShippingImplementation
  );

  registry.register(
    convertJsonToActionDefinition(checkoutActions.createQuote),
    createQuoteImplementation
  );

  registry.register(
    convertJsonToActionDefinition(checkoutActions.createPurchaseOrder),
    createPurchaseOrderImplementation
  );

  // Register B2B actions
  registry.register(
    convertJsonToActionDefinition(b2bActions.requestBulkPricing),
    requestBulkPricingImplementation
  );

  registry.register(
    convertJsonToActionDefinition(b2bActions.checkBulkAvailability),
    checkBulkAvailabilityImplementation
  );

  registry.register(
    convertJsonToActionDefinition(b2bActions.requestSample),
    requestSampleImplementation
  );

  registry.register(
    convertJsonToActionDefinition(b2bActions.getAccountCredit),
    getAccountCreditImplementation
  );

  registry.register(
    convertJsonToActionDefinition(b2bActions.scheduleProductDemo),
    scheduleProductDemoImplementation
  );

  registry.register(
    convertJsonToActionDefinition(b2bActions.getTaxExemption),
    getTaxExemptionImplementation
  );

  return registry;
}

/**
 * Example of dynamically loading actions from configuration
 */
export async function loadActionsFromConfig(
  configPath: string,
  registry: CommerceToolRegistry
): Promise<void> {
  // In a real implementation, this might load from a remote config service
  const config = await fetch(configPath).then(r => r.json());
  
  for (const [actionId, definition] of Object.entries(config)) {
    const actionDef = convertJsonToActionDefinition(definition);
    
    // Dynamically import implementation based on category
    const implementation = await import(`./implementations/${actionDef.category}-implementation`)
      .then(m => m[`${actionId}Implementation`]);
    
    if (implementation) {
      registry.register(actionDef, implementation);
    }
  }
}

/**
 * Get all available actions grouped by category
 */
export function getActionsByCategory(registry: CommerceToolRegistry): Record<string, ActionDefinition[]> {
  const definitions = registry.getDefinitions();
  const grouped: Record<string, ActionDefinition[]> = {};

  for (const def of definitions) {
    if (!grouped[def.category]) {
      grouped[def.category] = [];
    }
    grouped[def.category].push(def);
  }

  return grouped;
}

/**
 * Example usage
 */
export function exampleUsage() {
  // Create registry
  const registry = createActionRegistry({
    logger: (entry) => {
      console.log(`[${entry.level}] ${entry.message}`, entry.metadata);
    }
  });

  // Get tools for LangGraph
  const tools = registry.getTools();
  console.log(`Loaded ${tools.length} tools`);

  // Get tools for specific mode
  const b2bTools = registry.getToolsBy({ mode: 'b2b' });
  console.log(`B2B tools: ${b2bTools.length}`);

  // Update a tool at runtime
  registry.update('searchProducts', {
    definition: {
      rateLimit: {
        maxCalls: 50,
        windowMs: 60000
      }
    }
  });

  // Monitor performance
  const metrics = registry.getMetrics('searchProducts');
  console.log('Search performance:', metrics);

  return registry;
}