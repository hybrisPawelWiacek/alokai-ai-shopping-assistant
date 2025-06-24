import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getShippingAddresses } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/getCustomerAddresses`,
    defineEventHandler(async () => {
      return await getShippingAddresses();
    }),
  );
}
