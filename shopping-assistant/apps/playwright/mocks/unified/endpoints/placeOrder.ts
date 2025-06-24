import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getCheckoutOrder } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router
    .post(
      `/placeOrder`,
      defineEventHandler(async () => {
        return await getCheckoutOrder();
      }),
    )
    .get(
      `/placeOrder`,
      defineEventHandler(async () => {
        return await getCheckoutOrder();
      }),
    );
}
