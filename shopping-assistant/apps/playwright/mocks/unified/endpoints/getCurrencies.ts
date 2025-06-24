import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

function getCurrencies() {
  return {
    currencies: ['USD', 'EUR', 'GBP'],
    currentCurrency: 'USD',
    defaultCurrency: 'USD',
  };
}

export default function ({ router }: MockFactoryContext) {
  return router
    .post(
      `/getCurrencies`,
      defineEventHandler(() => {
        return getCurrencies();
      }),
    )
    .get(
      `/getCurrencies`,
      defineEventHandler(() => {
        return getCurrencies();
      }),
    );
}
