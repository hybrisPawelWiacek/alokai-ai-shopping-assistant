/**
 * Configuration system exports
 * Provides centralized access to action configuration management
 */

export * from './types';
export * from './loader';
export { ActionRegistryV2, createActionRegistry } from '../actions/registry-v2';

// Re-export for convenience
import { getDefaultConfigManager } from './loader';
import { createActionRegistry } from '../actions/registry-v2';
import type { CommerceState } from '../state';

/**
 * Initialize the AI assistant configuration system
 */
export async function initializeAIAssistant(
  state: CommerceState,
  options?: {
    configPath?: string;
    environment?: 'development' | 'staging' | 'production';
    watch?: boolean;
  }
): Promise<{
  registry: import('../actions/registry-v2').ActionRegistryV2;
  configManager: import('./loader').ConfigurationManager;
}> {
  const configPath = options?.configPath || process.env.AI_ASSISTANT_CONFIG_PATH || 'config/ai-assistant-actions.json';
  
  const registry = await createActionRegistry(state, configPath);
  const configManager = getDefaultConfigManager();
  
  console.log('🤖 AI Assistant initialized with configuration:', {
    configPath,
    environment: options?.environment || process.env.NODE_ENV,
    actionsLoaded: registry.getTools().length
  });
  
  return { registry, configManager };
}