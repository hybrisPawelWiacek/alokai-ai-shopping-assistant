import type { PartialDeep } from 'type-fest';

export function defineConfig<Config>(
  config: DefineMultistoreConfig<Config>,
): MultistoreConfig<typeof config> {
  return {
    getConfig: () => config,
    getDomains: () => Object.keys(config) as (keyof typeof config)[],
  };
}

type DefineMultistoreConfig<TIntegrationConfig> = Record<string, PartialDeep<TIntegrationConfig>>;

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env var: ${key}`);
  }
  return value;
}

type MultistoreConfig<TConfig> = {
  getConfig: () => TConfig;
  getDomains: () => (keyof TConfig)[];
};
