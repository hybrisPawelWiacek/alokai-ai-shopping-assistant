import type { Page } from '@playwright/test';
import type { FrontendFrameworks } from '@setup/types';

export type Utils = {
  waitForHydration: () => Promise<void>;
  waitForScrollEnd: () => Promise<void>;
};

export async function utilsFixture(
  use: (utils: Utils) => Promise<void>,
  page: Page,
  framework: FrontendFrameworks
): Promise<void> {
  await use({
    waitForHydration: () => waitForHydration({
      framework,
      page
    }),

    waitForScrollEnd: () => waitForScrollEnd({
      page
    })
  });
}

async function waitForHydration(
  {
    framework,
    page
  }: {
    framework: FrontendFrameworks;
    page: Page;
  }
): Promise<void> {
  if (framework === 'nextjs') {
    await new Promise(resolve => {
      page.waitForLoadState('networkidle').then(() => resolve(true)).catch(() => resolve(false));
      setTimeout(() => resolve(true), 2000);
    });
  }
}

async function waitForScrollEnd(
  {
    page
  }: {
    page: Page;
  }
): Promise<void> {
  await page.evaluate(async () => {
    const settleScrollEndOrTimeout = () => new Promise(resolve => {
      const onScrollEnd = () => {
        window.removeEventListener('scrollend', onScrollEnd);
        resolve(true);
      };

      const onScrollEndTimeout = () => {
        window.removeEventListener('scrollend', onScrollEnd);
        resolve(false);
      };

      window.addEventListener('scrollend', onScrollEnd);
      setTimeout(onScrollEndTimeout, 2000);
    });

    await settleScrollEndOrTimeout();
  });

  await page.waitForTimeout(250);
}