import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class ProductDetailsPage extends BasePage {
  private readonly accordionItem = this.page.getByTestId('accordion-item');

  private readonly addToCartButton = this.page.getByTestId('add-to-cart-button');
  private readonly breadcrumbs = this.page.getByTestId('breadcrumbs');

  private readonly cartBadge = this.page.getByTestId('navbar-top').getByTestId('cart-badge');
  private readonly customerReviews = this.page.getByTestId('customer-reviews');
  private readonly gallery = this.page.getByTestId('gallery');

  private readonly longDescription = this.accordionItem.first().getByTestId('product-description');
  private readonly notificationAlert = this.page.getByTestId('notifications').getByRole('alert');
  private readonly productName = this.page.getByTestId('purchase-card').getByTestId('product-name');
  private readonly productPrice = this.page.getByTestId('purchase-card').getByTestId('price');
  private readonly productProperties = this.page.getByTestId('product-properties');

  private readonly purchaseCard = this.page.getByTestId('purchase-card');

  private readonly quantitySelector = this.purchaseCard.getByTestId('quantity-selector');

  private readonly shortDescription = this.purchaseCard.getByTestId('product-description');

  async addProductToCart() {
    await this.dataFactory.unified.setCartLineItem();

    /*
     * [PATCH] Due to issues with Nuxt reactivity in playwright, button has to be enabled manually in this case.
     */
    await this.addToCartButton.evaluate((button: HTMLButtonElement) => (button.disabled = false));

    await expect(this.addToCartButton).toBeEnabled();

    await this.addToCartButton.click();
  }

  async clickCustomerReviewsAccordion() {
    const reviewsAccordion = this.accordionItem.last();
    await reviewsAccordion.scrollIntoViewIfNeeded();

    await reviewsAccordion.click();

    await expect(reviewsAccordion).toHaveAttribute('open');
  }

  async clickProductVariant() {
    const variantChip = this.page.getByTestId('size-chip-pdp').first();
    await variantChip.scrollIntoViewIfNeeded();

    await variantChip.locator('label').click();

    await expect(variantChip.locator('input')).toBeChecked();
  }

  async getProductData() {
    return {
      name: await this.productName.textContent(),
      price: await this.productPrice.textContent(),
    };
  }

  async hasCartBadgeWithValue(value: string) {
    await expect(this.cartBadge).toBeVisible();
    await expect(this.cartBadge).toHaveText(value);
  }

  async hasCustomerReviews() {
    await expect(this.customerReviews).toBeVisible();

    expect(await this.customerReviews.getByTestId('review').count()).toBeGreaterThan(0);
  }

  async hasNotificationAlert() {
    await expect(this.notificationAlert).toBeVisible();
  }

  async hasProperLayout() {
    await expect(this.breadcrumbs).toBeVisible();

    await expect(this.gallery).toBeVisible();
    await expect(this.productProperties).toBeVisible();

    await expect(this.productName).toBeVisible();
    await expect(this.productName).not.toHaveText('');

    await expect(this.productPrice).toBeVisible();
    await expect(this.productPrice).toHaveText(/\$\d+\.\d{2}/);

    await expect(this.quantitySelector).toBeVisible();
    await expect(this.addToCartButton).toBeVisible();
    await expect(this.shortDescription).toBeVisible();

    expect(await this.accordionItem.count()).toBe(2);

    await expect(this.longDescription).toBeVisible();

    await expect(this.customerReviews).toBeHidden();
  }

  async matchesDefaultProductVariantContent() {
    await this.matchesSnapshot(await this.getProductData(), 'product-variant.json');
  }

  async notMatchesDefaultProductVariantContent() {
    await this.notMatchesSnapshot(await this.getProductData(), 'product-variant.json');
  }

  override async prepare() {
    await this.dataFactory.unified.setDefaultCategories();
    await this.dataFactory.unified.setDefaultCMSProductDetail();
    await this.dataFactory.unified.setDefaultSearchProductsResponse();
    await this.dataFactory.unified.setEmptyCart();
    await this.dataFactory.unified.setGuestCustomer();
    await this.dataFactory.unified.setDefaultProductReviews();

    return this;
  }

  async prepareProductVariantContent() {
    await this.dataFactory.unified.setDefaultSearchProductsResponse();
    await this.dataFactory.unified.setProductDetailVariant();
  }
}
