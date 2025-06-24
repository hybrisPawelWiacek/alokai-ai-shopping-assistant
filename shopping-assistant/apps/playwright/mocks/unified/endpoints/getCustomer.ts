import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getCustomer } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/getCustomer`,
    defineEventHandler(async () => {
      return await getCustomer();
    }),
  );
}
