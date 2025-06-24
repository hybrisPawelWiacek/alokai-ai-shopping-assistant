import type { MockFactoryContext } from '@core';
import { createError, defineEventHandler, readBody } from 'h3';

import { getDefaultPaymentTypes } from '../data/checkout';

export default function ({ dataFactory, router }: MockFactoryContext) {
  return router.post(
    `/replaceOrgCartPaymentType`,
    defineEventHandler(async (event) => {
      const [data] = await readBody(event);
      const paymentTypes = getDefaultPaymentTypes().paymentTypes;
      const paymentType = paymentTypes.find((type) => type.code === data.paymentType);

      if (!paymentType) {
        throw createError({
          message: 'Bad Request: Invalid payment type.',
          statusCode: 400,
        });
      }
      await dataFactory.unified.updateCart({ $custom: { paymentType } });

      return await dataFactory.unified.getCart();
    }),
  );
}
