import { Tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { CommerceState } from '../state';
import type { StateUpdateCommand } from '../types/action-definition';
import { ConfigurationManager } from '../config/loader';
import type { ActionConfig } from '../config/types';

// Import existing implementations
import { 
  searchImplementation,
  searchBulkImplementation 
} from './implementations/search-implementation';
import { 
  getProductDetailsImplementation,
  addToComparisonImplementation,
  compareProductsImplementation,
  clearComparisonImplementation
} from './implementations/product-implementation';
import {
  addToCartImplementation,
  updateCartImplementation,
  removeFromCartImplementation,
  getCartImplementation
} from './implementations/cart-implementation';
import {
  checkoutImplementation,
  applyCouponImplementation,
  calculateShippingImplementation,
  createQuoteImplementation,
  createPurchaseOrderImplementation
} from './implementations/checkout-implementation';
import {
  getQuoteImplementation,
  checkInventoryImplementation,
  applyTaxExemptionImplementation
} from './implementations/b2b-implementation';
import {
  trackOrderImplementation,
  getOrderHistoryImplementation,
  saveForLaterImplementation
} from './implementations/customer-implementation';
import { askQuestionImplementation } from './implementations/support-implementation';

/**
 * Enhanced action registry that uses configuration system
 * Supports dynamic loading, validation, and mode-specific behavior
 */

// Map of implementation functions
const IMPLEMENTATION_MAP: Record<string, Function> = {
  // Search
  'search': searchImplementation,
  'search_bulk': searchBulkImplementation,
  
  // Products
  'get_product_details': getProductDetailsImplementation,
  'add_to_comparison': addToComparisonImplementation,
  'compare_products': compareProductsImplementation,
  'clear_comparison': clearComparisonImplementation,
  
  // Cart
  'add_to_cart': addToCartImplementation,
  'update_cart': updateCartImplementation,
  'remove_from_cart': removeFromCartImplementation,
  'get_cart': getCartImplementation,
  
  // Checkout
  'checkout': checkoutImplementation,
  'apply_coupon': applyCouponImplementation,
  'calculate_shipping': calculateShippingImplementation,
  'create_quote': createQuoteImplementation,
  'create_purchase_order': createPurchaseOrderImplementation,
  
  // B2B
  'get_quote': getQuoteImplementation,
  'check_inventory': checkInventoryImplementation,
  'apply_tax_exemption': applyTaxExemptionImplementation,
  
  // Customer
  'track_order': trackOrderImplementation,
  'get_order_history': getOrderHistoryImplementation,
  'save_for_later': saveForLaterImplementation,
  
  // Support
  'ask_question': askQuestionImplementation
};

/**
 * Create a Zod schema from parameter configuration
 */
function createZodSchema(parameters: ActionConfig['parameters']): z.ZodSchema {
  if (!parameters) {
    return z.object({});
  }
  
  const schemaObject: Record<string, z.ZodSchema> = {};
  
  for (const [key, param] of Object.entries(parameters)) {
    let schema: z.ZodSchema;
    
    switch (param.type) {
      case 'string':
        schema = z.string();
        if (param.enum) {
          schema = z.enum(param.enum as [string, ...string[]]);
        }
        if (param.pattern) {
          schema = (schema as z.ZodString).regex(new RegExp(param.pattern));
        }
        if (param.min !== undefined) {
          schema = (schema as z.ZodString).min(param.min);
        }
        if (param.max !== undefined) {
          schema = (schema as z.ZodString).max(param.max);
        }
        break;
        
      case 'number':
        schema = z.number();
        if (param.min !== undefined) {
          schema = (schema as z.ZodNumber).min(param.min);
        }
        if (param.max !== undefined) {
          schema = (schema as z.ZodNumber).max(param.max);
        }
        break;
        
      case 'boolean':
        schema = z.boolean();
        break;
        
      case 'array':
        schema = z.array(param.items ? createZodSchema({ item: param.items }).shape.item : z.any());
        break;
        
      case 'object':
        schema = param.properties ? createZodSchema(param.properties) : z.object({});
        break;
        
      default:
        schema = z.any();
    }
    
    if (!param.required) {
      schema = schema.optional();
    }
    
    if (param.default !== undefined) {
      schema = schema.default(param.default);
    }
    
    schemaObject[key] = schema;
  }
  
  return z.object(schemaObject);
}

/**
 * Create a tool from action configuration
 */
function createToolFromConfig(
  config: ActionConfig,
  state: CommerceState,
  configManager: ConfigurationManager
): Tool {
  const implementation = IMPLEMENTATION_MAP[config.id];
  if (!implementation) {
    throw new Error(`No implementation found for action: ${config.id}`);
  }
  
  // Create parameter schema
  const schema = createZodSchema(config.parameters);
  
  // Create the tool
  return new Tool({
    name: config.id,
    description: config.description,
    schema,
    func: async (params: unknown) => {
      // Check if action is enabled for current mode
      if (!configManager.isActionEnabled(config.id, state.mode)) {
        return [{
          type: 'SET_ERROR',
          payload: new Error(`Action ${config.id} is not available in ${state.mode} mode`)
        }];
      }
      
      // Apply security checks if configured
      if (config.security?.requiresAuth && !state.context.customerId) {
        return [{
          type: 'SET_ERROR',
          payload: new Error('Authentication required for this action')
        }];
      }
      
      // Apply rate limiting if configured
      if (config.security?.rateLimit) {
        // This would be implemented with a proper rate limiter
        // For now, just a placeholder
      }
      
      try {
        // Set timeout if configured
        const timeoutMs = config.performance?.timeoutMs || 30000;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        
        const result = await Promise.race([
          implementation(params, state),
          new Promise<StateUpdateCommand[]>((_, reject) => {
            controller.signal.addEventListener('abort', () => 
              reject(new Error(`Action ${config.id} timed out after ${timeoutMs}ms`))
            );
          })
        ]);
        
        clearTimeout(timeout);
        return result;
      } catch (error) {
        // Handle retries if configured
        const retries = config.performance?.retries || 0;
        if (retries > 0) {
          // Implement exponential backoff
          // This is a simplified version
          console.warn(`Retrying action ${config.id}...`);
          return implementation(params, state);
        }
        
        throw error;
      }
    }
  });
}

/**
 * Enhanced ActionRegistry with configuration support
 */
export class ActionRegistryV2 {
  private configManager: ConfigurationManager;
  private tools: Map<string, Tool> = new Map();
  private state: CommerceState;
  
  constructor(configManager: ConfigurationManager, state: CommerceState) {
    this.configManager = configManager;
    this.state = state;
  }
  
  async initialize(): Promise<void> {
    await this.configManager.initialize();
    this.buildTools();
    
    // Setup hot-reload listener
    const originalOnReload = this.configManager['options'].onReload;
    this.configManager['options'].onReload = (newConfig) => {
      console.log('🔄 Rebuilding tools from new configuration...');
      this.buildTools();
      if (originalOnReload) {
        originalOnReload(newConfig);
      }
    };
  }
  
  private buildTools(): void {
    this.tools.clear();
    
    const actions = this.configManager.getAllActions();
    for (const action of actions) {
      if (action.enabled) {
        try {
          const tool = createToolFromConfig(action, this.state, this.configManager);
          this.tools.set(action.id, tool);
        } catch (error) {
          console.error(`Failed to create tool for action ${action.id}:`, error);
        }
      }
    }
    
    console.log(`✅ Loaded ${this.tools.size} actions from configuration`);
  }
  
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  getTool(actionId: string): Tool | undefined {
    return this.tools.get(actionId);
  }
  
  getToolsForMode(mode: 'b2c' | 'b2b'): Tool[] {
    return Array.from(this.tools.entries())
      .filter(([id]) => this.configManager.isActionEnabled(id, mode))
      .map(([, tool]) => tool);
  }
  
  getToolsByCategory(category: string): Tool[] {
    const actions = this.configManager.getActionsByCategory(category);
    return actions
      .map(a => this.tools.get(a.id))
      .filter((tool): tool is Tool => tool !== undefined);
  }
  
  updateState(newState: CommerceState): void {
    this.state = newState;
    // Rebuild tools with new state
    this.buildTools();
  }
  
  destroy(): void {
    this.configManager.destroy();
    this.tools.clear();
  }
}

// Factory function for creating registry with default configuration
export async function createActionRegistry(
  state: CommerceState,
  configPath?: string
): Promise<ActionRegistryV2> {
  const configManager = new ConfigurationManager({
    configPath: configPath || 'config/ai-assistant-actions.json',
    environment: process.env.NODE_ENV as any,
    watch: process.env.NODE_ENV === 'development',
    cache: true
  });
  
  const registry = new ActionRegistryV2(configManager, state);
  await registry.initialize();
  
  return registry;
}