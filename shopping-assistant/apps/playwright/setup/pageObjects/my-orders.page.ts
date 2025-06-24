import { BasePage } from '@core';
import { expect } from '@playwright/test';

export class MyOrdersPage extends BasePage {
  private readonly customerData = this.dataFactory.unified.getCustomerData();
  private readonly firstOrder = this.page.getByTestId('orders-table').getByTestId('orders-table-row').first();
  private readonly orderDetailsButton = this.firstOrder.getByTestId('button');
  private readonly ordersTable = this.page.getByTestId('orders-table');

  private async hasOrderDetailsIn(testId: string) {
    await expect(this.page.getByTestId(testId)).toContainText('Snowboard Ski Tool Red FBI 6');
    await expect(this.page.getByTestId(testId)).toContainText('$38.27');
  }

  async hasOrderDetails() {
    await this.hasURLChangedTo('/my-account/my-orders/**');

    if (this.framework === 'nextjs') {
      await this.hasOrderDetailsIn('order-details-body');
    }
  }

  async hasOrders() {
    await expect(this.ordersTable).toBeVisible();
    await expect(this.firstOrder).toBeVisible();
  }

  async hasProperLayout() {
    await expect(this.page.getByTestId('navbar-top')).toBeVisible();
    await expect(this.page.getByTestId('breadcrumbs')).toBeVisible();
    await expect(this.page.getByTestId('account-layout')).toBeVisible();
    await expect(this.page.getByTestId('account-page-sidebar')).toBeVisible();
    await expect(this.page.getByTestId('footer')).toBeVisible();
  }

  async openOrderDetails() {
    await this.orderDetailsButton.click();
    await this.page.waitForTimeout(1000);
  }

  override async prepare(): Promise<this> {
    await this.dataFactory.unified.setEmptyCart();

    await this.dataFactory.unified.setCustomer({
      id: '1',
      ...this.customerData
    });

    await this.dataFactory.unified.setDefaultOrders();
    await this.dataFactory.unified.setDefaultOrderDetails();
    return this;
  }
}