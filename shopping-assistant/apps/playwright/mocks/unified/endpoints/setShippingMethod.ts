import type { MockFactoryContext } from '@core';
import { createError, defineEventHandler, readBody } from 'h3';

import { getAvailableShippingMethods, getCart, updateCart } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/setShippingMethod`,
    defineEventHandler(async (event) => {
      const body = await readBody(event);
      const { methods } = await getAvailableShippingMethods();
      const shippingMethodId = body[0].shippingMethodId;
      const method = methods.find(({ id }) => id === shippingMethodId);

      if (!method) {
        throw createError({
          message: 'Shipping method not found',
          status: 400,
        });
      }

      await updateCart({
        shippingMethod: method,
        totalShippingPrice: method.price,
      });
      return await getCart();
    }),
  );
}
