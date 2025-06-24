import { test } from '@setup/test';

test.describe('CategoryPage', () => {
  test('should render properly', async ({ categoryPage }) => {
    await categoryPage.goto();

    await categoryPage.hasURLChangedTo('/category');
    await categoryPage.hasProperHeadings();
    await categoryPage.hasBreadcrumbFilledWithData();

    await categoryPage.hasCategoryTreeFilledWithData();
    await categoryPage.hasCategoryFiltersFilledWithData();

    await categoryPage.hasCategoryGridFilledWithData();

    await categoryPage.clickProductCardLink();
    await categoryPage.hasURLChangedTo('/product/**');

    await categoryPage.goto();
  });

  test('should select category', async ({ categoryPage }) => {
    await categoryPage.goto();

    await categoryPage.clickCategoryTreeItem();
    await categoryPage.hasURLChangedTo('/category/**');

    await categoryPage.hasLayoutWithCurrentCategory();
  });

  test('should select product filter', async ({ categoryPage }) => {
    await categoryPage.goto();

    await categoryPage.clickFilter('swatchColors', 'black');
    await categoryPage.urlIncludes('swatchColors=BLACK');

    await categoryPage.clearFilters();

    await categoryPage.hasURLChangedTo('/category**');
    await categoryPage.urlIncludes(/^((?!(swatchColors=)).)*$/);

    await categoryPage.changeSort('price-low-to-high');

    await categoryPage.urlIncludes(/(sortBy|sort)=price-low-to-high/);
  });

  test('should paginate data', async ({ categoryPage }) => {
    await categoryPage.goto();

    await categoryPage.clickPaginationPage(2);

    await categoryPage.hasActivePaginationPage(2);
    await categoryPage.urlIncludes(/page=2/i);
  });

  test('should navigate with breadcrumbs', async ({ categoryPage }) => {
    await categoryPage.goto();

    await categoryPage.clickCategoryTreeItem();
    await categoryPage.hasLayoutWithCurrentCategory();

    await categoryPage.clickBreadcrumb('All products');
    await categoryPage.hasURLChangedTo('/category');

    await categoryPage.clickBreadcrumb('Home');
    await categoryPage.hasURLChangedTo('/');
  });

  test('should add product to cart', async ({ categoryPage }) => {
    await categoryPage.goto();

    await categoryPage.addProductToCart();

    await categoryPage.hasCartBadgeWithValue('1');
    await categoryPage.hasNotificationAlert();
  });
});
