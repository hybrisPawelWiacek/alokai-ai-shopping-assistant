import { test } from '@setup/test';

test.describe('SearchPage', () => {
  test('should navigate to search page and render results', async ({ searchPage }) => {
    await searchPage.goto('/');

    await searchPage.fillSearchForm('value');

    await searchPage.hasURLChangedTo('/**/search?search=value');
    await searchPage.hasProperLayout();
  });

  test('should navigate to search page and render empty results', async ({ searchPage }) => {
    await searchPage.goto('/');

    await searchPage.fillSearchForm('invalid', true);

    await searchPage.hasURLChangedTo('/**/search?search=invalid');
    await searchPage.hasEmptyResultsLayout();

    await searchPage.clickOnEmptyStateActionButton();
    await searchPage.hasURLChangedTo('/category');
  });
});
