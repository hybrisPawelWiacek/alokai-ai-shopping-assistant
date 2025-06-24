import { z } from 'zod';
import type { StateUpdateCommand } from '../types/action-definition';

/**
 * Configuration schema for action definitions
 * Supports both YAML and JSON formats with full validation
 */

// Schema for parameter definitions
export const ParameterSchemaConfig = z.object({
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  required: z.boolean().default(false),
  description: z.string().optional(),
  default: z.any().optional(),
  enum: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  items: z.lazy(() => ParameterSchemaConfig).optional(),
  properties: z.record(z.lazy(() => ParameterSchemaConfig)).optional()
});

// Schema for security configuration
export const SecurityConfig = z.object({
  requiresAuth: z.boolean().default(false),
  requiredPermissions: z.array(z.string()).optional(),
  rateLimit: z.object({
    requests: z.number(),
    windowMs: z.number()
  }).optional(),
  inputValidation: z.object({
    maxLength: z.number().optional(),
    bannedPatterns: z.array(z.string()).optional(),
    allowedDomains: z.array(z.string()).optional()
  }).optional()
});

// Schema for UDL integration configuration
export const UDLIntegrationConfig = z.object({
  methods: z.array(z.string()),
  dataFlow: z.enum(['read', 'write', 'read-write']),
  caching: z.object({
    enabled: z.boolean().default(false),
    ttlSeconds: z.number().optional(),
    invalidateOn: z.array(z.string()).optional()
  }).optional()
});

// Schema for performance configuration
export const PerformanceConfig = z.object({
  timeoutMs: z.number().default(30000),
  retries: z.number().default(0),
  backoffMs: z.number().optional(),
  parallelism: z.object({
    maxConcurrent: z.number().default(1),
    batchSize: z.number().optional()
  }).optional()
});

// Schema for observability configuration
export const ObservabilityConfig = z.object({
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    includeParams: z.boolean().default(false),
    includeResult: z.boolean().default(false)
  }).optional(),
  metrics: z.object({
    enabled: z.boolean().default(true),
    customLabels: z.record(z.string()).optional()
  }).optional(),
  tracing: z.object({
    enabled: z.boolean().default(true),
    propagateContext: z.boolean().default(true)
  }).optional()
});

// Schema for mode-specific configuration
export const ModeConfig = z.object({
  b2c: z.object({
    enabled: z.boolean().default(true),
    overrides: z.record(z.any()).optional()
  }).optional(),
  b2b: z.object({
    enabled: z.boolean().default(true),
    overrides: z.record(z.any()).optional(),
    requiredFields: z.array(z.string()).optional()
  }).optional()
});

// Main action configuration schema
export const ActionConfigSchema = z.object({
  // Basic metadata
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['search', 'cart', 'customer', 'checkout', 'b2b', 'support']),
  
  // Parameters configuration
  parameters: z.record(ParameterSchemaConfig).optional(),
  
  // Implementation details
  implementation: z.object({
    type: z.enum(['function', 'composed', 'external']),
    handler: z.string().optional(), // Function name or path
    steps: z.array(z.string()).optional(), // For composed actions
    endpoint: z.string().optional() // For external actions
  }),
  
  // Feature flags and modes
  enabled: z.boolean().default(true),
  modes: ModeConfig.optional(),
  
  // Security settings
  security: SecurityConfig.optional(),
  
  // UDL integration
  udl: UDLIntegrationConfig.optional(),
  
  // Performance settings
  performance: PerformanceConfig.optional(),
  
  // Observability
  observability: ObservabilityConfig.optional(),
  
  // Response formatting
  response: z.object({
    format: z.enum(['text', 'markdown', 'json', 'custom']).default('markdown'),
    template: z.string().optional(),
    includeMetadata: z.boolean().default(false)
  }).optional(),
  
  // Dependencies on other actions
  dependencies: z.array(z.string()).optional(),
  
  // Custom metadata
  metadata: z.record(z.any()).optional()
});

// Configuration file schema
export const ConfigurationFileSchema = z.object({
  version: z.string(),
  environment: z.enum(['development', 'staging', 'production']).optional(),
  actions: z.array(ActionConfigSchema),
  globals: z.object({
    security: SecurityConfig.optional(),
    performance: PerformanceConfig.optional(),
    observability: ObservabilityConfig.optional(),
    udl: z.object({
      defaultTimeout: z.number().optional(),
      retryPolicy: z.object({
        maxRetries: z.number(),
        backoffMs: z.number()
      }).optional()
    }).optional()
  }).optional()
});

// Type exports
export type ParameterSchema = z.infer<typeof ParameterSchemaConfig>;
export type SecuritySettings = z.infer<typeof SecurityConfig>;
export type UDLIntegration = z.infer<typeof UDLIntegrationConfig>;
export type PerformanceSettings = z.infer<typeof PerformanceConfig>;
export type ObservabilitySettings = z.infer<typeof ObservabilityConfig>;
export type ModeSettings = z.infer<typeof ModeConfig>;
export type ActionConfig = z.infer<typeof ActionConfigSchema>;
export type ConfigurationFile = z.infer<typeof ConfigurationFileSchema>;

// Configuration loader options
export interface ConfigLoaderOptions {
  configPath: string;
  environment?: 'development' | 'staging' | 'production';
  watch?: boolean;
  cache?: boolean;
  onReload?: (config: ConfigurationFile) => void;
}

// Configuration context for runtime
export interface ConfigurationContext {
  config: ConfigurationFile;
  environment: string;
  reloadConfig: () => Promise<void>;
  getAction: (actionId: string) => ActionConfig | undefined;
  isActionEnabled: (actionId: string, mode?: 'b2c' | 'b2b') => boolean;
}