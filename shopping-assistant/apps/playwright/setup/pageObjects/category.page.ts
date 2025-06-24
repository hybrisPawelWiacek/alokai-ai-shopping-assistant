import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class CategoryPage extends BasePage {
  private readonly breadcrumbs = this.page.getByTestId('breadcrumbs');
  private readonly cartBadge = this.page.getByTestId('navbar-top').getByTestId('cart-badge');
  private readonly categoryFilters = this.page.getByTestId('category-filters');
  private readonly categoryGrid = this.page.getByTestId('category-grid');
  private readonly categoryTitle = this.page.getByTestId('category-title');
  private readonly categoryTree = this.page.getByTestId('category-tree');
  private readonly categoryTreeCurrent = this.page.getByTestId('category-tree-current');
  private readonly clearAllFiltersButton = this.page.getByTestId('clear-all-filters-button');
  private readonly notificationAlert = this.page.getByTestId('notifications').getByRole('alert');
  private readonly pagination = this.page.getByTestId('pagination');
  private readonly sortSelect = this.page.getByTestId('select-input');

  async addProductToCart() {
    await this.dataFactory.unified.setCartLineItem();
    await this.categoryGrid.getByTestId('add-to-cart-button').first().click();
  }

  async changeSort(value: string) {
    await this.sortSelect.selectOption(value);
  }

  async clearFilters() {
    await this.clearAllFiltersButton.click();
  }

  async clickBreadcrumb(text: string) {
    await this.breadcrumbs.getByTestId('breadcrumb-link').filter({ hasText: text }).click();
  }

  async clickCategoryTreeItem() {
    await this.dataFactory.unified.setActiveCategory();
    await this.categoryTree.getByTestId('category-tree-item').first().click();
  }

  async clickFilter(name: string, value: string) {
    await this.dataFactory.unified.setFilteredSearchProductsResponse();
    await this.categoryFilters.locator(`#${name}`).locator('label', { hasText: value }).click();
  }

  async clickPaginationPage(page: number) {
    await this.dataFactory.unified.setFilteredSearchProductsResponse({ page });
    await this.pagination.getByTestId(`pagination-page-${page}`).click();
  }

  async clickProductCardLink() {
    await this.categoryGrid.getByTestId('product-card-vertical').first().getByTestId('link').click();
  }

  override async goto() {
    return super.goto('/category');
  }

  async hasActivePaginationPage(page: number) {
    await expect(this.pagination.getByTestId(`pagination-page-${page}`)).toHaveAttribute('aria-current', 'true');
  }

  async hasBreadcrumbFilledWithData() {
    await expect(this.breadcrumbs).toBeVisible();
    expect(await this.breadcrumbs.getByTestId('breadcrumb-link').count()).toBeGreaterThanOrEqual(2);
  }

  async hasCartBadgeWithValue(value: string) {
    await expect(this.cartBadge).toBeVisible();
    await expect(this.cartBadge).toHaveText(value);
  }

  async hasCategoryFiltersFilledWithData() {
    await expect(this.categoryFilters).toBeVisible();
    expect(await this.categoryFilters.getByTestId('accordion-item').count()).toBeGreaterThan(0);
  }

  async hasCategoryGridFilledWithData() {
    await expect(this.categoryGrid).toBeVisible();
    expect(await this.categoryGrid.getByTestId('product-card-vertical').count()).toBeGreaterThan(0);
    await expect(this.page.getByTestId('products-count')).toBeVisible();
    await expect(this.pagination).toBeVisible();
  }

  async hasCategoryTreeFilledWithData() {
    await expect(this.categoryTree).toBeVisible();
    await expect(this.categoryTree.getByTestId('filter-category-heading')).not.toHaveText('');
    expect(await this.categoryTree.getByTestId('category-tree-item').count()).toBeGreaterThan(0);
  }

  async hasLayoutWithCurrentCategory() {
    await expect(this.categoryTreeCurrent).toBeVisible();
    await expect(this.categoryTitle).not.toHaveText('All products');
    await expect(this.page).not.toHaveTitle(/All products/);
    expect(await this.breadcrumbs.getByTestId('breadcrumb-link').count()).toBeGreaterThanOrEqual(3);
  }

  async hasNotificationAlert() {
    await expect(this.notificationAlert).toBeVisible();
  }

  async hasProperHeadings() {
    await expect(this.page).toHaveTitle(/All products/);
    await expect(this.categoryTitle).toHaveText('All products');
  }

  async prepare() {
    await this.dataFactory.unified.setDefaultCategories();
    await this.dataFactory.unified.setDefaultCategory();
    await this.dataFactory.unified.setDefaultSearchProductsResponse();
    await this.dataFactory.unified.setEmptyCart();
    await this.dataFactory.unified.setGuestCustomer();
    await this.dataFactory.unified.setDefaultCMSProductDetail();

    return this;
  }

  async urlIncludes(value: RegExp | string) {
    await this.page.waitForFunction(
      (value) => {
        const url = window.location.href;
        if (typeof value === 'string') {
          return url.includes(value);
        } else if (value instanceof RegExp) {
          return value.test(url);
        }
        return false;
      },
      value,
      { timeout: 5000 },
    );
  }
}
