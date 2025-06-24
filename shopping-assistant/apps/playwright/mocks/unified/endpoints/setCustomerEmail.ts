import type { MockFactoryContext } from '@core';
import { defineEventHandler, readBody } from 'h3';

import { getCart, updateCart } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/setCustomerEmail`,
    defineEventHandler(async (event) => {
      const body = await readBody(event);
      await updateCart({ customerEmail: body[0].email });

      return await getCart();
    }),
  );
}
