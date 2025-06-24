/**
 * Recovery strategies and patterns for error handling
 * Implements advanced recovery mechanisms
 */

import { traced } from '../observability/telemetry';
import { Loggers } from '../observability/logger';
import { metrics } from '../observability/metrics';
import {
  AIAssistantError,
  RecoveryStrategy,
  ErrorCategory,
  ErrorSeverity,
  type Result,
  ok,
  err
} from './types';
import type { CommerceState } from '../state';

/**
 * Recovery context for maintaining state during recovery
 */
export interface RecoveryContext {
  attemptNumber: number;
  totalAttempts: number;
  startTime: Date;
  lastAttemptTime: Date;
  errors: AIAssistantError[];
  metadata: Record<string, any>;
}

/**
 * Recovery policy configuration
 */
export interface RecoveryPolicy {
  strategy: RecoveryStrategy;
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  timeout?: number;
  fallbackValue?: any;
  compensationHandler?: (error: AIAssistantError, state: CommerceState) => Promise<void>;
  shouldRetry?: (error: AIAssistantError, context: RecoveryContext) => boolean;
  onRetry?: (error: AIAssistantError, context: RecoveryContext) => void;
}

/**
 * Recovery manager for coordinating recovery strategies
 */
export class RecoveryManager {
  private defaultPolicies: Map<ErrorCategory, RecoveryPolicy>;
  
  constructor() {
    this.defaultPolicies = this.initializeDefaultPolicies();
  }
  
