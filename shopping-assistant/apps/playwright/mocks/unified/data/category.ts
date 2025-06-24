import { db } from '@setup/db';
import type { SfCategory } from '@vue-storefront/unified-data-model';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function addCategories(categories: SfCategory[] = []) {
  const currentCategories = ((await db.unified.getItem('categories')) as unknown[]) ?? [];
  await db.unified.setItem('categories', [...currentCategories, ...categories]);
}

export async function setDefaultCategories() {
  const defaultCategories = await readFile(
    resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'default-categories.json'),
    'utf8',
  );
  const categories = JSON.parse(defaultCategories);
  await db.unified.setItem('categories', categories);
}

export async function getCategories() {
  return (await db.unified.getItem<SfCategory[]>('categories')) ?? [];
}

export async function setDefaultCategory() {
  const categoryData = await readFile(resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'category.json'), 'utf8');
  const category = JSON.parse(categoryData);
  await db.unified.setItem('category', category);
}

export async function setActiveCategory() {
  const categoryData = await readFile(
    resolve(fileURLToPath(import.meta.url), '..', 'dumps', 'category-clothes.json'),
    'utf8',
  );
  const category = JSON.parse(categoryData);
  await db.unified.setItem('category', category);
}

export async function getCategory() {
  return (await db.unified.getItem('category')) ?? {};
}
