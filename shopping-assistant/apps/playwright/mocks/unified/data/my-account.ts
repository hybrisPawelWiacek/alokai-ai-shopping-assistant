import { faker } from '@faker-js/faker';
import { db } from '@setup/db';
import type { SfCustomerAddress } from '@vue-storefront/unified-data-model';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorageValue } from 'unstorage';

export function getCustomerData() {
  return {
    email: 'joe@doe.com',
    firstName: 'Joe',
    lastName: 'Doe',
    password: 'Password123!',
  };
}

export async function getChangeCustomerPasswordResponse() {
  return db.unified.getItem('changeCustomerPasswordResponse') ?? null;
}

export async function setChangeCustomerPasswordResponse(status: number, message: string) {
  await db.unified.setItem('changeCustomerPasswordResponse', {
    message,
    status,
  });
}

export async function setShippingAddresses({ items }: { items: number }) {
  const addresses = Array.from({ length: items }, () => ({
    address1: faker.location.streetAddress(),
    address2: faker.location.buildingNumber(),
    city: faker.location.city(),
    country: 'US',
    firstName: faker.person.firstName('male'),
    id: faker.string.uuid(),
    lastName: faker.person.lastName(),
    phoneNumber: faker.phone.number(),
    postalCode: '10001',
    state: 'NY',
    titleCode: 'Mr.',
  }));

  await db.unified.setItem('shippingAddresses', {
    addresses,
  });
}

export async function getShippingAddresses(): Promise<{ addresses: SfCustomerAddress[] }> {
  return (await db.unified.getItem('shippingAddresses')) ?? { addresses: [] };
}

export async function setOrderDetails(orderDetails: unknown) {
  await db.unified.setItem('orderDetails', orderDetails as StorageValue);
}

export async function getOrderDetails() {
  return db.unified.getItem('orderDetails') ?? {};
}

export async function loadExampleOrderDetails() {
  const data = await readFile(resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'order-details.json'), 'utf8');
  return JSON.parse(data);
}

export async function setDefaultOrderDetails() {
  const orderDetails = await loadExampleOrderDetails();
  await setOrderDetails(orderDetails);
}

export async function setDefaultOrders() {
  const orders = Array.from({ length: 3 }, (_, index) => ({
    id: `${index + 1}`,
    orderDate: new Date().toISOString(),
    status: 'READY',
    totalPrice: {
      amount: faker.commerce.price(),
      currency: 'USD',
      precisionAmount: faker.commerce.price(),
    },
  }));

  await db.unified.setItem('orders', {
    orders,
  });
}

export async function getOrders() {
  return db.unified.getItem('orders') ?? { orders: [] };
}
