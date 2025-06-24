import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getProducts } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router
    .post(
      `/searchProducts`,
      defineEventHandler(async () => {
        return await getProducts();
      }),
    )
    .get(
      `/searchProducts`,
      defineEventHandler(async () => {
        return await getProducts();
      }),
    );
}
