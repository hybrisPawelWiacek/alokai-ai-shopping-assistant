import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

export default function ({ dataFactory, router }: MockFactoryContext) {
  return router.post(
    `/createOrder`,
    defineEventHandler(async () => {
      return dataFactory.unified.getCheckoutOrder();
    }),
  );
}