  /**
   * Initialize default recovery policies by error category
   */
  private initializeDefaultPolicies(): Map<ErrorCategory, RecoveryPolicy> {
    return new Map([
      [ErrorCategory.NETWORK, {
        strategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
        maxAttempts: 5,
        delayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000,
        shouldRetry: (error, context) => context.attemptNumber < 5
      }],
      
      [ErrorCategory.TIMEOUT, {
        strategy: RecoveryStrategy.RETRY,
        maxAttempts: 3,
        delayMs: 2000,
        timeout: 60000
      }],
      
      [ErrorCategory.RATE_LIMIT, {
        strategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
        maxAttempts: 3,
        delayMs: 5000,
        backoffMultiplier: 3,
        maxDelayMs: 60000
      }],
      
      [ErrorCategory.UDL, {
        strategy: RecoveryStrategy.CIRCUIT_BREAK,
        maxAttempts: 3,
        delayMs: 1000
      }],
      
      [ErrorCategory.MODEL, {
        strategy: RecoveryStrategy.FALLBACK,
        maxAttempts: 2,
        fallbackValue: { response: 'I apologize, but I'm having trouble processing your request. Please try again.' }
      }],
      
      [ErrorCategory.BUSINESS_RULE, {
        strategy: RecoveryStrategy.NONE,
        maxAttempts: 1
      }],
      
      [ErrorCategory.VALIDATION, {
        strategy: RecoveryStrategy.USER_INTERVENTION,
        maxAttempts: 1
      }]
    ]);
  }
  
  /**
   * Execute operation with recovery
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    error: AIAssistantError,
    customPolicy?: RecoveryPolicy
  ): Promise<Result<T>> {
    const policy = customPolicy || this.defaultPolicies.get(error.category) || {
      strategy: error.recoveryStrategy,
      maxAttempts: 1
    };
    
    const context: RecoveryContext = {
      attemptNumber: 0,
      totalAttempts: policy.maxAttempts || 1,
      startTime: new Date(),
      lastAttemptTime: new Date(),
      errors: [],
      metadata: {}
    };
    
    return this.applyRecoveryPolicy(operation, policy, context, error);
  }
  
  /**
   * Apply recovery policy
   */
  private async applyRecoveryPolicy<T>(
    operation: () => Promise<T>,
    policy: RecoveryPolicy,
    context: RecoveryContext,
    initialError: AIAssistantError
  ): Promise<Result<T>> {
    // Check timeout
    if (policy.timeout && Date.now() - context.startTime.getTime() > policy.timeout) {
      return err(new AIAssistantError({
        ...initialError.toDetails(),
        code: 'RECOVERY_TIMEOUT',
        message: 'Recovery operation timed out'
      }));
    }
    
    context.attemptNumber++;
    context.lastAttemptTime = new Date();
    
    try {
      const result = await traced(`recovery.attempt.${context.attemptNumber}`, operation);
      
      // Record successful recovery
      metrics.recordActionExecution(
        'recovery',
        Date.now() - context.startTime.getTime(),
        true,
        {
          strategy: policy.strategy,
          attempts: context.attemptNumber.toString()
        }
      );
      
      return ok(result);
    } catch (attemptError) {
      const error = attemptError instanceof AIAssistantError
        ? attemptError
        : new AIAssistantError({
            ...initialError.toDetails(),
            originalError: attemptError instanceof Error ? attemptError : undefined
          });
      
      context.errors.push(error);
      
      // Check if should retry
      if (
        context.attemptNumber < (policy.maxAttempts || 1) &&
        (!policy.shouldRetry || policy.shouldRetry(error, context))
      ) {
        // Execute retry callback
        if (policy.onRetry) {
          policy.onRetry(error, context);
        }
        
        // Apply delay
        if (policy.delayMs) {
          const delay = this.calculateDelay(policy, context);
          await this.delay(delay);
        }
        
        // Retry operation
        return this.applyRecoveryPolicy(operation, policy, context, initialError);
      }
      
      // Max attempts reached, apply final strategy
      return this.applyFinalStrategy(error, policy, context);
    }
  }
  
  /**
   * Apply final recovery strategy when retries exhausted
   */
  private async applyFinalStrategy<T>(
    error: AIAssistantError,
    policy: RecoveryPolicy,
    context: RecoveryContext
  ): Promise<Result<T>> {
    switch (policy.strategy) {
      case RecoveryStrategy.FALLBACK:
        if (policy.fallbackValue !== undefined) {
          Loggers.ai.info('Applying fallback value', {
            error: error.code,
            attempts: context.attemptNumber
          });
          return ok(policy.fallbackValue);
        }
        break;
        
      case RecoveryStrategy.COMPENSATE:
        if (policy.compensationHandler) {
          Loggers.ai.info('Applying compensation', {
            error: error.code,
            attempts: context.attemptNumber
          });
          
          // Compensation would need access to state
          // For now, we'll just log
          Loggers.ai.warn('Compensation handler not implemented');
        }
        break;
        
      case RecoveryStrategy.IGNORE:
        Loggers.ai.warn('Ignoring error after recovery attempts', {
          error: error.code,
          attempts: context.attemptNumber
        });
        return ok(undefined as any);
    }
    
    // Record failed recovery
    metrics.recordActionExecution(
      'recovery',
      Date.now() - context.startTime.getTime(),
      false,
      {
        strategy: policy.strategy,
        attempts: context.attemptNumber.toString(),
        error_code: error.code
      }
    );
    
    return err(error);
  }
  
  /**
   * Calculate delay with backoff
   */
  private calculateDelay(policy: RecoveryPolicy, context: RecoveryContext): number {
    if (!policy.delayMs) return 0;
    
    let delay = policy.delayMs;
    
    if (policy.backoffMultiplier && context.attemptNumber > 1) {
      delay = policy.delayMs * Math.pow(policy.backoffMultiplier, context.attemptNumber - 1);
    }
    
    if (policy.maxDelayMs) {
      delay = Math.min(delay, policy.maxDelayMs);
    }
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    
    return Math.floor(delay + jitter);
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * State recovery utilities
 */
export class StateRecovery {
  /**
   * Create state snapshot
   */
  static createSnapshot(state: CommerceState): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      state: {
        messages: state.messages,
        context: state.context,
        cart: state.cart?.id,
        customer: state.customer?.id,
        intent: state.intent,
        entities: state.entities,
        mode: state.mode
      }
    });
  }
  
