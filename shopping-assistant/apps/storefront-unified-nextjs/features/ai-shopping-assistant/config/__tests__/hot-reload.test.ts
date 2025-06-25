import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { readFileSync, watchFile, unwatchFile } from 'fs';
import { loadConfiguration, stopWatching, clearConfigCache } from '../loader';
import type { ConfigLoaderOptions, ConfigurationFile } from '../types';

// Mock fs module
jest.mock('fs');

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockWatchFile = watchFile as jest.MockedFunction<typeof watchFile>;
const mockUnwatchFile = unwatchFile as jest.MockedFunction<typeof unwatchFile>;

describe('Hot Reload Configuration', () => {
  const baseConfig: ConfigurationFile = {
    version: '1.0.0',
    environment: 'development',
    actions: [
      {
        id: 'search',
        name: 'Search Products',
        description: 'Search for products',
        category: 'search',
        enabled: true,
        implementation: {
          type: 'function',
          handler: 'searchImplementation'
        }
      }
    ]
  };

  const updatedConfig: ConfigurationFile = {
    ...baseConfig,
    actions: [
      ...baseConfig.actions,
      {
        id: 'new_action',
        name: 'New Action',
        description: 'Added via hot reload',
        category: 'cart',
        enabled: true,
        implementation: {
          type: 'function',
          handler: 'newActionImplementation'
        }
      }
    ]
  };

  let watchCallback: Function | null = null;
  let originalEnv: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    clearConfigCache();
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Capture the watch callback
    mockWatchFile.mockImplementation((path, options, callback) => {
      watchCallback = callback as Function;
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    watchCallback = null;
  });

  it('should setup file watcher in development mode with watch enabled', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(baseConfig));

    const options: ConfigLoaderOptions = {
      configPath: 'config/test.json',
      watch: true,
      cache: false
    };

    await loadConfiguration(options);

    expect(mockWatchFile).toHaveBeenCalledWith(
      expect.stringContaining('test.json'),
      { interval: 1000 },
      expect.any(Function)
    );
  });

  it('should not setup file watcher in production mode', async () => {
    process.env.NODE_ENV = 'production';
    mockReadFileSync.mockReturnValue(JSON.stringify(baseConfig));

    const options: ConfigLoaderOptions = {
      configPath: 'config/test.json',
      watch: true,
      cache: false
    };

    await loadConfiguration(options);

    expect(mockWatchFile).not.toHaveBeenCalled();
  });

  it('should reload configuration when file changes', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(baseConfig));

    const onReloadCallback = jest.fn();
    const options: ConfigLoaderOptions = {
      configPath: 'config/test.json',
      watch: true,
      cache: false,
      onReload: onReloadCallback
    };

    await loadConfiguration(options);

    // Simulate file change
    mockReadFileSync.mockReturnValue(JSON.stringify(updatedConfig));
    
    if (watchCallback) {
      watchCallback();
      // Wait for debounce timeout
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Verify cache was cleared and callback was called
    expect(onReloadCallback).toHaveBeenCalledWith(updatedConfig);
  });

  it('should handle reload errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockReadFileSync.mockReturnValue(JSON.stringify(baseConfig));

    const options: ConfigLoaderOptions = {
      configPath: 'config/test.json',
      watch: true,
      cache: false
    };

    await loadConfiguration(options);

    // Simulate file change with invalid JSON
    mockReadFileSync.mockReturnValue('{ invalid json');
    
    if (watchCallback) {
      watchCallback();
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to reload configuration'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should debounce multiple rapid file changes', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(baseConfig));

    const onReloadCallback = jest.fn();
    const options: ConfigLoaderOptions = {
      configPath: 'config/test.json',
      watch: true,
      cache: false,
      onReload: onReloadCallback
    };

    await loadConfiguration(options);

    // Simulate multiple rapid file changes
    if (watchCallback) {
      watchCallback();
      await new Promise(resolve => setTimeout(resolve, 50));
      watchCallback();
      await new Promise(resolve => setTimeout(resolve, 50));
      watchCallback();
      
      // Wait for debounce timeout
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Should only reload once due to debouncing
    expect(onReloadCallback).toHaveBeenCalledTimes(1);
  });

  it('should stop watching when stopWatching is called', () => {
    stopWatching('config/test.json');

    expect(mockUnwatchFile).toHaveBeenCalledWith(
      expect.stringContaining('test.json')
    );
  });

  it('should clear cache on reload', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(baseConfig));

    const options: ConfigLoaderOptions = {
      configPath: 'config/test.json',
      watch: true,
      cache: true
    };

    // Load initial config
    const config1 = await loadConfiguration(options);
    expect(config1.actions).toHaveLength(1);

    // Simulate file change
    mockReadFileSync.mockReturnValue(JSON.stringify(updatedConfig));
    
    if (watchCallback) {
      watchCallback();
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Load config again - should get updated version
    const config2 = await loadConfiguration(options);
    expect(config2.actions).toHaveLength(2);
  });

  it('should log reload success message', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    mockReadFileSync.mockReturnValue(JSON.stringify(baseConfig));

    const options: ConfigLoaderOptions = {
      configPath: 'config/test.json',
      watch: true,
      cache: false
    };

    await loadConfiguration(options);

    // Simulate successful file change
    mockReadFileSync.mockReturnValue(JSON.stringify(updatedConfig));
    
    if (watchCallback) {
      watchCallback();
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('🔄 Reloading configuration')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✅ Configuration reloaded successfully'
    );

    consoleLogSpy.mockRestore();
  });
});