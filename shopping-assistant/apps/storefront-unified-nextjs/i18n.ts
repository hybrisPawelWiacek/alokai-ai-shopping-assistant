import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

/**
 * [next-intl](https://next-intl-docs.vercel.app/) is used for the internationalization.
 *
 * To add a new locale:
 * 1. Add the locale to the `locales` array
 * 2. Create a new JSON file in the `lang` directory with the locale name (e.g. `fr.json`)
 * 3. Add a flag icon to the `public/images` directory with the locale name (e.g. `fr-flag.svg`)
 *
 */
export const locales = ['en', 'de'];
export const defaultLocale = 'en';
export const localePrefix: 'always' | 'as-needed' | 'never' = 'as-needed';
export const timeZone = 'Europe/Berlin';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) notFound();

  return {
    messages: (await import(`./lang/${locale}`)).default(),
    timeZone,
  };
});
