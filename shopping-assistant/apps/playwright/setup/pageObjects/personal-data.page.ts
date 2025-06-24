import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class PersonalDataPage extends BasePage {
  private readonly customerData = this.dataFactory.unified.getCustomerData();
  private readonly userEmailBlock = this.page.getByTestId('account-data-email');
  private readonly userNameBlock = this.page.getByTestId('account-data-name');
  private readonly userPasswordBlock = this.page.getByTestId('account-data-password');

  async hasErrorMessageInPasswordChangeModal() {
    await expect(this.page.getByTestId('modal')).toBeVisible();
    await expect(this.page.getByTestId('modal')).toContainText('password is incorrect');
  }

  async hasProperLayout() {
    await expect(this.page.getByTestId('navbar-top')).toBeVisible();
    await expect(this.page.getByTestId('breadcrumbs')).toBeVisible();
    await expect(this.page.getByTestId('account-layout')).toBeVisible();
    await expect(this.page.getByTestId('account-page-sidebar')).toBeVisible();
    await expect(this.page.getByTestId('footer')).toBeVisible();
  }

  async hasSentPasswordChangeRequest(password: string) {
    return this.page.waitForRequest('**/changeCustomerPassword').then((request) => {
      return expect(request.postDataJSON()).toStrictEqual([
        {
          confirmPassword: password,
          currentPassword: this.customerData.password,
          newPassword: password,
        },
      ]);
    });
  }

  async hasUserDetails(customerData?: Partial<typeof this.customerData>) {
    const userData = {
      ...this.customerData,
      ...customerData,
    };

    await expect(this.userEmailBlock).toBeVisible();
    await expect(this.userEmailBlock.getByTestId('description-body')).toContainText(userData.email);
    await expect(this.userNameBlock).toBeVisible();
    await expect(this.userNameBlock.getByTestId('description-body')).toContainText(
      `${userData.firstName} ${userData.lastName}`,
    );
    await expect(this.userPasswordBlock).toBeVisible();
  }

  async hasUserDetailsUpdated(customerData: Partial<typeof this.customerData>) {
    return this.hasUserDetails(customerData);
  }

  async mockChangePasswordErrorResponse() {
    await this.dataFactory.unified.setChangeCustomerPasswordResponse(400, 'Incorrect password');
  }

  override async prepare(): Promise<this> {
    await this.dataFactory.unified.setEmptyCart();
    await this.dataFactory.unified.setCustomer({
      id: '1',
      ...this.customerData,
    });

    return this;
  }

  async updateUserEmail(email: string) {
    await this.userEmailBlock.getByTestId('button').click();
    await expect(this.page.getByTestId('modal')).toBeVisible();

    const form = this.page.getByTestId('modal').getByTestId('contact-information-form');
    await form.getByTestId('email-input').fill(email);
    await form.getByTestId('save').click();

    await expect(this.page.getByTestId('modal')).toBeHidden();
  }

  async updateUserName(updatedNames: { firstName: string; lastName: string }) {
    const { firstName, lastName } = updatedNames;

    await this.userNameBlock.getByTestId('button').click();
    await expect(this.page.getByTestId('modal')).toBeVisible();

    const form = this.page.getByTestId('modal').getByTestId('account-forms-name');
    await form.getByTestId('first-name-input').fill(firstName);
    await form.getByTestId('last-name-input').fill(lastName);
    await form.getByTestId('save').click();

    await expect(this.page.getByTestId('modal')).toBeHidden();
  }

  async updateUserPassword(password: string) {
    await this.userPasswordBlock.getByTestId('button').click();
    await expect(this.page.getByTestId('modal')).toBeVisible();

    const form = this.page.getByTestId('modal').getByTestId('account-forms-password');
    await form.getByTestId('current-password-input').fill(this.customerData.password);
    await form.getByTestId('new-password-input').fill(password);
    await form.getByTestId('confirm-password-input').fill(password);
    await form.getByTestId('save').click();
  }
}
