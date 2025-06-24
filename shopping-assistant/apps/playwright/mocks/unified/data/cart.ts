import { db } from '@setup/db';
import type { SfCart } from '@vue-storefront/unified-data-model';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function setEmptyCart() {
  const cart = await readFile(resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'empty-cart.json'), 'utf8');
  db.unified.setItem('cart', JSON.parse(cart));
}

export async function getCart() {
  return db.unified.getItem('cart') ?? {};
}

export async function setCartLineItem() {
  const cart = await readFile(resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'cart-with-product.json'), 'utf8');
  db.unified.setItem('cart', JSON.parse(cart));
}

export async function setCartCoupon() {
  const cart = await readFile(resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'cart-with-coupon.json'), 'utf8');

  db.unified.setItem('cart', JSON.parse(cart));
}

export async function removeCartCoupon() {
  await setCartLineItem();
}

export async function updateCart(cartData: Partial<SfCart>) {
  const cart = (await getCart()) as SfCart;
  if (Object.keys(cartData).length === 0) {
    throw new Error('Cart data is empty');
  }
  const updatedCart = Object.assign(cart, cartData);

  return db.unified.setItem('cart', updatedCart);
}
