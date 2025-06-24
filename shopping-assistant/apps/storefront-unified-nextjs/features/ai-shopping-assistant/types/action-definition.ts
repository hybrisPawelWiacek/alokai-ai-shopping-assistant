import { z } from 'zod';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * Core interface for defining commerce actions in a configuration-driven manner.
 * This replaces code-based action definitions with declarative configuration.
 */
export interface ActionDefinition {
  /** Unique identifier for the action */
  id: string;
  
  /** Human-readable name for the action */
  name: string;
  
  /** Detailed description for LLM understanding */
  description: string;
  
  /** Category for organizing actions */
  category: 'search' | 'cart' | 'product' | 'comparison' | 'navigation' | 'customer';
  
  /** Commerce mode applicability */
  mode: 'b2c' | 'b2b' | 'both';
  
  /** Zod schema for parameter validation */
  parameters: z.ZodSchema;
  
  /** Expected return type schema */
  returns: z.ZodSchema;
  
  /** Configuration for rate limiting and throttling */
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
  
  /** Security configuration */
  security?: {
    requireAuth?: boolean;
    permissions?: string[];
    validateInput?: boolean;
  };
  
  /** Performance monitoring configuration */
  monitoring?: {
    trackExecutionTime?: boolean;
    trackErrorRate?: boolean;
    sampleRate?: number; // 0-1 for sampling percentage
  };
  
  /** UI component mapping for responses */
  ui?: {
    component: string;
    props?: Record<string, unknown>;
  };
}

/**
 * Command pattern for state updates
 * Tools return these commands which are then applied to state
 */
export type StateUpdateCommand = 
  | { type: 'ADD_MESSAGE'; payload: any }
  | { type: 'UPDATE_CART'; payload: any }
  | { type: 'UPDATE_CONTEXT'; payload: any }
  | { type: 'UPDATE_COMPARISON'; payload: any }
  | { type: 'UPDATE_SECURITY'; payload: any }
  | { type: 'UPDATE_PERFORMANCE'; payload: any }
  | { type: 'SET_MODE'; payload: { mode: 'b2c' | 'b2b' } }
  | { type: 'SET_AVAILABLE_ACTIONS'; payload: any }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_LAST_ACTION'; payload: string | null }
  | { type: 'CLEAR_ERROR'; payload?: undefined };

/**
 * Extended state annotation for commerce-specific needs
 */
export interface CommerceState {
  messages: BaseMessage[];
  mode: 'b2c' | 'b2b';
  context: {
    customerId?: string;
    cartId?: string;
    sessionId: string;
    locale: string;
    currency: string;
  };
  security: {
    isAuthenticated: boolean;
    permissions: string[];
  };
  performance: {
    requestStartTime: number;
    actionExecutions: Array<{
      actionId: string;
      duration: number;
      timestamp: number;
    }>;
  };
}

/**
 * Structured logging interface for observability
 */
export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  actionId?: string;
  userId?: string;
  sessionId: string;
  message: string;
  metadata?: Record<string, unknown>;
  performance?: {
    duration?: number;
    memoryUsage?: number;
  };
}

/**
 * Performance tracking interface
 */
export interface PerformanceMetrics {
  actionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for the entire AI assistant system
 */
export interface AssistantConfiguration {
  /** Available actions mapped by ID */
  actions: Record<string, ActionDefinition>;
  
  /** Global security settings */
  security: {
    enableInputValidation: boolean;
    enableOutputValidation: boolean;
    maxRequestsPerMinute: number;
    allowedOrigins?: string[];
  };
  
  /** Performance settings */
  performance: {
    responseTimeTarget: number; // ms
    enableCaching: boolean;
    cacheStrategy?: 'memory' | 'redis';
    maxConcurrentActions: number;
  };
  
  /** Monitoring and observability */
  monitoring: {
    enableTracing: boolean;
    enableMetrics: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    customLoggers?: Array<(entry: LogEntry) => void>;
  };
}