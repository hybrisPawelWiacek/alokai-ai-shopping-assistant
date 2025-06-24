import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getCategories } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router
    .post(
      `/getCategories`,
      defineEventHandler(async () => {
        return await getCategories();
      }),
    )
    .get(
      `/getCategories`,
      defineEventHandler(async () => {
        return await getCategories();
      }),
    );
}
