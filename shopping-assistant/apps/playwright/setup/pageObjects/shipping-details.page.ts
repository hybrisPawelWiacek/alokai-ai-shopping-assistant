import { BasePage } from '@core';
import { expect } from '@playwright/test';
import type { SfAddress } from '@vue-storefront/unified-data-model';

export class ShippingDetailsPage extends BasePage {
  private readonly _exampleAddress: SfAddress = {
    address1: '123 Main St',
    address2: 'Apt. 1',
    city: 'New York',
    country: 'US',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '123456789',
    postalCode: '10001',
    state: 'California',
    titleCode: 'Mr.',
  };
  private readonly addAddressButton = this.page.getByTestId('add-address-button');
  private readonly addressesList = this.page.getByTestId('addresses-list');
  private readonly addressForm = this.page.getByTestId('address-form');
  private readonly addressModal = this.page.getByTestId('address-modal');
  private readonly confirmationModal = this.page.getByTestId('confirmation-modal');

  private readonly firstFromList = this.addressesList.getByTestId('addresses-item').first();

  async addNewAddress() {
    await this.addAddressButton.click();

    await expect(this.addressModal).toBeVisible();
  }

  async deleteFirstAddressFromList() {
    await this.firstFromList.getByTestId('delete-address').click();

    await expect(this.confirmationModal).toBeVisible();

    await this.confirmationModal.getByTestId('confirm').click();
  }

  async editFirstAddressFromList() {
    await this.firstFromList.getByTestId('edit-address').click();

    await expect(this.addressModal).toBeVisible();
  }

  async fillAddressForm(address: SfAddress) {
    await this.addressForm.getByTestId('title-select').selectOption({ label: address.titleCode! });
    await this.addressForm.getByTestId('first-name-input').fill(address.firstName!);
    await this.addressForm.getByTestId('last-name-input').fill(address.lastName!);
    await this.addressForm.getByTestId('phone-input').fill(address.phoneNumber!);
    await this.addressForm.getByTestId('country-select').selectOption({ label: address.country! });
    await this.addressForm.getByTestId('street-name-input').fill(address.address1!);
    await this.addressForm.getByTestId('street-number-input').fill(address.address2!);
    await this.addressForm.getByTestId('city-input').fill(address.city!);
    await this.addressForm.getByTestId('state-select').selectOption({ label: address.state! });
    await this.addressForm.getByTestId('postal-code-input').fill(address.postalCode!);

    await this.addressModal.getByTestId('save').click();
  }

  async getFirstAddressFromList() {
    return this.firstFromList.getByTestId('saved-name').textContent();
  }

  async hasAddressDeleted(address: string) {
    await expect(this.addressesList).not.toContainText(address);
  }

  async hasEmptyState() {
    const numberOfAddresses = await this.addressesList.getByTestId('addresses-item').all();
    await expect(numberOfAddresses.length).toBe(0);
  }

  async hasFirstAddressUpdated(address: SfAddress) {
    await expect(this.firstFromList).toContainText(`${address.firstName} ${address.lastName}`);
  }

  async hasProperLayout() {
    await expect(this.page.getByTestId('navbar-top')).toBeVisible();
    await expect(this.page.getByTestId('breadcrumbs')).toBeVisible();
    await expect(this.page.getByTestId('account-layout')).toBeVisible();
    await expect(this.page.getByTestId('account-page-sidebar')).toBeVisible();
    await expect(this.page.getByTestId('footer')).toBeVisible();
  }

  async hasShippingAddresses() {
    await expect(this.addressesList).toBeVisible();
    await expect(this.firstFromList).toBeVisible();
  }

  async hasShippingAddressOnList(address: SfAddress) {
    await expect(this.addressesList).toContainText(`${address.firstName} ${address.lastName}`);
  }

  async mockEmptyResponse() {
    this.dataFactory.unified.setShippingAddresses({ items: 0 });
  }

  override async prepare(): Promise<this> {
    await this.dataFactory.unified.setEmptyCart();
    await this.dataFactory.unified.setCustomer({
      id: '1',
      ...this.dataFactory.unified.getCustomerData(),
    });
    await this.dataFactory.unified.setShippingAddresses({ items: 10 });

    return this;
  }

  get exampleAddress() {
    return { ...this._exampleAddress };
  }
}
