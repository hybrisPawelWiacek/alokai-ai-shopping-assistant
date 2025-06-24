/* eslint-disable perfectionist/sort-classes */
import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class CheckoutB2bPage extends BasePage {
  private _customerData = this.dataFactory.unified.generateCustomer();
  private contactInformation = this.page.getByTestId('contact-information');
  private shippingAddress = this.page.getByTestId('checkout-address');
  private shippingMethod = this.page.getByTestId('shipping-method');
  private billingAddress = this.page.getByTestId('billing-address');
  private orderSummary = this.page.getByTestId('order-summary');
  private paymentTypes = this.page.getByTestId('payment-types');
  private b2bCardPayment = this.page.getByTestId('b2b-card-payment');
  private termsCheckbox = this.page.getByTestId('checkout-checkbox-terms');
  private placeOrderButton = this.page.getByTestId('place-order');
  private checkoutValidationAlert = this.page.getByTestId('checkout-validation-alert');

  get customerData() {
    return this._customerData;
  }

  async hasProperLayout() {
    await expect(this.page.locator('footer')).toBeVisible();
    await expect(this.contactInformation).toBeVisible();
    await expect(this.shippingAddress).toBeVisible();
    await expect(this.shippingMethod).toBeVisible();
    await expect(this.paymentTypes).toBeVisible();
    await expect(this.billingAddress).toBeVisible();
    await expect(this.orderSummary).toBeVisible();
  }

  async matchesDefaultCartPrices() {
    await expect(this.orderSummary.getByTestId('regular-saving')).toBeHidden();
    await expect(this.orderSummary.getByTestId('regular-price')).toBeHidden();
    await expect(this.orderSummary.getByTestId('delivery-cost')).toContainText('--');
  }

  async hasCartEmail(email: string) {
    await expect(this.contactInformation.getByTestId('add-button')).toBeHidden();

    await expect(this.page.getByTestId('customer-email')).toContainText(email);
  }

  async hasShippingAddress() {
    await expect(this.shippingAddress.getByTestId('add-button')).toBeHidden();

    await expect(this.page.getByTestId('saved-address')).toBeVisible();
  }

  async hasBillingAddressSet() {
    await expect(this.page.getByTestId('billing-address-same-address')).toBeVisible();
  }

  async hasAlertNotification(waitForHidden = false) {
    const alert = this.page.getByTestId('notifications').getByRole('alert');
    await expect(alert).toBeVisible();
    if (waitForHidden) {
      await alert.waitFor({ state: 'hidden' });
    }
  }

  async hasShippingMethods() {
    const shippingMethods = this.shippingMethod.getByTestId('shippingMethod');
    await expect(shippingMethods.first()).toBeVisible();
  }

  async selectFirstShippingMethod() {
    const shippingMethods = this.shippingMethod.getByTestId('shippingMethod');
    await shippingMethods.first().click();
  }

  async hasShippingMethodSelected() {
    await expect(this.shippingMethod.getByTestId('shippingMethod').first().locator('input')).toBeChecked();

    await expect(this.orderSummary.getByTestId('delivery-cost')).toContainText('$');
  }

  async selectPaymentMethod(paymentMethodText: RegExp | string) {
    const paymentMethod = this.paymentTypes
      .getByTestId('payment-type-list-item')
      .filter({ hasText: paymentMethodText });

    await paymentMethod.click();

    await expect(paymentMethod.locator('input')).toBeChecked();
  }

  async hasCreditCardPaymentMethodForm() {
    const paymentMethodForm = this.b2bCardPayment.locator('form');

    await expect(paymentMethodForm).toBeVisible();
  }

  async setCreditCardPaymentData(payment: { ccExpiryMonth: string; ccExpiryYear: string; ccNumber: string }) {
    const paymentForm = this.b2bCardPayment.locator('form');

    await paymentForm.getByTestId('cc-number').fill(payment.ccNumber);
    await paymentForm.getByTestId('cc-expiry-month').selectOption({ label: payment.ccExpiryMonth });
    await paymentForm.getByTestId('cc-expiry-year').selectOption({ label: payment.ccExpiryYear });
  }

  async checkTermsCheckbox() {
    await this.termsCheckbox.click();
  }

  async clickPlaceOrderButton() {
    await this.placeOrderButton.click();
  }

  async hasNoValidationAlert() {
    await expect(this.checkoutValidationAlert).toBeHidden();
    await expect(this.page.getByTestId('checkout-checkbox-terms-error').first()).toBeHidden();
  }

  async hasValidationAlert() {
    await expect(this.checkoutValidationAlert).toBeVisible();
    await expect(this.page.getByTestId('checkout-checkbox-terms-error').first()).toBeVisible();
  }

  async setEmptyCart() {
    await this.dataFactory.unified.setEmptyCart();
  }

  async selectFirstSavedShippingAddress() {
    const modalButton = this.shippingAddress.getByTestId('add-button');
    await modalButton.click();
    const modal = this.page.getByRole('dialog');

    await expect(modal).toBeVisible();

    const addressListItems = modal.getByTestId('address-list-item');
    const addressListItemsCount = await addressListItems.count();
    expect(addressListItemsCount).toBeGreaterThan(0);

    await addressListItems.first().click();
    await modal.getByTestId('save').click();

    await expect(modal).toBeHidden();
  }

  async setGuestUser() {
    await this.dataFactory.unified.setGuestCustomer();
  }

  override async prepare() {
    await this.dataFactory.unified.setCustomer(this.customerData);
    await this.dataFactory.unified.setCartLineItem();
    await this.dataFactory.unified.updateCart({ customerEmail: this.customerData.email });
    await this.dataFactory.unified.setDefaultAvailableShippingMethods();
    await this.dataFactory.unified.setDefaultCheckoutOrder();
    await this.dataFactory.unified.setShippingAddresses({ items: 2 });

    return this;
  }
}
