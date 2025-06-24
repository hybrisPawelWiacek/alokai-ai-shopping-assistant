import type { Project } from '@playwright/test';
import type { TestDatabase } from '@setup/db';
import type { DataFactory } from '@setup/fixtures/data';
import type { MiddlewareServer } from '@setup/fixtures/middleware';
import type { Utils } from '@setup/fixtures/utils';
import type { FrontendFrameworks } from '@setup/types';
import type { Router } from 'h3';

export type ModuleConfig = {
  name: string;
  testDir: string;
} & Partial<Project>;

export type CoreFixtures = {
  dataFactory: DataFactory;
  db: TestDatabase;
  utils: Utils;
};

export type CoreWorkerFixtures = {
  debug: boolean;
  dev: boolean;
  framework: FrontendFrameworks;
  frontendUrl: string;
  isB2B: boolean;
  middleware: MiddlewareServer;
};

export type MockFactoryContext = {
  dataFactory: DataFactory;
  db: TestDatabase;
  router: Router;
};

export type RouterFactory = (router: Router) => Router;
