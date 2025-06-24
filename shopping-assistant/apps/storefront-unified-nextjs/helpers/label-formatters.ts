/**
 * @description Creates a currency formatter
 *
 * @param {string} locale - The locale to use
 *
 * @example
 * const currencyFormatter = createCurrencyFormatter('en-US');
 * currencyFormatter('USD', true); // USD (US Dollar)
 */
export function createCurrencyFormatter(locale: string) {
  return (currency?: string, long = false) => {
    if (!currency) return '';
    const currencyName = long ? ` - ${getCurrencyDisplayName(locale, currency)}` : '';
    return `${currency} (${getCurrencySymbol(locale, currency)})${currencyName}`;
  };
}

/**
 * @description Creates a language formatter
 *
 * @param {string} locale - The locale to use
 *
 * @example
 * const languageFormatter = createLanguageFormatter('en-US');
 * languageFormatter('en'); // EN - English
 */
export function createLanguageFormatter(locale: string) {
  const languageNames = new Intl.DisplayNames([locale], { type: 'language' });
  return (language: string) => {
    return [language.toUpperCase(), languageNames.of(language)].join(' - ');
  };
}

function getCurrencySymbol(locale: string, currency: string) {
  const numberFormat = currencyFormatter(locale, currency);
  return numberFormat.formatToParts().find((part) => part.type === 'currency')?.value;
}

function currencyFormatter(locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    currency,
    style: 'currency',
  });
}

function getCurrencyDisplayName(locale: string, currency: string) {
  const currencyNames = new Intl.DisplayNames([locale], { type: 'currency' });
  return currencyNames.of(currency);
}
