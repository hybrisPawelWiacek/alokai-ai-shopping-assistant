import { expect, type Page } from '@playwright/test';

import type { CoreFixtures, CoreWorkerFixtures } from './types';

export abstract class BasePage {
  protected dataFactory: CoreFixtures['dataFactory'];
  protected db: CoreFixtures['db'];
  protected framework: CoreWorkerFixtures['framework'];
  protected frontendUrl: CoreWorkerFixtures['frontendUrl'];
  protected page: Page;
  protected utils: CoreFixtures['utils'];

  constructor({
    dataFactory,
    db,
    framework,
    frontendUrl,
    page,
    utils,
  }: { page: Page } & Pick<CoreFixtures, 'dataFactory' | 'db' | 'utils'> &
    Pick<CoreWorkerFixtures, 'framework' | 'frontendUrl'>) {
    this.utils = utils;
    this.dataFactory = dataFactory;
    this.db = db;
    this.frontendUrl = frontendUrl;
    this.page = page;
    this.framework = framework;
  }

  protected async matchesSnapshot(content: Buffer | object | string | unknown[], name?: string | string[]) {
    expect(this.formatSnapshotContent(content)).toMatchSnapshot(name!);
  }

  protected async notMatchesSnapshot(content: Buffer | object | string | unknown[], name?: string | string[]) {
    expect(this.formatSnapshotContent(content)).not.toMatchSnapshot(name!);
  }

  protected abstract prepare(): Promise<this>;

  private formatSnapshotContent(content: Buffer | object | string | unknown[]) {
    if (typeof content === 'object' && !Buffer.isBuffer(content)) {
      return JSON.stringify(content, undefined, 2);
    }

    return content;
  }

  async goto(path: string, options?: Parameters<Page['goto']>[1]) {
    await this.page.goto(`${this.frontendUrl}${path}`, options);
    await this.utils.waitForHydration();
  }

  async hasURLChangedTo(...[url, options]: Parameters<Page['waitForURL']>) {
    await this.page.waitForURL(`${this.frontendUrl}${url}`, options);
  }

  async hasWindowProperty(propertyName: keyof typeof window, expectedValue: unknown) {
    const propertyValue = await this.page.evaluate((propertyName) => window[propertyName], propertyName);
    expect(propertyValue).toBe(expectedValue);
  }

  async mouseScrollBy(deltaX: number, deltaY: number) {
    await this.page.mouse.wheel(deltaX, deltaY);
    await this.utils.waitForScrollEnd();
  }
}
