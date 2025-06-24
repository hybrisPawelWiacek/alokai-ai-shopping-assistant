import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getCart } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router
    .post(
      `/getCart`,
      defineEventHandler(async () => {
        return await getCart();
      }),
    )
    .get(
      `/getCart`,
      defineEventHandler(async () => {
        return await getCart();
      }),
    );
}
