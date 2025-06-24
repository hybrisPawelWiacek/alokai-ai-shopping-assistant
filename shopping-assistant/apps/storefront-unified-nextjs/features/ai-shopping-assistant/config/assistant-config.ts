import type { AssistantConfiguration } from '../types/action-definition';

/**
 * Default configuration for the AI Shopping Assistant
 * This configuration drives all behavior and can be overridden at runtime
 */
export const defaultAssistantConfig: AssistantConfiguration = {
  actions: {}, // Will be populated by action definitions
  
  security: {
    enableInputValidation: true,
    enableOutputValidation: true,
    maxRequestsPerMinute: 60,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  },
  
  performance: {
    responseTimeTarget: 250, // Target: 200-250ms as per requirements
    enableCaching: true,
    cacheStrategy: 'memory',
    maxConcurrentActions: 5
  },
  
  monitoring: {
    enableTracing: true,
    enableMetrics: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    customLoggers: []
  }
};

/**
 * Configuration builder for creating custom configurations
 */
export class AssistantConfigBuilder {
  private config: AssistantConfiguration;

  constructor(baseConfig: AssistantConfiguration = defaultAssistantConfig) {
    this.config = JSON.parse(JSON.stringify(baseConfig)); // Deep clone
  }

  setSecurity(security: Partial<AssistantConfiguration['security']>): this {
    this.config.security = { ...this.config.security, ...security };
    return this;
  }

  setPerformance(performance: Partial<AssistantConfiguration['performance']>): this {
    this.config.performance = { ...this.config.performance, ...performance };
    return this;
  }

  setMonitoring(monitoring: Partial<AssistantConfiguration['monitoring']>): this {
    this.config.monitoring = { ...this.config.monitoring, ...monitoring };
    return this;
  }

  addLogger(logger: (entry: any) => void): this {
    this.config.monitoring.customLoggers = [
      ...(this.config.monitoring.customLoggers || []),
      logger
    ];
    return this;
  }

  build(): AssistantConfiguration {
    return this.config;
  }
}

/**
 * Environment-based configuration loader
 */
export function loadConfigFromEnvironment(): AssistantConfiguration {
  const builder = new AssistantConfigBuilder();

  // Load security settings from environment
  if (process.env.MAX_REQUESTS_PER_MINUTE) {
    builder.setSecurity({
      maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE, 10)
    });
  }

  // Load performance settings from environment
  if (process.env.RESPONSE_TIME_TARGET) {
    builder.setPerformance({
      responseTimeTarget: parseInt(process.env.RESPONSE_TIME_TARGET, 10)
    });
  }

  if (process.env.ENABLE_CACHING === 'false') {
    builder.setPerformance({ enableCaching: false });
  }

  // Load monitoring settings from environment
  if (process.env.LOG_LEVEL) {
    builder.setMonitoring({
      logLevel: process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error'
    });
  }

  if (process.env.ENABLE_TRACING === 'false') {
    builder.setMonitoring({ enableTracing: false });
  }

  return builder.build();
}