  /**
   * Restore state from snapshot
   */
  static async restoreSnapshot(
    snapshot: string,
    sdk: any
  ): Promise<Partial<CommerceState>> {
    try {
      const parsed = JSON.parse(snapshot);
      const restored: Partial<CommerceState> = {
        messages: parsed.state.messages || [],
        context: parsed.state.context || {},
        intent: parsed.state.intent,
        entities: parsed.state.entities || [],
        mode: parsed.state.mode || 'b2c'
      };
      
      // Restore cart if ID exists
      if (parsed.state.cart) {
        try {
          const cart = await sdk.unified.getCart({ cartId: parsed.state.cart });
          restored.cart = cart;
        } catch (error) {
          Loggers.ai.warn('Failed to restore cart from snapshot', { cartId: parsed.state.cart });
        }
      }
      
      // Restore customer if ID exists
      if (parsed.state.customer) {
        try {
          const customer = await sdk.unified.getCustomer();
          restored.customer = customer;
        } catch (error) {
          Loggers.ai.warn('Failed to restore customer from snapshot');
        }
      }
      
      return restored;
    } catch (error) {
      Loggers.ai.error('Failed to restore state from snapshot', error);
      throw new AIAssistantError({
        code: 'STATE_RESTORE_ERROR',
        message: 'Failed to restore state from snapshot',
        category: ErrorCategory.STATE,
        severity: ErrorSeverity.HIGH,
        recoveryStrategy: RecoveryStrategy.NONE,
        retryable: false,
        originalError: error instanceof Error ? error : undefined,
        context: { timestamp: new Date() }
      });
    }
  }
}

/**
 * Compensation strategies
 */
export class CompensationStrategies {
  /**
   * Compensate cart operations
   */
  static async compensateCart(
    error: AIAssistantError,
    state: CommerceState,
    sdk: any
  ): Promise<void> {
    if (!state.cart) return;
    
    try {
      // Get fresh cart state
      const currentCart = await sdk.unified.getCart({ cartId: state.cart.id });
      
      // Log compensation attempt
      Loggers.ai.info('Compensating cart operation', {
        cartId: state.cart.id,
        error: error.code,
        itemCount: currentCart.lineItems?.length || 0
      });
      
      // Specific compensation based on error
      if (error.technicalDetails?.operation === 'addItem') {
        // Remove the item that was partially added
        const itemId = error.technicalDetails.itemId;
        if (itemId) {
          await sdk.unified.removeCartLineItem({
            cartId: state.cart.id,
            lineItemId: itemId
          });
        }
      }
    } catch (compensationError) {
      Loggers.ai.error('Cart compensation failed', compensationError);
    }
  }
  
  /**
   * Compensate order operations
   */
  static async compensateOrder(
    error: AIAssistantError,
    state: CommerceState,
    sdk: any
  ): Promise<void> {
    const orderId = error.technicalDetails?.orderId;
    if (!orderId) return;
    
    try {
      Loggers.ai.info('Compensating order operation', {
        orderId,
        error: error.code
      });
      
      // In a real system, this might cancel the order or notify support
      // For now, we'll just log
      metrics.recordActionExecution('order_compensation', 0, true, {
        order_id: orderId,
        error_code: error.code
      });
    } catch (compensationError) {
      Loggers.ai.error('Order compensation failed', compensationError);
    }
  }
}

/**
 * Global recovery manager instance
 */
export const recoveryManager = new RecoveryManager();

/**
 * Recovery decorator
 */
export function WithRecovery(policy?: Partial<RecoveryPolicy>) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const defaultPolicy: RecoveryPolicy = {
        strategy: RecoveryStrategy.RETRY,
        maxAttempts: 3,
        delayMs: 1000,
        ...policy
      };
      
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const aiError = error instanceof AIAssistantError
          ? error
          : new AIAssistantError({
              code: 'METHOD_ERROR',
              message: error instanceof Error ? error.message : 'Method execution failed',
              category: ErrorCategory.SYSTEM,
              severity: ErrorSeverity.HIGH,
              recoveryStrategy: defaultPolicy.strategy,
              retryable: true,
              originalError: error instanceof Error ? error : undefined,
              context: {
                timestamp: new Date(),
                action: `${target.constructor.name}.${propertyKey}`
              }
            });
        
        const result = await recoveryManager.executeWithRecovery(
          () => originalMethod.apply(this, args),
          aiError,
          defaultPolicy
        );
        
        if (!result.success) {
          throw result.error;
        }
        
        return result.data;
      }
    };
    
    return descriptor;
  };
}