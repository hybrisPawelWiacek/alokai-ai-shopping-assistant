import type { DynamicStructuredTool } from '@langchain/core/tools';
import { LangGraphActionFactory } from './tool-factory';
import type { ActionDefinition, StateUpdateCommand, LogEntry } from '../types/action-definition';

/**
 * Simple LRU Cache implementation for tool caching
 */
class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private accessOrder: K[] = [];

  constructor(private maxSize: number = 100) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing, move to end
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used
      const lru = this.accessOrder.shift();
      if (lru !== undefined) {
        this.cache.delete(lru);
      }
    }
    this.cache.set(key, value);
    this.accessOrder.push(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Registry for managing LangGraph tools dynamically
 * Supports runtime registration, updates, and removal of tools
 * Includes LRU caching for compiled tools and schemas
 */
export class CommerceToolRegistry {
  private tools: Map<string, DynamicStructuredTool> = new Map();
  private definitions: Map<string, ActionDefinition> = new Map();
  private implementations: Map<string, (params: unknown, state: unknown) => Promise<StateUpdateCommand[]>> = new Map();
  private factory: LangGraphActionFactory;
  private changeListeners: Array<(event: ToolChangeEvent) => void> = [];
  
  // Caching
  private toolCache: LRUCache<string, DynamicStructuredTool>;
  private schemaCache: LRUCache<string, any>;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(
    private config: {
      enablePerformanceTracking?: boolean;
      enableSecurityValidation?: boolean;
      enableCaching?: boolean;
      cacheSize?: number;
      logger?: (entry: LogEntry) => void;
      onToolChange?: (event: ToolChangeEvent) => void;
    } = {}
  ) {
    this.factory = new LangGraphActionFactory({
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
      enableSecurityValidation: config.enableSecurityValidation ?? true,
      logger: config.logger
    });

    // Initialize caches
    const cacheSize = config.cacheSize || 50;
    this.toolCache = new LRUCache(cacheSize);
    this.schemaCache = new LRUCache(cacheSize * 2); // Schema cache can be larger

    if (config.onToolChange) {
      this.changeListeners.push(config.onToolChange);
    }
  }

  /**
   * Registers a new tool with its definition and implementation
   */
  register(
    definition: ActionDefinition,
    implementation: (params: unknown, state: unknown) => Promise<StateUpdateCommand[]>
  ): void {
    // Validate definition
    this.validateDefinition(definition);

    // Check for duplicate
    if (this.tools.has(definition.id)) {
      throw new Error(`Tool with id ${definition.id} already registered. Use update() to modify existing tools.`);
    }

    // Try to get from cache first
    const cacheKey = this.getCacheKey(definition);
    let tool = this.config.enableCaching !== false ? this.toolCache.get(cacheKey) : undefined;
    
    if (tool) {
      this.cacheHits++;
    } else {
      // Create tool using factory
      this.cacheMisses++;
      tool = this.factory.createTool(definition, implementation);
      
      // Cache the created tool
      if (this.config.enableCaching !== false) {
        this.toolCache.set(cacheKey, tool);
      }
    }

    // Store in registry
    this.tools.set(definition.id, tool);
    this.definitions.set(definition.id, definition);
    this.implementations.set(definition.id, implementation);

    // Notify listeners
    this.notifyChange({
      type: 'registered',
      toolId: definition.id,
      definition
    });
  }

  /**
   * Updates an existing tool with new definition or implementation
   */
  update(
    toolId: string,
    updates: {
      definition?: Partial<ActionDefinition>;
      implementation?: (params: unknown, state: unknown) => Promise<StateUpdateCommand[]>;
    }
  ): void {
    const existingDefinition = this.definitions.get(toolId);
    const existingImplementation = this.implementations.get(toolId);

    if (!existingDefinition || !existingImplementation) {
      throw new Error(`Tool with id ${toolId} not found. Use register() to add new tools.`);
    }

    // Merge definition updates
    const updatedDefinition: ActionDefinition = {
      ...existingDefinition,
      ...updates.definition,
      id: toolId // Ensure ID cannot be changed
    };

    // Validate updated definition
    this.validateDefinition(updatedDefinition);

    // Use new implementation or keep existing
    const implementation = updates.implementation || existingImplementation;

    // Invalidate cache for old definition
    if (this.config.enableCaching !== false) {
      const oldCacheKey = this.getCacheKey(existingDefinition);
      this.toolCache.set(oldCacheKey, undefined as any); // Invalidate
    }

    // Create new tool
    const tool = this.factory.createTool(updatedDefinition, implementation);

    // Update registry
    this.tools.set(toolId, tool);
    this.definitions.set(toolId, updatedDefinition);
    if (updates.implementation) {
      this.implementations.set(toolId, updates.implementation);
    }

    // Notify listeners
    this.notifyChange({
      type: 'updated',
      toolId,
      definition: updatedDefinition,
      previousDefinition: existingDefinition
    });
  }

  /**
   * Removes a tool from the registry
   */
  unregister(toolId: string): void {
    const definition = this.definitions.get(toolId);
    
    if (!definition) {
      throw new Error(`Tool with id ${toolId} not found`);
    }

    this.tools.delete(toolId);
    this.definitions.delete(toolId);
    this.implementations.delete(toolId);

    // Notify listeners
    this.notifyChange({
      type: 'unregistered',
      toolId,
      definition
    });
  }

  /**
   * Gets a specific tool by ID
   */
  getTool(toolId: string): DynamicStructuredTool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Gets all registered tools
   */
  getTools(): DynamicStructuredTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Gets tools filtered by criteria
   */
  getToolsBy(filter: {
    category?: ActionDefinition['category'];
    mode?: ActionDefinition['mode'];
  }): DynamicStructuredTool[] {
    const filteredIds = Array.from(this.definitions.entries())
      .filter(([_, def]) => {
        if (filter.category && def.category !== filter.category) return false;
        if (filter.mode && def.mode !== 'both' && def.mode !== filter.mode) return false;
        return true;
      })
      .map(([id]) => id);

    return filteredIds
      .map(id => this.tools.get(id))
      .filter((tool): tool is DynamicStructuredTool => tool !== undefined);
  }

  /**
   * Gets a tool definition by ID
   */
  getDefinition(toolId: string): ActionDefinition | undefined {
    return this.definitions.get(toolId);
  }

  /**
   * Gets all tool definitions
   */
  getDefinitions(): ActionDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Bulk register tools from configuration
   */
  registerBulk(
    tools: Array<{
      definition: ActionDefinition;
      implementation: (params: unknown, state: unknown) => Promise<StateUpdateCommand[]>;
    }>
  ): void {
    for (const { definition, implementation } of tools) {
      this.register(definition, implementation);
    }
  }

  /**
   * Loads tools from a configuration object
   */
  loadFromConfig(
    config: Record<string, ActionDefinition>,
    implementations: Record<string, (params: unknown, state: unknown) => Promise<StateUpdateCommand[]>>
  ): void {
    for (const [id, definition] of Object.entries(config)) {
      const implementation = implementations[id];
      if (!implementation) {
        console.warn(`No implementation found for tool ${id}, skipping`);
        continue;
      }

      // Ensure the definition ID matches the key
      definition.id = id;
      
      this.register(definition, implementation);
    }
  }

  /**
   * Adds a change listener
   */
  addChangeListener(listener: (event: ToolChangeEvent) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Removes a change listener
   */
  removeChangeListener(listener: (event: ToolChangeEvent) => void): void {
    this.changeListeners = this.changeListeners.filter(l => l !== listener);
  }

  /**
   * Gets performance metrics from the factory
   */
  getMetrics(toolId?: string): any {
    if (toolId) {
      return this.factory.getMetrics(toolId);
    }
    
    // Get metrics for all tools
    const allMetrics: Record<string, any> = {};
    for (const id of this.tools.keys()) {
      allMetrics[id] = this.factory.getMetrics(id);
    }
    return allMetrics;
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): {
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    toolCacheSize: number;
    schemaCacheSize: number;
  } {
    const total = this.cacheHits + this.cacheMisses;
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
      toolCacheSize: this.toolCache.size(),
      schemaCacheSize: this.schemaCache.size()
    };
  }

  /**
   * Clears all tools from the registry
   */
  clear(): void {
    const toolIds = Array.from(this.tools.keys());
    for (const toolId of toolIds) {
      this.unregister(toolId);
    }
    
    // Clear caches
    this.toolCache.clear();
    this.schemaCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Validates an action definition
   */
  private validateDefinition(definition: ActionDefinition): void {
    if (!definition.id || typeof definition.id !== 'string') {
      throw new Error('Tool definition must have a valid ID');
    }

    if (!definition.name || typeof definition.name !== 'string') {
      throw new Error('Tool definition must have a valid name');
    }

    if (!definition.description || typeof definition.description !== 'string') {
      throw new Error('Tool definition must have a valid description');
    }

    if (!definition.parameters || typeof definition.parameters.parse !== 'function') {
      throw new Error('Tool definition must have valid Zod schema for parameters');
    }

    const validCategories = ['search', 'cart', 'product', 'comparison', 'navigation', 'customer'];
    if (!validCategories.includes(definition.category)) {
      throw new Error(`Invalid category: ${definition.category}`);
    }

    const validModes = ['b2c', 'b2b', 'both'];
    if (!validModes.includes(definition.mode)) {
      throw new Error(`Invalid mode: ${definition.mode}`);
    }
  }

  /**
   * Notifies all listeners of a change
   */
  private notifyChange(event: ToolChangeEvent): void {
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in tool change listener:', error);
      }
    }
  }

  /**
   * Generates a cache key for a tool definition
   */
  private getCacheKey(definition: ActionDefinition): string {
    // Create a stable key based on definition properties
    const key = `${definition.id}_${definition.name}_${definition.mode}_${definition.category}_${JSON.stringify(definition.parameters)}`;
    // Simple hash function for shorter keys
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `tool_${definition.id}_${hash}`;
  }
}

/**
 * Event emitted when tools change in the registry
 */
export type ToolChangeEvent = 
  | { type: 'registered'; toolId: string; definition: ActionDefinition }
  | { type: 'updated'; toolId: string; definition: ActionDefinition; previousDefinition: ActionDefinition }
  | { type: 'unregistered'; toolId: string; definition: ActionDefinition };