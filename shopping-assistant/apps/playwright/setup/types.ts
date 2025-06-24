import type { WorkerInfo } from '@playwright/test';

export type FrontendServer = {
  baseUrl: string;
  close: () => Promise<void> | void;
  port: string;
};

export type FrontendFrameworks = 'nextjs';

export type Config = {
  debug: boolean;
  dev: boolean;
  framework: FrontendFrameworks;
  isB2B: boolean;
};

export type InternalFixtureContext = {
  debug: boolean;
  dev: boolean;
  framework: FrontendFrameworks;
  middlewarePort: string;
  workerInfo: WorkerInfo;
};