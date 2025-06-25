import { Annotation, MessagesAnnotation } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';
import type { StateUpdateCommand } from '../types/action-definition';

/**
 * Commerce-specific context for the assistant
 */
export interface CommerceContext {
  locale: string;
  currency: string;
  customerId?: string;
  sessionId: string;
  correlationId?: string; // For request tracking across all operations
  sdk?: any; // Will be typed with actual SDK interface
  lastSearch?: {
    query: string;
    resultCount: number;
    timestamp: string;
  };
  lastViewedProducts?: Array<{
    id: string;
    timestamp: string;
  }>;
  detectedIntent?: string;
  intentConfidence?: number;
  enrichmentInsights?: string[];
  actionSuggestions?: string[];
  searchEntities?: Array<{
    category?: string;
    brand?: string;
    priceRange?: { min?: number; max?: number };
    attributes?: Record<string, string[]>;
  }>;
  shoppingPattern?: 'browsing' | 'comparing' | 'ready_to_buy' | 'researching';
  abandonmentRisk?: 'low' | 'medium' | 'high';
  b2bFeatures?: {
    showBulkPricing: boolean;
    showNetTerms: boolean;
    showTaxExempt: boolean;
    minimumOrderQuantity: number;
  };
  cartCategories?: string[];
  requiresIntervention?: boolean;
  viewedProducts?: string[];
  orderHistory?: Array<{
    id: string;
    date: string;
    total: number;
  }>;
  geoLocation?: {
    country: string;
    region: string;
  };
}

/**
 * Shopping cart state
 */
export interface CartState {
  items: Array<{
    id: string;
    productId?: string;
    variantId?: string;
    quantity: number;
    price?: number;
    name?: string;
    category?: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  appliedCoupons: string[];
  lastUpdated: string;
  lastModified?: string;
}

/**
 * Product comparison state
 */
export interface ComparisonState {
  items: string[]; // Changed from productIds for consistency
  attributes: string[];
  lastComparison?: {
    timestamp: string;
    recommendation?: string;
  };
}

/**
 * Security context for tracking and validation
 */
export interface SecurityContext {
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  detectedPatterns: string[];
  validationHistory: Array<{
    isValid: boolean;
    category: string;
    severity: string;
    timestamp: string;
  }>;
  blockedAttempts: number;
  lastValidation?: Date;
  trustScore: number; // 0-100
  rateLimitStatus: Record<string, {
    count: number;
    resetAt: number;
  }>;
  permissions: string[];
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  nodeExecutionTimes: Record<string, number[]>;
  totalExecutionTime: number;
  toolExecutionCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate?: number;
  lastUpdated?: string;
}

/**
 * Available actions based on current context
 */
export interface AvailableActions {
  suggested: string[];
  enabled: string[];
  disabled: string[];
  reasonsForDisabling: Record<string, string>;
}

/**
 * Commerce Assistant State using LangGraph Annotation pattern
 */
export const CommerceStateAnnotation = Annotation.Root({
  // Use MessagesAnnotation.spec for message handling
  messages: MessagesAnnotation.spec,
  
  // Shopping mode
  mode: Annotation<'b2c' | 'b2b' | 'unknown'>({
    reducer: (current, update) => update || current || 'unknown',
    default: () => 'unknown'
  }),
  
  // Commerce context
  context: Annotation<CommerceContext>({
    reducer: (current, update) => ({
      ...current,
      ...update
    }),
    default: () => ({
      locale: 'en-US',
      currency: 'USD',
      sessionId: `session-${Date.now()}`
    })
  }),
  
  // Cart state
  cart: Annotation<CartState>({
    reducer: (current, update) => ({
      ...current,
      ...update,
      lastUpdated: new Date().toISOString()
    }),
    default: () => ({
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      appliedCoupons: [],
      lastUpdated: new Date().toISOString()
    })
  }),
  
  // Comparison state
  comparison: Annotation<ComparisonState>({
    reducer: (current, update) => ({
      ...current,
      ...update
    }),
    default: () => ({
      items: [],
      attributes: []
    })
  }),
  
  // Security context
  security: Annotation<SecurityContext>({
    reducer: (current, update) => ({
      ...current,
      ...update,
      lastValidation: new Date()
    }),
    default: () => ({
      threatLevel: 'none',
      detectedPatterns: [],
      validationHistory: [],
      blockedAttempts: 0,
      trustScore: 100,
      rateLimitStatus: {},
      permissions: []
    })
  }),
  
  // Performance metrics
  performance: Annotation<PerformanceMetrics>({
    reducer: (current, update) => {
      const merged = { ...current };
      
      // Merge node execution times
      if (update.nodeExecutionTimes) {
        for (const [node, times] of Object.entries(update.nodeExecutionTimes)) {
          if (!merged.nodeExecutionTimes[node]) {
            merged.nodeExecutionTimes[node] = [];
          }
          merged.nodeExecutionTimes[node].push(...times);
        }
      }
      
      // Update other metrics
      return {
        ...merged,
        totalExecutionTime: update.totalExecutionTime || merged.totalExecutionTime,
        toolExecutionCount: (merged.toolExecutionCount || 0) + (update.toolExecutionCount || 0),
        cacheHits: (merged.cacheHits || 0) + (update.cacheHits || 0),
        cacheMisses: (merged.cacheMisses || 0) + (update.cacheMisses || 0)
      };
    },
    default: () => ({
      nodeExecutionTimes: {},
      totalExecutionTime: 0,
      toolExecutionCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    })
  }),
  
  // Available actions
  availableActions: Annotation<AvailableActions>({
    reducer: (current, update) => ({
      ...current,
      ...update
    }),
    default: () => ({
      suggested: [],
      enabled: [],
      disabled: [],
      reasonsForDisabling: {}
    })
  }),
  
  // Track last action for context
  lastAction: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null
  }),
  
