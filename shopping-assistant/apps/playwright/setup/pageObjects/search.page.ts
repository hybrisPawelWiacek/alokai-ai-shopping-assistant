import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class SearchPage extends BasePage {
  private readonly categoryFilters = this.page.getByTestId('category-filters');
  private readonly categoryGrid = this.page.getByTestId('category-grid');
  private readonly categoryTitle = this.page.getByTestId('category-title');
  private readonly emptyState = this.page.getByTestId('category-empty-state');
  private readonly pagination = this.page.getByTestId('pagination');
  private readonly productCard = this.page.getByTestId('product-card-vertical');
  private readonly searchForm = this.page.getByTestId('navbar-top').getByRole('search');
  private readonly sortSelect = this.page.getByTestId('select-input');

  async clickOnEmptyStateActionButton() {
    await this.emptyState.locator('a').click();
  }

  async fillSearchForm(value: string, withEmptyResults = false) {
    await (withEmptyResults
      ? this.dataFactory.unified.setEmptySearchProductsResponse()
      : this.dataFactory.unified.setFilteredSearchProductsResponse());
    await this.searchForm.locator('input').fill(value);
    await this.searchForm.getByTestId('search-submit').click();
  }

  async hasEmptyResultsLayout() {
    await expect(this.categoryTitle).toHaveText(/results for \W?\w+\W?/i);
    await expect(this.pagination).toBeHidden();
    await expect(this.categoryFilters).toBeHidden();
    await expect(this.sortSelect).toBeHidden();
    await expect(this.productCard).toBeHidden();

    await expect(this.emptyState).toBeVisible();
    await expect(this.emptyState).toHaveText(/no results found/i);
  }

  async hasProperLayout() {
    await expect(this.categoryTitle).toHaveText(/results for \W?\w+\W?/i);
    await expect(this.categoryGrid).toBeVisible();
    await expect(this.pagination).toBeVisible();
    await expect(this.categoryFilters).toBeVisible();
    await expect(this.sortSelect).toBeVisible();
    expect(await this.productCard.count()).toBeGreaterThan(0);
  }

  override async prepare() {
    await this.dataFactory.cms.setupCmsHomepage(this.db, 'en');
    await this.dataFactory.unified.setDefaultCategories();
    await this.dataFactory.unified.setDefaultCMSProductDetail();
    await this.dataFactory.unified.setDefaultSearchProductsResponse();
    await this.dataFactory.unified.setEmptyCart();
    await this.dataFactory.unified.setGuestCustomer();

    return this;
  }
}
