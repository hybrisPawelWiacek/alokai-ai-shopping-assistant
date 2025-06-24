import { readFileSync, watchFile, unwatchFile } from 'fs';
import { join, resolve } from 'path';
import { z } from 'zod';
import { 
  ConfigurationFileSchema, 
  type ConfigurationFile, 
  type ConfigLoaderOptions,
  type ActionConfig 
} from './types';

/**
 * Configuration loader with support for JSON and YAML files
 * Includes validation, caching, hot-reload, and environment overrides
 */

// Cache for loaded configurations
const configCache = new Map<string, {
  config: ConfigurationFile;
  timestamp: number;
  ttl: number;
}>();

// File watchers for hot-reload
const fileWatchers = new Map<string, NodeJS.Timer>();

/**
 * Parse configuration file based on extension
 */
function parseConfigFile(filePath: string, content: string): unknown {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  if (ext === 'json') {
    return JSON.parse(content);
  } else if (ext === 'yaml' || ext === 'yml') {
    // For YAML support, we'll need to handle this differently
    // Since js-yaml is not installed, we'll only support JSON for now
    throw new Error('YAML configuration files require js-yaml package. Please use JSON format or install js-yaml.');
  } else {
    throw new Error(`Unsupported configuration file format: ${ext}`);
  }
}

/**
 * Apply environment-specific overrides to configuration
 */
function applyEnvironmentOverrides(
  config: ConfigurationFile,
  environment?: string
): ConfigurationFile {
  if (!environment || config.environment === environment) {
    return config;
  }

  // Look for environment-specific override file
  const envConfig = loadEnvironmentConfig(environment);
  if (!envConfig) {
    return config;
  }

  // Deep merge configurations
  return deepMerge(config, envConfig);
}

/**
 * Load environment-specific configuration
 */
function loadEnvironmentConfig(environment: string): Partial<ConfigurationFile> | null {
  try {
    const envConfigPath = resolve(
      process.cwd(),
      `config/actions.${environment}.json`
    );
    const content = readFileSync(envConfigPath, 'utf-8');
    const parsed = JSON.parse(content);
    
    // Validate partial schema
    const partialSchema = ConfigurationFileSchema.partial();
    return partialSchema.parse(parsed);
  } catch {
    // Environment-specific config is optional
    return null;
  }
}

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        result[key] || {},
        source[key] as any
      );
    } else {
      result[key] = source[key] as any;
    }
  }
  
  return result;
}

/**
 * Load and validate configuration file
 */
export async function loadConfiguration(
  options: ConfigLoaderOptions
): Promise<ConfigurationFile> {
  const { configPath, environment, cache = true } = options;
  const resolvedPath = resolve(configPath);
  
  // Check cache first
  if (cache) {
    const cached = configCache.get(resolvedPath);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.config;
    }
  }
  
  try {
    // Read file
    const content = readFileSync(resolvedPath, 'utf-8');
    
    // Parse based on file type
    const rawConfig = parseConfigFile(resolvedPath, content);
    
    // Validate with Zod schema
    const validated = ConfigurationFileSchema.parse(rawConfig);
    
    // Apply environment overrides
    const config = applyEnvironmentOverrides(validated, environment);
    
    // Cache the configuration
    if (cache) {
      configCache.set(resolvedPath, {
        config,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000 // 5 minutes TTL
      });
    }
    
    // Setup hot-reload if requested
    if (options.watch && process.env.NODE_ENV === 'development') {
      setupHotReload(resolvedPath, options);
    }
    
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Configuration validation failed:\n${error.errors
          .map(e => `  - ${e.path.join('.')}: ${e.message}`)
          .join('\n')}`
      );
    }
    throw error;
  }
}

/**
 * Setup hot-reload for configuration file
 */
function setupHotReload(filePath: string, options: ConfigLoaderOptions): void {
  // Clear any existing watcher
  if (fileWatchers.has(filePath)) {
    clearTimeout(fileWatchers.get(filePath)!);
  }
  
  let reloadTimeout: NodeJS.Timeout;
  
  watchFile(filePath, { interval: 1000 }, () => {
    // Debounce reloads
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(async () => {
      try {
        console.log(`🔄 Reloading configuration: ${filePath}`);
        
        // Clear cache
        configCache.delete(filePath);
        
        // Reload configuration
        const newConfig = await loadConfiguration({
          ...options,
          watch: false // Prevent recursive watch setup
        });
        
        // Notify callback
        if (options.onReload) {
          options.onReload(newConfig);
        }
        
        console.log('✅ Configuration reloaded successfully');
      } catch (error) {
        console.error('❌ Failed to reload configuration:', error);
      }
    }, 300);
  });
  
  fileWatchers.set(filePath, reloadTimeout!);
}

/**
 * Stop watching a configuration file
 */
export function stopWatching(filePath: string): void {
  const resolvedPath = resolve(filePath);
  
  if (fileWatchers.has(resolvedPath)) {
    clearTimeout(fileWatchers.get(resolvedPath)!);
    fileWatchers.delete(resolvedPath);
    unwatchFile(resolvedPath);
  }
}

/**
 * Clear configuration cache
 */
export function clearConfigCache(filePath?: string): void {
  if (filePath) {
    configCache.delete(resolve(filePath));
  } else {
    configCache.clear();
  }
}

/**
 * Configuration manager class for easier usage
 */
export class ConfigurationManager {
  private config: ConfigurationFile | null = null;
  private options: ConfigLoaderOptions;
  
  constructor(options: ConfigLoaderOptions) {
    this.options = options;
  }
  
  async initialize(): Promise<void> {
    this.config = await loadConfiguration({
      ...this.options,
      onReload: (newConfig) => {
        this.config = newConfig;
        if (this.options.onReload) {
          this.options.onReload(newConfig);
        }
      }
    });
  }
  
  getConfig(): ConfigurationFile {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    return this.config;
  }
  
  getAction(actionId: string): ActionConfig | undefined {
    return this.config?.actions.find(a => a.id === actionId);
  }
  
  isActionEnabled(actionId: string, mode?: 'b2c' | 'b2b'): boolean {
    const action = this.getAction(actionId);
    if (!action || !action.enabled) {
      return false;
    }
    
    if (mode && action.modes) {
      const modeConfig = action.modes[mode];
      return modeConfig?.enabled !== false;
    }
    
    return true;
  }
  
  getActionsByCategory(category: string): ActionConfig[] {
    return this.config?.actions.filter(a => a.category === category) || [];
  }
  
  getAllActions(): ActionConfig[] {
    return this.config?.actions || [];
  }
  
  getGlobalSettings() {
    return this.config?.globals || {};
  }
  
  destroy(): void {
    if (this.options.watch) {
      stopWatching(this.options.configPath);
    }
  }
}

// Export a singleton instance for the default configuration
let defaultManager: ConfigurationManager | null = null;

export function getDefaultConfigManager(): ConfigurationManager {
  if (!defaultManager) {
    defaultManager = new ConfigurationManager({
      configPath: join(process.cwd(), 'config/ai-assistant-actions.json'),
      environment: process.env.NODE_ENV as any,
      watch: process.env.NODE_ENV === 'development',
      cache: true
    });
  }
  return defaultManager;
}