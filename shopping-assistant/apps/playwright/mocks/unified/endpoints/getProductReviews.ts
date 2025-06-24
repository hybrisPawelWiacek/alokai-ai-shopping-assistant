import type { MockFactoryContext } from '@core';
import { getProductReviews } from '@mocks/unified/data/product';
import { defineEventHandler } from 'h3';

export default function ({ router }: MockFactoryContext) {
  return router
    .post(
      `/getProductReviews`,
      defineEventHandler(async () => {
        return await getProductReviews();
      }),
    )
    .get(
      `/getProductReviews`,
      defineEventHandler(async () => {
        return await getProductReviews();
      }),
    );
}
