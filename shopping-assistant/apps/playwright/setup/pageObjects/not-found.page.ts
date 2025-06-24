import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class NotFoundPage extends BasePage {
  private readonly accountActionButton = this.page.getByTestId('account-action');
  private readonly contactSection = this.page.getByTestId('section-middle');
  private readonly footerWrapper = this.page.getByTestId('footer');
  private readonly navbarTopWrapper = this.page.getByTestId('navbar-top');
  private readonly searchInput = this.page.getByTestId('input');

  override async goto() {
    return super.goto('/');
  }

  async hasProperLayout() {
    await expect(this.navbarTopWrapper).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.accountActionButton).toBeVisible();
    await expect(this.footerWrapper).toBeVisible();
    await expect(this.contactSection).toBeVisible();
  }

  async prepare() {
    await this.dataFactory.cms.setupCmsEmptyPage(this.db, 'en', '/');

    return this;
  }
}
