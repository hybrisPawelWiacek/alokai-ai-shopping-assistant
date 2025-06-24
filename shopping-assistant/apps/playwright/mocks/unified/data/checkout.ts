import { db } from '@setup/db';
import type { SfShippingMethod } from '@vue-storefront/unified-data-model';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function getAvailableShippingMethods(): Promise<{ methods: SfShippingMethod[] }> {
  return (await db.unified.getItem('availableShippingMethods')) ?? { methods: [] };
}

export async function setDefaultAvailableShippingMethods() {
  const data = await readFile(resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'shipping-methods.json'), 'utf8');
  const methods = JSON.parse(data);
  await db.unified.setItem('availableShippingMethods', { methods });
}

export async function getCheckoutOrder() {
  return db.unified.getItem('checkoutOrder') ?? {};
}

export async function setDefaultCheckoutOrder() {
  const data = await readFile(resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'order-details.json'), 'utf8');
  const order = JSON.parse(data);
  await db.unified.setItem('checkoutOrder', order);
}
