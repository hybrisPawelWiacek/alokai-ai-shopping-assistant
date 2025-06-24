import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getOrderDetails } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    '/getOrderDetails',
    defineEventHandler(async () => {
      return await getOrderDetails();
    }),
  );
}
