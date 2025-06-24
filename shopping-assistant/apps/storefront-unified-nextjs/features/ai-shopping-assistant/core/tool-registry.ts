import type { DynamicStructuredTool } from '@langchain/core/tools';
import { LangGraphActionFactory } from './tool-factory';
import type { ActionDefinition, StateUpdateCommand, LogEntry } from '../types/action-definition';

/**
 * Registry for managing LangGraph tools dynamically
 * Supports runtime registration, updates, and removal of tools
 */
export class CommerceToolRegistry {
  private tools: Map<string, DynamicStructuredTool> = new Map();
  private definitions: Map<string, ActionDefinition> = new Map();
  private implementations: Map<string, (params: unknown, state: unknown) => Promise<StateUpdateCommand[]>> = new Map();
  private factory: LangGraphActionFactory;
  private changeListeners: Array<(event: ToolChangeEvent) => void> = [];

  constructor(
    private config: {
      enablePerformanceTracking?: boolean;
      enableSecurityValidation?: boolean;
      logger?: (entry: LogEntry) => void;
      onToolChange?: (event: ToolChangeEvent) => void;
    } = {}
  ) {
    this.factory = new LangGraphActionFactory({
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
      enableSecurityValidation: config.enableSecurityValidation ?? true,
      logger: config.logger
    });

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

    // Create tool using factory
    const tool = this.factory.createTool(definition, implementation);

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
   * Clears all tools from the registry
   */
  clear(): void {
    const toolIds = Array.from(this.tools.keys());
    for (const toolId of toolIds) {
      this.unregister(toolId);
    }
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
}

/**
 * Event emitted when tools change in the registry
 */
export type ToolChangeEvent = 
  | { type: 'registered'; toolId: string; definition: ActionDefinition }
  | { type: 'updated'; toolId: string; definition: ActionDefinition; previousDefinition: ActionDefinition }
  | { type: 'unregistered'; toolId: string; definition: ActionDefinition };