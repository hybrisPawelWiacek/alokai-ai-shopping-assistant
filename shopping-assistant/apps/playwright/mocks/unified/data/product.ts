import { db } from '@setup/db';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function setDefaultCMSProductDetail() {
  const defaultCmdProductFile = await readFile(
    resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'product-details-300026688.json'),
    'utf8',
  );
  const defaultCmsProduct = JSON.parse(defaultCmdProductFile);
  await db.unified.setItem('productDetail', defaultCmsProduct);
}

export async function getProducts() {
  return (await db.unified.getItem('products')) ?? {};
}

export async function setDefaultSearchProductsResponse() {
  const response = await readFile(
    resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'search-products.json'),
    'utf8',
  );
  await db.unified.setItem('products', response);
}

function getEmptySearch() {
  return {
    facets: [],
    pagination: {
      currentPage: 0,
      pageSize: 24,
      totalPages: 0,
      totalResults: 0,
    },
    products: [],
  };
}

export async function setEmptySearchProductsResponse() {
  await db.unified.setItem('products', getEmptySearch());
}

export async function setFilteredSearchProductsResponse({ page }: { page?: number } = {}) {
  const response = await readFile(
    resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'search-products-filter.json'),
    'utf8',
  );
  const parsedResponse = JSON.parse(response);
  parsedResponse.pagination.currentPage = page ?? 1;
  await db.unified.setItem('products', parsedResponse);
}

export async function getProductDetail() {
  return db.unified.getItem('productDetail') ?? {};
}

export async function setDefaultProductReviews() {
  const data = await readFile(resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'product-reviews.json'), 'utf8');
  const defaultCmsProduct = JSON.parse(data);
  await db.unified.setItem('productReviews', defaultCmsProduct);
}

export async function getProductReviews() {
  return db.unified.getItem('productReviews') ?? {};
}
export async function setProductDetailVariant() {
  const data = await readFile(
    resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'product-details-300026688-variant.json'),
    'utf8',
  );
  await db.unified.setItem('productDetail', JSON.parse(data));
}
