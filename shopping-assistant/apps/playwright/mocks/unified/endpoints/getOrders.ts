import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getOrders } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    '/getOrders',
    defineEventHandler(async () => {
      return await getOrders();
    }),
  );
}
