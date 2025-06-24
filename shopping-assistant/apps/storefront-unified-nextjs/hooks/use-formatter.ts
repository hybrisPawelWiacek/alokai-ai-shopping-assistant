import { useFormatter as useNextIntlFormatter } from 'next-intl';

import type { SfMoney } from '@/types';

type PriceLike = Omit<SfMoney, 'precisionAmount'>;
type FormatOrOptions = Parameters<ReturnType<typeof useNextIntlFormatter>['dateTime']>[1];

export interface UseFormatter {
  /**
   * @description Function to format a date according to the user's locale.
   * @param date - The date to format.
   * @param formatOrOptions - The format or options to use when formatting the date. Options overrides the default format.
   */
  formatDate: (date: Date | number | string, formatOrOptions?: FormatOrOptions) => string;
  /**
   * @description Function to format a date and time according to the user's locale.
   * @param date - The date to format.
   * @param formatOrOptions - The format or options to use when formatting the date. Options overrides the default format.
   */
  formatDateTime: (date: Date | number | string, formatOrOptions?: FormatOrOptions) => string;
  /**
   * @description Function to format a price according to the user's locale and currency.
   * @param price - The price to format.
   */
  formatPrice: (price: PriceLike) => string;
}

/**
 * @description Hook that returns functions to format price and dates according to the user's locale and currency.
 *
 * @returns
 * An object with a formatting functions.
 *
 * @example
 * const { formatDate, formatPrice } = useFormatter();
 * formatPrice({ amount: 100, currency: 'USD' }); // $100.00
 * formatPrice({ amount: 100, currency: 'EUR' }); // €100.00
 */
export function useFormatter(): UseFormatter {
  const formatter = useNextIntlFormatter();
  const formatPrice: UseFormatter['formatPrice'] = (price) =>
    formatter.number(price.amount, {
      currency: price.currency,
      style: 'currency',
    });
  const formatDate: UseFormatter['formatDate'] = (date, formatOrOptions) =>
    formatter.dateTime(
      new Date(date),
      formatOrOptions ?? {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      },
    );
  const formatDateTime: UseFormatter['formatDate'] = (date, formatOrOptions) =>
    formatter.dateTime(
      new Date(date),
      formatOrOptions ?? {
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        month: 'short',
        year: 'numeric',
      },
    );

  return { formatDate, formatDateTime, formatPrice };
}
