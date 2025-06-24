import { z } from 'zod';

/**
 * Parameter description format for automatic schema generation
 */
export interface ParameterDescription {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
  min?: number;
  max?: number;
  items?: ParameterDescription; // For arrays
  properties?: Record<string, ParameterDescription>; // For objects
}

/**
 * Builds Zod schemas from parameter descriptions
 * Enables configuration-driven schema generation
 */
export class SchemaBuilder {
  /**
   * Builds a Zod schema from parameter descriptions
   */
  static buildSchema(params: Record<string, ParameterDescription>): z.ZodSchema {
    const shape: Record<string, z.ZodSchema> = {};
    const required: string[] = [];

    for (const [key, param] of Object.entries(params)) {
      shape[key] = this.buildFieldSchema(param);
      
      if (param.required !== false) {
        required.push(key);
      }
    }

    // Create object schema
    let schema = z.object(shape);

    // Handle optional fields
    const optional = Object.keys(shape).filter(key => !required.includes(key));
    if (optional.length > 0) {
      schema = schema.partial(
        optional.reduce((acc, key) => ({ ...acc, [key]: true }), {})
      );
    }

    return schema;
  }

  /**
   * Builds a schema for a single field
   */
  private static buildFieldSchema(param: ParameterDescription): z.ZodSchema {
    let schema: z.ZodSchema;

    switch (param.type) {
      case 'string':
        schema = z.string();
        if (param.enum) {
          schema = z.enum(param.enum as [string, ...string[]]);
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
        if (!param.items) {
          throw new Error('Array parameter must define items schema');
        }
        schema = z.array(this.buildFieldSchema(param.items));
        break;

      case 'object':
        if (!param.properties) {
          throw new Error('Object parameter must define properties');
        }
        schema = this.buildSchema(param.properties);
        break;

      default:
        throw new Error(`Unknown parameter type: ${param.type}`);
    }

    // Add description
    if (param.description) {
      schema = schema.describe(param.description);
    }

    // Add default value
    if (param.default !== undefined) {
      schema = schema.default(param.default);
    }

    // Make optional if not required
    if (param.required === false) {
      schema = schema.optional();
    }

    return schema;
  }

  /**
   * Creates common e-commerce parameter schemas
   */
  static commonSchemas = {
    productId: (): ParameterDescription => ({
      type: 'string',
      description: 'Unique identifier for a product',
      required: true
    }),

    quantity: (): ParameterDescription => ({
      type: 'number',
      description: 'Quantity of items',
      required: false,
      default: 1,
      min: 1,
      max: 999
    }),

    searchQuery: (): ParameterDescription => ({
      type: 'string',
      description: 'Search query text',
      required: true
    }),

    pagination: (): ParameterDescription => ({
      type: 'object',
      description: 'Pagination parameters',
      required: false,
      properties: {
        limit: {
          type: 'number',
          description: 'Number of items per page',
          default: 20,
          min: 1,
          max: 100
        },
        offset: {
          type: 'number',
          description: 'Number of items to skip',
          default: 0,
          min: 0
        }
      }
    }),

    sortBy: (): ParameterDescription => ({
      type: 'string',
      description: 'Field to sort by',
      required: false,
      enum: ['price', 'name', 'relevance', 'rating', 'newest'],
      default: 'relevance'
    }),

    filters: (): ParameterDescription => ({
      type: 'object',
      description: 'Product filters',
      required: false,
      properties: {
        categories: {
          type: 'array',
          description: 'Category IDs to filter by',
          items: {
            type: 'string',
            description: 'Category ID'
          }
        },
        priceRange: {
          type: 'object',
          description: 'Price range filter',
          properties: {
            min: {
              type: 'number',
              description: 'Minimum price',
              min: 0
            },
            max: {
              type: 'number',
              description: 'Maximum price',
              min: 0
            }
          }
        },
        brands: {
          type: 'array',
          description: 'Brand names to filter by',
          items: {
            type: 'string',
            description: 'Brand name'
          }
        }
      }
    })
  };
}

/**
 * Helper function to create parameter descriptions
 */
export function param(
  type: ParameterDescription['type'],
  description: string,
  options?: Partial<ParameterDescription>
): ParameterDescription {
  return {
    type,
    description,
    required: true,
    ...options
  };
}

/**
 * Helper to create optional parameters
 */
export function optionalParam(
  type: ParameterDescription['type'],
  description: string,
  options?: Partial<ParameterDescription>
): ParameterDescription {
  return param(type, description, { ...options, required: false });
}