import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { ActionDefinition, StateUpdateCommand, PerformanceMetrics, LogEntry } from '../types/action-definition';

/**
 * Factory class for converting ActionDefinition configurations into LangGraph tools
 * Implements the Tool Factory Pattern with built-in monitoring and security
 */
export class LangGraphActionFactory {
  private performanceTrackers: Map<string, PerformanceMetrics[]> = new Map();
  private logger: (entry: LogEntry) => void;

  constructor(
    private config: {
      enablePerformanceTracking: boolean;
      enableSecurityValidation: boolean;
      logger?: (entry: LogEntry) => void;
    }
  ) {
    this.logger = config.logger || this.defaultLogger;
  }

  /**
   * Creates a LangGraph tool from an ActionDefinition
   * Includes automatic performance tracking, security validation, and error handling
   */
  createTool(definition: ActionDefinition, implementation: (params: unknown, state: unknown) => Promise<StateUpdateCommand[]>) {
    const wrappedImplementation = async (params: unknown, config: any) => {
      const startTime = performance.now();
      const sessionId = config?.configurable?.sessionId || 'unknown';
      
      // Access current state through config.configurable.getCurrentTaskInput()
      const currentState = config?.configurable?.getCurrentTaskInput?.() || {};
      
      try {
        // Log action start
        this.log({
          level: 'info',
          actionId: definition.id,
          sessionId,
          message: `Starting action: ${definition.name}`,
          metadata: { params }
        });

        // Security validation
        if (this.config.enableSecurityValidation && definition.security?.validateInput) {
          this.validateInput(params, definition);
        }

        // Rate limiting check
        if (definition.rateLimit) {
          this.checkRateLimit(definition.id, definition.rateLimit);
        }

        // Execute the action with state
        const result = await implementation(params, currentState);

        // Track performance
        if (this.config.enablePerformanceTracking) {
          this.trackPerformance({
            actionId: definition.id,
            startTime,
            endTime: performance.now(),
            duration: performance.now() - startTime,
            success: true
          });
        }

        // Log success
        this.log({
          level: 'info',
          actionId: definition.id,
          sessionId,
          message: `Completed action: ${definition.name}`,
          performance: {
            duration: performance.now() - startTime
          }
        });

        return result;
      } catch (error) {
        // Track failed performance
        if (this.config.enablePerformanceTracking) {
          this.trackPerformance({
            actionId: definition.id,
            startTime,
            endTime: performance.now(),
            duration: performance.now() - startTime,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Log error
        this.log({
          level: 'error',
          actionId: definition.id,
          sessionId,
          message: `Failed action: ${definition.name}`,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
          performance: {
            duration: performance.now() - startTime
          }
        });

        throw error;
      }
    };

    // Create the LangGraph tool with proper schema
    return tool(wrappedImplementation, {
      name: definition.id,
      description: definition.description,
      schema: definition.parameters
    });
  }

  /**
   * Validates input parameters against security rules
   */
  private validateInput(params: unknown, definition: ActionDefinition): void {
    // Implement security validation logic
    try {
      definition.parameters.parse(params);
    } catch (error) {
      throw new Error(`Input validation failed for action ${definition.id}: ${error}`);
    }
  }

  /**
   * Checks rate limiting constraints
   */
  private checkRateLimit(actionId: string, limit: { maxCalls: number; windowMs: number }): void {
    const now = Date.now();
    const metrics = this.performanceTrackers.get(actionId) || [];
    
    // Filter metrics within the time window
    const recentMetrics = metrics.filter(m => now - m.endTime < limit.windowMs);
    
    if (recentMetrics.length >= limit.maxCalls) {
      throw new Error(`Rate limit exceeded for action ${actionId}`);
    }
  }

  /**
   * Tracks performance metrics
   */
  private trackPerformance(metrics: PerformanceMetrics): void {
    const existing = this.performanceTrackers.get(metrics.actionId) || [];
    existing.push(metrics);
    
    // Keep only recent metrics (last hour)
    const oneHourAgo = Date.now() - 3600000;
    const filtered = existing.filter(m => m.endTime > oneHourAgo);
    
    this.performanceTrackers.set(metrics.actionId, filtered);
  }

  /**
   * Default logger implementation
   */
  private defaultLogger(entry: LogEntry): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`, entry.metadata || {});
  }

  /**
   * Logs an entry using the configured logger
   */
  private log(entry: Omit<LogEntry, 'timestamp'>): void {
    this.logger({
      ...entry,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gets performance metrics for an action
   */
  getMetrics(actionId: string): PerformanceMetrics[] {
    return this.performanceTrackers.get(actionId) || [];
  }

  /**
   * Clears performance metrics
   */
  clearMetrics(): void {
    this.performanceTrackers.clear();
  }
}