  // Error state for handling failures
  error: Annotation<Error | null>({
    reducer: (_, update) => update,
    default: () => null
  })
});

/**
 * Type for the commerce state
 */
export type CommerceState = typeof CommerceStateAnnotation.State;

/**
 * Type for state updates
 */
export type CommerceStateUpdate = typeof CommerceStateAnnotation.Update;

/**
 * Reducer to handle StateUpdateCommand objects from tools
 */
export function applyCommandsToState(
  state: CommerceState,
  commands: StateUpdateCommand[]
): Partial<CommerceStateUpdate> {
  const update: Partial<CommerceStateUpdate> = {};
  
  for (const command of commands) {
    switch (command.type) {
      case 'ADD_MESSAGE':
        if (!update.messages) {
          update.messages = [];
        }
        // Messages will be properly typed BaseMessage objects
        update.messages.push(command.payload as BaseMessage);
        break;
        
      case 'UPDATE_CART':
        update.cart = {
          ...state.cart,
          ...command.payload
        };
        break;
        
      case 'UPDATE_CONTEXT':
        update.context = {
          ...state.context,
          ...command.payload
        };
        break;
        
      case 'UPDATE_COMPARISON':
        update.comparison = {
          ...state.comparison,
          ...command.payload
        };
        break;
        
      case 'UPDATE_SECURITY':
        update.security = {
          ...state.security,
          ...command.payload
        };
        break;
        
      case 'UPDATE_PERFORMANCE':
        update.performance = command.payload;
        break;
        
      case 'SET_MODE':
        update.mode = command.payload.mode;
        break;
        
      case 'SET_AVAILABLE_ACTIONS':
        update.availableActions = command.payload;
        break;
        
      case 'SET_ERROR':
        update.error = command.payload;
        break;
        
      case 'SET_LAST_ACTION':
        update.lastAction = command.payload;
        break;
        
      default:
        console.warn(`Unknown command type: ${(command as any).type}`);
    }
  }
  
  return update;
}

/**
 * Helper to create a message command
 */
export function createMessageCommand(
  role: 'assistant' | 'user' | 'system',
  content: string,
  metadata?: Record<string, unknown>
): StateUpdateCommand {
  return {
    type: 'ADD_MESSAGE',
    payload: {
      role,
      content,
      ...metadata
    }
  };
}

/**
 * Helper to check if action is available
 */
export function isActionAvailable(
  state: CommerceState,
  actionId: string
): boolean {
  return state.availableActions.enabled.includes(actionId) &&
         !state.availableActions.disabled.includes(actionId);
}

/**
 * Helper to get average execution time for a node
 */
export function getNodeAverageTime(
  state: CommerceState,
  nodeName: string
): number {
  const times = state.performance.nodeExecutionTimes[nodeName] || [];
  if (times.length === 0) return 0;
  
  return times.reduce((sum, time) => sum + time, 0) / times.length;
}