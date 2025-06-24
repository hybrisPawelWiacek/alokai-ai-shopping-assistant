/* eslint-disable playwright/expect-expect */
import { test } from '../test';

test.describe('CheckoutB2bPage', () => {
  test('should redirect to login for guest user', async ({ checkoutB2bPage }) => {
    await checkoutB2bPage.setGuestUser();

    await checkoutB2bPage.goto('/checkout');

    await checkoutB2bPage.hasURLChangedTo('/login');
  });

  test('should render page', async ({ checkoutB2bPage }) => {
    await checkoutB2bPage.goto('/checkout');
    await checkoutB2bPage.hasProperLayout();

    await checkoutB2bPage.matchesDefaultCartPrices();
  });

  test('should perform B2B checkout with credit card payment', async ({ checkoutB2bPage }) => {
    await checkoutB2bPage.goto('/checkout');

    await checkoutB2bPage.hasCartEmail(checkoutB2bPage.customerData.email);

    await checkoutB2bPage.selectFirstSavedShippingAddress();
    await checkoutB2bPage.hasShippingAddress();
    await checkoutB2bPage.hasAlertNotification(true);

    await checkoutB2bPage.hasShippingMethods();

    await checkoutB2bPage.selectFirstShippingMethod();
    await checkoutB2bPage.hasShippingMethodSelected();
    await checkoutB2bPage.hasBillingAddressSet();

    await checkoutB2bPage.selectPaymentMethod(/card payment/i);
    await checkoutB2bPage.hasCreditCardPaymentMethodForm();
    await checkoutB2bPage.setCreditCardPaymentData({
      ccExpiryMonth: '12',
      ccExpiryYear: '2025',
      ccNumber: '4111111111111111',
    });

    await checkoutB2bPage.checkTermsCheckbox();

    await checkoutB2bPage.clickPlaceOrderButton();
    await checkoutB2bPage.hasNoValidationAlert();

    await checkoutB2bPage.hasURLChangedTo('/order/success');
  });

  test('should perform B2B checkout with account payment', async ({ checkoutB2bPage }) => {
    await checkoutB2bPage.goto('/checkout');

    await checkoutB2bPage.hasCartEmail(checkoutB2bPage.customerData.email);

    await checkoutB2bPage.selectFirstSavedShippingAddress();
    await checkoutB2bPage.hasShippingAddress();
    await checkoutB2bPage.hasAlertNotification(true);

    await checkoutB2bPage.hasShippingMethods();

    await checkoutB2bPage.selectFirstShippingMethod();
    await checkoutB2bPage.hasShippingMethodSelected();
    await checkoutB2bPage.hasBillingAddressSet();

    await checkoutB2bPage.selectPaymentMethod(/account payment/i);

    await checkoutB2bPage.checkTermsCheckbox();

    await checkoutB2bPage.clickPlaceOrderButton();
    await checkoutB2bPage.hasNoValidationAlert();

    await checkoutB2bPage.hasURLChangedTo('/order/success');
  });

  test('should display validation alert when data are not complete', async ({ checkoutB2bPage }) => {
    await checkoutB2bPage.goto('/checkout');

    await checkoutB2bPage.clickPlaceOrderButton();

    await checkoutB2bPage.hasValidationAlert();
  });

  test('should redirect to the "/cart" page when cart is empty', async ({ checkoutB2bPage }) => {
    await checkoutB2bPage.setEmptyCart();

    await checkoutB2bPage.goto('/checkout');

    await checkoutB2bPage.hasURLChangedTo('/cart');
  });
});
