import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';
import { CommerceToolRegistry } from '../tool-registry';
import { SchemaBuilder } from '../schema-builder';
import type { ActionDefinition, StateUpdateCommand } from '../../types/action-definition';

describe('CommerceToolRegistry', () => {
  let registry: CommerceToolRegistry;

  beforeEach(() => {
    registry = new CommerceToolRegistry({
      enablePerformanceTracking: true,
      enableSecurityValidation: true
    });
  });

  describe('Dynamic Tool Registration', () => {
    it('should register a tool from action definition', () => {
      const definition: ActionDefinition = {
        id: 'testAction',
        name: 'Test Action',
        description: 'A test action for unit testing',
        category: 'search',
        mode: 'both',
        parameters: z.object({
          query: z.string()
        }),
        returns: z.object({
          results: z.array(z.any())
        })
      };

      const implementation = async (params: unknown, state: unknown): Promise<StateUpdateCommand[]> => {
        return [{
          type: 'ADD_MESSAGE',
          payload: { content: 'Test completed' }
        }];
      };

      registry.register(definition, implementation);

      const tool = registry.getTool('testAction');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('testAction');
      expect(tool?.description).toBe('A test action for unit testing');
    });

    it('should build schema from parameter descriptions', () => {
      const params = {
        query: {
          type: 'string' as const,
          description: 'Search query',
          required: true
        },
        limit: {
          type: 'number' as const,
          description: 'Result limit',
          required: false,
          default: 10,
          min: 1,
          max: 100
        }
      };

      const schema = SchemaBuilder.buildSchema(params);
      
      // Valid input
      const valid = schema.parse({ query: 'test' });
      expect(valid).toEqual({ query: 'test', limit: 10 });

      // Invalid input should throw
      expect(() => schema.parse({ limit: 10 })).toThrow();
    });

    it('should support runtime tool updates', () => {
      const definition: ActionDefinition = {
        id: 'dynamicAction',
        name: 'Dynamic Action',
        description: 'An action that can be updated',
        category: 'cart',
        mode: 'b2c',
        parameters: z.object({ id: z.string() }),
        returns: z.object({ success: z.boolean() }),
        rateLimit: { maxCalls: 10, windowMs: 60000 }
      };

      const implementation = async (): Promise<StateUpdateCommand[]> => [];

      registry.register(definition, implementation);

      // Update rate limit
      registry.update('dynamicAction', {
        definition: {
          rateLimit: { maxCalls: 20, windowMs: 60000 }
        }
      });

      const updated = registry.getDefinition('dynamicAction');
      expect(updated?.rateLimit?.maxCalls).toBe(20);
    });

    it('should filter tools by category and mode', () => {
      // Register multiple tools
      const searchTool: ActionDefinition = {
        id: 'search1',
        name: 'Search',
        description: 'Search tool',
        category: 'search',
        mode: 'b2c',
        parameters: z.object({}),
        returns: z.object({})
      };

      const cartToolB2C: ActionDefinition = {
        id: 'cart1',
        name: 'Cart B2C',
        description: 'Cart for B2C',
        category: 'cart',
        mode: 'b2c',
        parameters: z.object({}),
        returns: z.object({})
      };

      const cartToolB2B: ActionDefinition = {
        id: 'cart2',
        name: 'Cart B2B',
        description: 'Cart for B2B',
        category: 'cart',
        mode: 'b2b',
        parameters: z.object({}),
        returns: z.object({})
      };

      const implementation = async (): Promise<StateUpdateCommand[]> => [];

      registry.register(searchTool, implementation);
      registry.register(cartToolB2C, implementation);
      registry.register(cartToolB2B, implementation);

      // Filter by category
      const cartTools = registry.getToolsBy({ category: 'cart' });
      expect(cartTools).toHaveLength(2);

      // Filter by mode
      const b2cTools = registry.getToolsBy({ mode: 'b2c' });
      expect(b2cTools).toHaveLength(2);

      const b2bTools = registry.getToolsBy({ mode: 'b2b' });
      expect(b2bTools).toHaveLength(1);
    });

    it('should track tool changes', () => {
      const changes: any[] = [];
      
      const trackingRegistry = new CommerceToolRegistry({
        onToolChange: (event) => changes.push(event)
      });

      const definition: ActionDefinition = {
        id: 'tracked',
        name: 'Tracked Action',
        description: 'Action with change tracking',
        category: 'search',
        mode: 'both',
        parameters: z.object({}),
        returns: z.object({})
      };

      const implementation = async (): Promise<StateUpdateCommand[]> => [];

      // Register
      trackingRegistry.register(definition, implementation);
      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('registered');

      // Update
      trackingRegistry.update('tracked', {
        definition: { description: 'Updated description' }
      });
      expect(changes).toHaveLength(2);
      expect(changes[1].type).toBe('updated');

      // Unregister
      trackingRegistry.unregister('tracked');
      expect(changes).toHaveLength(3);
      expect(changes[2].type).toBe('unregistered');
    });
  });

  describe('Configuration-Driven Extensibility', () => {
    it('should load tools from configuration', () => {
      const config: Record<string, any> = {
        search: {
          id: 'search',
          name: 'Search Products',
          description: 'Search for products',
          category: 'search',
          mode: 'both',
          parameters: {
            query: { type: 'string', required: true }
          },
          returns: {
            products: { type: 'array' }
          }
        }
      };

      const implementations = {
        search: async (): Promise<StateUpdateCommand[]> => [{
          type: 'ADD_MESSAGE',
          payload: { content: 'Search results' }
        }]
      };

      // Convert config to ActionDefinitions with schemas
      const definitions: Record<string, ActionDefinition> = {};
      for (const [id, def] of Object.entries(config)) {
        definitions[id] = {
          ...def,
          parameters: SchemaBuilder.buildSchema(def.parameters),
          returns: SchemaBuilder.buildSchema(def.returns)
        };
      }

      registry.loadFromConfig(definitions, implementations);

      const tools = registry.getTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('search');
    });
  });
});