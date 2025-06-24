import { createStorage } from 'unstorage';

const unified = createStorage();
unified.setItem('category', {});
unified.setItem('categories', []);
unified.setItem('cart', {});
unified.setItem('customer', {});
unified.setItem('productDetail', {});
unified.setItem('products', {});
unified.setItem('productReviews', {});

const cms = createStorage<string>();

export const db = {
  cms,
  unified,
};

export type TestDatabase = typeof db;
