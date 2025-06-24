import { test } from '@setup/test';

test.describe('My Orders Page', () => {
  test('should present customers orders', async ({ myOrdersPage }) => {
    await myOrdersPage.goto('/my-account/my-orders');

    await myOrdersPage.hasProperLayout();
    await myOrdersPage.hasOrders();
  });

  test('should present order details', async ({ myOrdersPage }) => {
    await myOrdersPage.goto('/my-account/my-orders');

    await myOrdersPage.openOrderDetails();

    await myOrdersPage.hasOrderDetails();
  });
});
