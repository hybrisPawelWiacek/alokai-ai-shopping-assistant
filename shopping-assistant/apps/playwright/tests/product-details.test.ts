import { test } from '@setup/test';

test.describe('ProductDetailsPage', () => {
  test('should render proper layout', async ({ productDetailsPage }) => {
    await productDetailsPage.goto('/product/product-slug/product-id?sku=product-sku');

    await productDetailsPage.hasProperLayout();
  });

  test('should add product to cart', async ({ productDetailsPage }) => {
    await productDetailsPage.goto('/product/product-slug/product-id?sku=product-sku');

    await productDetailsPage.addProductToCart();

    await productDetailsPage.hasCartBadgeWithValue('1');
    await productDetailsPage.hasNotificationAlert();
  });

  test('should render customer reviews', async ({ productDetailsPage }) => {
    await productDetailsPage.goto('/product/product-slug/product-id?sku=product-sku');

    await productDetailsPage.clickCustomerReviewsAccordion();

    await productDetailsPage.hasCustomerReviews();
  });

  test('should select product variant', async ({ productDetailsPage }) => {
    await productDetailsPage.goto('/product/product-slug/product-id?sku=product-sku');

    await productDetailsPage.matchesDefaultProductVariantContent();

    await productDetailsPage.prepareProductVariantContent();

    await productDetailsPage.clickProductVariant();

    await productDetailsPage.hasURLChangedTo('/product/*/*?sku=300026679');

    await productDetailsPage.notMatchesDefaultProductVariantContent();

    await productDetailsPage.hasProperLayout();
  });
});
