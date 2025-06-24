import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class CartPage extends BasePage {
  private readonly goToCheckoutButton = this.page.getByTestId('go-to-checkout');
  private readonly header = this.page.getByTestId('cart-header');
  private readonly headerBackLink = this.header.getByTestId('button');
  private readonly orderSummary = this.page.getByTestId('order-summary');
  private readonly productCard = this.page.getByTestId('cart-product-card');
  private readonly promoCodeForm = this.page.getByTestId('applyPromoCode');
  private readonly removePromoCodeButton = this.page.getByTestId('removePromoCode');

  async clickBackLink() {
    await this.dataFactory.unified.setDefaultSearchProductsResponse();

    await this.headerBackLink.click();
  }
  async clickGoToCheckoutButton() {
    await this.goToCheckoutButton.click();
  }

  async clickProductCardRemove() {
    await this.prepareEmptyCart();
    await this.productCard.getByTestId('cart-product-card-remove-btn').click();
  }

  async clickProductLink() {
    await this.productCard.getByTestId('cart-product-card-title').click();
  }

  async clickRemovePromoCodeButton() {
    await this.dataFactory.unified.setCartLineItem();
    await this.removePromoCodeButton.click();
  }

  async fillAndSubmitPromoCodeForm() {
    await this.dataFactory.unified.setCartCoupon();
    await this.promoCodeForm.locator('input').fill('Promo-Code');
    await this.promoCodeForm.locator('button').click();
  }

  async getCartPrices() {
    return {
      regular: (await this.orderSummary.getByTestId('regular-price').isVisible())
        ? await this.orderSummary.getByTestId('regular-price').textContent()
        : null,
      savings: (await this.orderSummary.getByTestId('regular-saving').isVisible())
        ? await this.orderSummary.getByTestId('regular-saving').textContent()
        : null,
      subtotal: await this.orderSummary.getByTestId('special-price').textContent(),
      total: await this.orderSummary.getByTestId('total').textContent(),
    };
  }

  async hasAlertNotification(waitForHidden = false) {
    const alert = this.page.getByTestId('notifications').getByRole('alert');
    await expect(alert).toBeVisible();
    if (waitForHidden) {
      await alert.waitFor({ state: 'hidden' });
    }
  }

  async hasEmptyCartLayout() {
    await expect(this.header.locator('h1')).not.toHaveText('');
    await expect(this.headerBackLink).toBeAttached();
    await expect(this.productCard).toBeHidden();
    await expect(this.orderSummary).toBeHidden();
    await expect(this.page.getByTestId('empty-cart-logo')).toBeVisible();
  }

  async hasPromoCodeLayout() {
    await expect(this.promoCodeForm).toBeHidden();
    await expect(this.removePromoCodeButton).toBeVisible();
  }

  async hasProperLayout() {
    await expect(this.header).toHaveText(/My Cart/);
    await expect(this.headerBackLink).toBeAttached();
    await expect(this.headerBackLink).toHaveAttribute('href', '/category');
    await expect(this.productCard).toBeVisible();
    await expect(this.orderSummary).toBeVisible();
    await expect(this.promoCodeForm).toBeVisible();
    await expect(this.goToCheckoutButton).toBeVisible();
  }

  async matchesDefaultCartPrices() {
    await expect(this.orderSummary.getByTestId('regular-saving')).toBeHidden();
    await expect(this.orderSummary.getByTestId('regular-price')).toBeHidden();
    await this.matchesSnapshot(await this.getCartPrices(), 'cart-prices.json');
  }

  async notMatchesDefaultCartPrices() {
    await this.notMatchesSnapshot(await this.getCartPrices(), 'cart-prices.json');
    await expect(this.orderSummary.getByTestId('regular-saving')).not.toHaveText('');
    await expect(this.orderSummary.getByTestId('regular-price')).not.toHaveText('');
  }

  override async prepare() {
    await this.dataFactory.unified.setCartLineItem();
    await this.dataFactory.unified.setGuestCustomer();

    return this;
  }

  async prepareEmptyCart() {
    await this.dataFactory.unified.setEmptyCart();
  }
}
