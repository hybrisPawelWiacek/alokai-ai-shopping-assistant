import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class RegisterPage extends BasePage {
  private readonly email = this.page.getByTestId('email-input');
  private readonly firstName = this.page.getByTestId('first-name-input');
  private readonly lastName = this.page.getByTestId('last-name-input');
  private readonly modal = this.page.getByTestId('modal');
  private readonly newsletterCheckbox = this.page.getByTestId('newsletter-checkbox');
  private readonly password = this.page.getByTestId('password-input');
  private readonly submitButton = this.page.getByTestId('submit-button');
  private readonly termsCheckbox = this.page.getByTestId('terms-checkbox');

  async clickModalButton() {
    await this.modalButton.click();
  }

  async fillNewsletterCheckbox() {
    await this.newsletterCheckbox.check();
  }

  async fillRegisterForm() {
    await this.firstName.fill('John');
    await this.lastName.fill('Doe');
    await this.email.fill('john@doe.com');
    await this.password.fill('Password123!');
    await this.termsCheckbox.check();
  }

  async hasModalOpened() {
    await expect(this.modal).toBeVisible();
    await expect(this.modalButton).toBeVisible();
  }

  async hasProperLayout() {
    await expect(this.page.getByTestId('terms-checkbox')).toBeVisible();
    await expect(this.page.locator('footer')).toBeVisible();

    await expect(this.email).toBeVisible();
    await expect(this.firstName).toBeVisible();
    await expect(this.lastName).toBeVisible();
    await expect(this.newsletterCheckbox).toBeVisible();
    await expect(this.password).toBeVisible();
    await expect(this.termsCheckbox).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  override async prepare(): Promise<this> {
    await this.dataFactory.unified.setEmptyCart();
    await this.dataFactory.unified.setGuestCustomer();
    await this.dataFactory.unified.setRegisterCustomerResponse(this.dataFactory.unified.generateCustomer());
    return this;
  }

  async submitForm() {
    await this.submitButton.click();
  }

  private get modalButton() {
    return this.modal.getByTestId('button').first();
  }
}
