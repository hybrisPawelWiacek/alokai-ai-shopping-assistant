import { faker } from '@faker-js/faker';
import { db } from '@setup/db';
import type { SfCustomer } from '@vue-storefront/unified-data-model';

export async function setCustomer(customer: SfCustomer) {
  db.unified.setItem('customer', {
    customer,
  });
}

export async function setGuestCustomer() {
  db.unified.setItem('customer', {
    customer: null,
  });
}

export async function getCustomer(): Promise<{ customer: null | SfCustomer }> {
  return (
    (await db.unified.getItem('customer')) ?? {
      customer: null,
    }
  );
}

export async function getRegisterCustomerResponse() {
  return (
    db.unified.getItem('registerCustomerResponse') ?? {
      customer: null,
    }
  );
}

export async function setRegisterCustomerResponse() {
  db.unified.setItem('registerCustomerResponse', {
    customer: null,
  });
}

export function generateCustomer() {
  return {
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    id: faker.string.uuid(),
    lastName: faker.person.lastName(),
  };
}
