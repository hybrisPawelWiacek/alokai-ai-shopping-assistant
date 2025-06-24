import { test } from '@setup/test';

test.describe('Not Found', () => {
  test('has empty state', async ({ notFoundPage }) => {
    await notFoundPage.goto();

    await notFoundPage.hasProperLayout();
  });
});
