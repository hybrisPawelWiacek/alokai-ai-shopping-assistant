import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getCategory } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router
    .post(
      `/getCategory`,
      defineEventHandler(async () => {
        return await getCategory();
      }),
    )
    .get(
      `/getCategory`,
      defineEventHandler(async () => {
        return await getCategory();
      }),
    );
}
