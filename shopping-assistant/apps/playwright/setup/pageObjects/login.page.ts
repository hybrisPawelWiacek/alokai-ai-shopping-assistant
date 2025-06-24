import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class LoginPage extends BasePage {
  private readonly email = this.page.getByTestId('email-input');
  private readonly errorAlert = this.page.locator('form').getByRole('alert');
  private readonly password = this.page.getByTestId('password-input');
  private readonly registerLink = this.page.getByTestId('register-link');
  private readonly remebmerMeCheckbox = this.page.locator('form input[type="checkbox"]');
  private readonly submitButton = this.page.getByTestId('submit-button');

  async checkRememberMe() {
    await this.remebmerMeCheckbox.check();
  }
  async clickRegisterLink() {
    await this.registerLink.click();
  }

  async fillForm({ email, password }: { email: string; password: string }) {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  async getLoginCredentials() {
    return {
      email: 'test@email.com',
      password: 'Password123!',
    };
  }

  async hasErrorAlert() {
    await expect(this.errorAlert).toBeVisible();
  }

  async hasProperLayout() {
    await expect(this.page.locator('footer')).toBeVisible();

    await expect(this.email).toBeVisible();
    await expect(this.password).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.registerLink).toBeVisible();
  }
  override async prepare(): Promise<this> {
    await this.dataFactory.unified.setGuestCustomer();
    await this.dataFactory.unified.setEmptyCart();

    return this;
  }

  async submitForm() {
    await this.submitButton.scrollIntoViewIfNeeded();
    await this.submitButton.click();
  }
}
