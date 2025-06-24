import { test } from '@setup/test';

test.describe('Homepage', () => {
  test('should render properly', async ({ homepagePage }) => {
    await homepagePage.goto();

    await homepagePage.hasProperLayout();
    await homepagePage.hasHeroSectionFilledWithData();
    await homepagePage.hasCategoriesSectionFilledWithData();

    await homepagePage.clickOrderNowButton();
    await homepagePage.hasURLChangedTo('/product/**');

    await homepagePage.goto();

    await homepagePage.clickShowMoreButton();
    await homepagePage.hasURLChangedTo('/category');
  });
  test('has language switcher', async ({ homepagePage }) => {
    await homepagePage.prepareGermanContent();
    await homepagePage.goto();

    await homepagePage.matchesEnglishTranslatedContent();

    await homepagePage.changeLanguage('de');
    await homepagePage.hasURLChangedTo('/de');
    await homepagePage.notMatchesEnglishTranslatedContent();
  });
  test('has working scroll to top button', async ({ homepagePage }) => {
    await homepagePage.goto();

    await homepagePage.mouseScrollBy(0, 1000);
    await homepagePage.clickScrollTopButton();
    await homepagePage.hasWindowProperty('scrollY', 0);
  });
  test('check if page contains vsf meta tag', async ({ homepagePage }) => {
    await homepagePage.goto();

    await homepagePage.hasVsfMetaTag();
  });
  test('should get cookies with currency', async ({ homepagePage }) => {
    await homepagePage.goto();

    await homepagePage.hasLocaleCookie();
  });
});
