import type { MockFactoryContext } from '@core';
import { defineEventHandler, readBody } from 'h3';

import { getCart, updateCart } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/setCartAddress`,
    defineEventHandler(async (event) => {
      const body = await readBody(event);

      await updateCart({
        shippingAddress: body[0].shippingAddress,
      });

      return await getCart();
    }),
  );
}
