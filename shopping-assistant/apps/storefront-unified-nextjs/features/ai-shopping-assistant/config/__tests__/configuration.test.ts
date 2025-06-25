import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { readFileSync, writeFileSync, watchFile, unwatchFile } from 'fs';
import { 
  loadConfiguration, 
  stopWatching, 
  clearConfigCache,
  ConfigurationManager 
} from '../loader';
import { ConfigurationFileSchema } from '../types';
import type { ConfigLoaderOptions, ConfigurationFile } from '../types';

// Mock fs module
jest.mock('fs');

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockWatchFile = watchFile as jest.MockedFunction<typeof watchFile>;
const mockUnwatchFile = unwatchFile as jest.MockedFunction<typeof unwatchFile>;

describe('Configuration System', () => {
  const validConfig: ConfigurationFile = {
    version: '1.0.0',
    environment: 'development',
    actions: [
      {
        id: 'test_action',
        name: 'Test Action',
        description: 'A test action',
        category: 'search',
        enabled: true,
        implementation: {
          type: 'function',
          handler: 'testImplementation'
        }
      }
    ],
    globals: {
      security: {
        rateLimit: {
          requests: 100,
          windowMs: 60000
        }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearConfigCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadConfiguration', () => {
    it('should load and validate a JSON configuration file', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify(validConfig));

      const options: ConfigLoaderOptions = {
        configPath: 'config/test.json',
        cache: false
      };

      const config = await loadConfiguration(options);

      expect(config).toEqual(validConfig);
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test.json'),
        'utf-8'
      );
    });

    it('should throw error for invalid configuration', async () => {
      const invalidConfig = {
        version: '1.0.0',
        // Missing required 'actions' field
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(invalidConfig));

      const options: ConfigLoaderOptions = {
        configPath: 'config/invalid.json',
        cache: false
      };

      await expect(loadConfiguration(options)).rejects.toThrow(
        'Configuration validation failed'
      );
    });

    it('should cache configuration when cache is enabled', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify(validConfig));

      const options: ConfigLoaderOptions = {
        configPath: 'config/cached.json',
        cache: true
      };

      // First load
      const config1 = await loadConfiguration(options);
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);

      // Second load should use cache
      const config2 = await loadConfiguration(options);
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
      expect(config2).toEqual(config1);
    });

    it('should apply environment overrides', async () => {
      mockReadFileSync
        .mockReturnValueOnce(JSON.stringify(validConfig))
        .mockReturnValueOnce(JSON.stringify({
          globals: {
            security: {
              rateLimit: {
                requests: 50,
                windowMs: 60000
              }
            }
          }
        }));

      const options: ConfigLoaderOptions = {
        configPath: 'config/base.json',
        environment: 'production',
        cache: false
      };

      const config = await loadConfiguration(options);

      expect(config.globals?.security?.rateLimit?.requests).toBe(50);
    });

    it('should setup hot-reload in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockReadFileSync.mockReturnValue(JSON.stringify(validConfig));

      const options: ConfigLoaderOptions = {
        configPath: 'config/hot-reload.json',
        watch: true,
        cache: false
      };

      await loadConfiguration(options);

      expect(mockWatchFile).toHaveBeenCalledWith(
        expect.stringContaining('hot-reload.json'),
        expect.any(Object),
        expect.any(Function)
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('ConfigurationManager', () => {
    it('should initialize and load configuration', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify(validConfig));

      const manager = new ConfigurationManager({
        configPath: 'config/manager.json',
        cache: false
      });

      await manager.initialize();

      const config = manager.getConfig();
      expect(config).toEqual(validConfig);
    });

    it('should get action by id', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify(validConfig));

      const manager = new ConfigurationManager({
        configPath: 'config/manager.json',
        cache: false
      });

      await manager.initialize();

      const action = manager.getAction('test_action');
      expect(action).toEqual(validConfig.actions[0]);

      const notFound = manager.getAction('non_existent');
      expect(notFound).toBeUndefined();
    });

    it('should check if action is enabled', async () => {
      const configWithModes: ConfigurationFile = {
        ...validConfig,
        actions: [
          {
            ...validConfig.actions[0],
            enabled: true,
            modes: {
              b2c: { enabled: true },
              b2b: { enabled: false }
            }
          }
        ]
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(configWithModes));

      const manager = new ConfigurationManager({
        configPath: 'config/manager.json',
        cache: false
      });

      await manager.initialize();

      expect(manager.isActionEnabled('test_action')).toBe(true);
      expect(manager.isActionEnabled('test_action', 'b2c')).toBe(true);
      expect(manager.isActionEnabled('test_action', 'b2b')).toBe(false);
    });

    it('should get actions by category', async () => {
      const multiActionConfig: ConfigurationFile = {
        ...validConfig,
        actions: [
          { ...validConfig.actions[0], category: 'search' },
          { ...validConfig.actions[0], id: 'action2', category: 'cart' },
          { ...validConfig.actions[0], id: 'action3', category: 'search' }
        ]
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(multiActionConfig));

      const manager = new ConfigurationManager({
        configPath: 'config/manager.json',
        cache: false
      });

      await manager.initialize();

      const searchActions = manager.getActionsByCategory('search');
      expect(searchActions).toHaveLength(2);
      expect(searchActions.every(a => a.category === 'search')).toBe(true);
    });

    it('should handle hot-reload updates', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockReadFileSync.mockReturnValue(JSON.stringify(validConfig));

      let reloadCallback: Function | undefined;
      mockWatchFile.mockImplementation((path, options, callback) => {
        reloadCallback = callback as Function;
      });

      const onReloadMock = jest.fn();
      const manager = new ConfigurationManager({
        configPath: 'config/manager.json',
        watch: true,
        cache: false,
        onReload: onReloadMock
      });

      await manager.initialize();

      // Simulate file change
      const updatedConfig = {
        ...validConfig,
        actions: [
          ...validConfig.actions,
          {
            id: 'new_action',
            name: 'New Action',
            description: 'Added via hot-reload',
            category: 'cart',
            enabled: true,
            implementation: {
              type: 'function',
              handler: 'newImplementation'
            }
          }
        ]
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(updatedConfig));

      // Trigger reload
      if (reloadCallback) {
        // Simulate the debounced timeout
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Configuration Validation', () => {
    it('should validate parameter schemas', () => {
      const configWithParams = {
        ...validConfig,
        actions: [
          {
            ...validConfig.actions[0],
            parameters: {
              query: {
                type: 'string',
                required: true,
                min: 2,
                max: 100
              },
              limit: {
                type: 'number',
                required: false,
                default: 20,
                min: 1,
                max: 100
              }
            }
          }
        ]
      };

      const result = ConfigurationFileSchema.safeParse(configWithParams);
      expect(result.success).toBe(true);
    });

    it('should validate security settings', () => {
      const configWithSecurity = {
        ...validConfig,
        actions: [
          {
            ...validConfig.actions[0],
            security: {
              requiresAuth: true,
              requiredPermissions: ['read', 'write'],
              rateLimit: {
                requests: 10,
                windowMs: 60000
              },
              inputValidation: {
                maxLength: 1000,
                bannedPatterns: ['<script>', 'onclick'],
                allowedDomains: ['example.com']
              }
            }
          }
        ]
      };

      const result = ConfigurationFileSchema.safeParse(configWithSecurity);
      expect(result.success).toBe(true);
    });

    it('should validate UDL integration settings', () => {
      const configWithUDL = {
        ...validConfig,
        actions: [
          {
            ...validConfig.actions[0],
            udl: {
              methods: ['sdk.unified.searchProducts'],
              dataFlow: 'read',
              caching: {
                enabled: true,
                ttlSeconds: 300,
                invalidateOn: ['product_update']
              }
            }
          }
        ]
      };

      const result = ConfigurationFileSchema.safeParse(configWithUDL);
      expect(result.success).toBe(true);
    });

    it('should reject invalid enum values', () => {
      const invalidConfig = {
        ...validConfig,
        actions: [
          {
            ...validConfig.actions[0],
            category: 'invalid_category' // Not in enum
          }
        ]
      };

      const result = ConfigurationFileSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors gracefully', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const options: ConfigLoaderOptions = {
        configPath: 'config/missing.json',
        cache: false
      };

      await expect(loadConfiguration(options)).rejects.toThrow('File not found');
    });

    it('should handle JSON parse errors', async () => {
      mockReadFileSync.mockReturnValue('{ invalid json');

      const options: ConfigLoaderOptions = {
        configPath: 'config/invalid.json',
        cache: false
      };

      await expect(loadConfiguration(options)).rejects.toThrow();
    });

    it('should provide clear validation error messages', async () => {
      const invalidConfig = {
        version: '1.0.0',
        actions: [
          {
            id: 'test',
            // Missing required fields: name, description, category, implementation
          }
        ]
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(invalidConfig));

      const options: ConfigLoaderOptions = {
        configPath: 'config/invalid.json',
        cache: false
      };

      try {
        await loadConfiguration(options);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Configuration validation failed');
        expect(error.message).toContain('actions.0.name');
        expect(error.message).toContain('actions.0.description');
      }
    });
  });
});