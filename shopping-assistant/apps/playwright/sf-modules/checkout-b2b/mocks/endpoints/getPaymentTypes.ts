import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getDefaultPaymentTypes } from '../data/checkout';

export default function ({ router }: MockFactoryContext) {
  return router
    .post(
      `/getPaymentTypes`,
      defineEventHandler(async () => {
        return getDefaultPaymentTypes();
      }),
    )
    .get(
      `/getPaymentTypes`,
      defineEventHandler(async () => {
        return getDefaultPaymentTypes();
      }),
    );
}
