import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class HomepagePage extends BasePage {
  private readonly accountActionButton = this.page.getByTestId('account-action');
  private readonly categoriesSection = this.page.getByTestId('grid').first();
  private readonly contactSection = this.page.getByTestId('section-middle');
  private readonly footerWrapper = this.page.getByTestId('footer');
  private readonly heroSection = this.page.getByTestId('hero');
  private readonly languageSelect = this.page.getByTestId('language-select');
  private readonly navbarTopWrapper = this.page.getByTestId('navbar-top');
  private readonly orderNowButton = this.page.getByTestId('button-order-now');
  private readonly regionSaveButton = this.page.getByTestId('region-save-button');
  private readonly scrollTopButton = this.page.getByTestId('scroll-top').getByTestId('button');
  private readonly searchInput = this.page.getByTestId('input');
  private readonly showMoreButton = this.page.getByTestId('button-show-more');
  private readonly userSettingsActionButton = this.page.getByTestId('user-settings-action');

  private async getTranslatedContent() {
    return {
      accountActionLabel: (await this.accountActionButton.textContent()) ?? '',
      heroTitle: (await this.heroSection.getByTestId('section-title').textContent()) ?? '',
      locationActionLabel: (await this.userSettingsActionButton.textContent()) ?? '',
    };
  }

  async changeLanguage(lang: string) {
    await this.userSettingsActionButton.click();
    await this.languageSelect.selectOption(lang);
    await this.regionSaveButton.click();
  }

  async clickOrderNowButton() {
    await this.orderNowButton.click();
  }

  async clickScrollTopButton() {
    await this.scrollTopButton.click();
    await this.utils.waitForScrollEnd();
  }

  async clickShowMoreButton() {
    await this.showMoreButton.click();
  }

  override async goto() {
    return super.goto('/');
  }

  async hasCategoriesSectionFilledWithData() {
    await expect(this.categoriesSection).toBeVisible();
    expect(await this.categoriesSection.locator('> div').all()).toHaveLength(3);
  }

  async hasHeroSectionFilledWithData() {
    await expect(this.heroSection).toBeVisible();
    await expect(this.heroSection.getByTestId('section-title')).not.toHaveText('');
    await expect(this.heroSection.getByTestId('section-subtitle')).not.toHaveText('');
    await expect(this.heroSection.getByTestId('section-description')).not.toHaveText('');
  }

  async hasLocaleCookie() {
    expect(await this.page.context().cookies()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'vsf-locale',
          value: 'en',
        }),
      ]),
    );
  }

  async hasProperLayout() {
    await expect(this.page).toHaveTitle(/Alokai/);
    await expect(this.navbarTopWrapper).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.userSettingsActionButton).toBeVisible();
    await expect(this.accountActionButton).toBeVisible();
    await expect(this.footerWrapper).toBeVisible();
    await expect(this.contactSection).toBeVisible();
  }

  async hasVsfMetaTag() {
    await expect(this.page.locator('meta[name="generator"]')).toHaveAttribute('content', 'Vue Storefront 2');
  }

  async matchesEnglishTranslatedContent() {
    await this.matchesSnapshot(await this.getTranslatedContent(), 'translated-content.json');
  }

  async notMatchesEnglishTranslatedContent() {
    await this.notMatchesSnapshot(await this.getTranslatedContent(), 'translated-content.json');
  }

  async prepare() {
    await this.dataFactory.cms.setupCmsHomepage(this.db, 'en');
    await this.dataFactory.unified.setDefaultCategories();
    await this.dataFactory.unified.setActiveCategory();
    await this.dataFactory.unified.setDefaultCMSProductDetail();
    await this.dataFactory.unified.setDefaultSearchProductsResponse();
    await this.dataFactory.unified.setEmptyCart();
    await this.dataFactory.unified.setGuestCustomer();

    return this;
  }

  async prepareGermanContent() {
    await this.dataFactory.cms.setupCmsHomepage(this.db, 'de');
  }
}
