import { test } from '@setup/test';

test.describe('CartPage', () => {
  test('should render properly for cart with product', async ({ cartPage }) => {
    await cartPage.goto('/cart');

    await cartPage.hasProperLayout();

    await cartPage.matchesDefaultCartPrices();
  });

  test('should redirect to category page on back link click', async ({ cartPage }) => {
    await cartPage.goto('/cart');

    await cartPage.clickBackLink();
    await cartPage.hasURLChangedTo('/category');
  });

  test('should render empty state when cart is empty', async ({ cartPage }) => {
    await cartPage.prepareEmptyCart();

    await cartPage.goto('/cart');

    await cartPage.hasEmptyCartLayout();
  });

  test('should render empty state when remove all products from a cart', async ({ cartPage }) => {
    await cartPage.goto('/cart');

    await cartPage.clickProductCardRemove();

    await cartPage.hasAlertNotification();

    await cartPage.hasEmptyCartLayout();
  });

  test('should apply promo code', async ({ cartPage }) => {
    await cartPage.goto('/cart');

    await cartPage.fillAndSubmitPromoCodeForm();

    await cartPage.hasAlertNotification(true);
    await cartPage.hasPromoCodeLayout();
    await cartPage.notMatchesDefaultCartPrices();

    await cartPage.clickRemovePromoCodeButton();

    await cartPage.hasAlertNotification();
    await cartPage.matchesDefaultCartPrices();
  });

  test('should redirect to product details page from product link', async ({ cartPage }) => {
    await cartPage.goto('/cart');

    await cartPage.clickProductLink();

    await cartPage.hasURLChangedTo('/product/**');
  });

  test('should redirect to checkout', async ({ cartPage }) => {
    await cartPage.goto('/cart');

    await cartPage.clickGoToCheckoutButton();

    await cartPage.hasURLChangedTo('/checkout');
  });
});
