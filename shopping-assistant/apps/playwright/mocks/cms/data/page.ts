import type { TestDatabase } from '@setup/db';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function setupCmsHomepage(db: TestDatabase, lang: 'de' | 'en') {
  await db.cms.setItem(`/:${lang}`, JSON.stringify(await getHomepage(lang)));
}

export async function setupCmsEmptyPage(db: TestDatabase, lang: 'de' | 'en', url = '/') {
  await db.cms.setItem(`${url}:${lang}`, JSON.stringify(getEmptyPage()));
}

export async function getPage(db: TestDatabase, pageUrl: string, lang: 'de' | 'en' = 'en') {
  if (lang === 'en' || lang === 'de') {
    const json = await db.cms.getItem(`${pageUrl}:${lang}`);
    if (json) {
      return json;
    }
    return getEmptyPage();
  }

  throw new Error('Language not supported');
}

export async function getHomepage(lang: 'de' | 'en' = 'en') {
  const originalHomePageResponse = await readFile(
    resolve(fileURLToPath(import.meta.url), '..', `homepage-${lang}.json`),
    'utf8',
  );
  return JSON.parse(originalHomePageResponse);
}

export function getEmptyPage() {
  return {
    componentsAboveFold: [],
    componentsBelowFold: [],
  };
}
