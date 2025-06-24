import type { MockFactoryContext } from '@core';
import { getProductDetail } from '@mocks/unified/data/product';
import { defineEventHandler } from 'h3';

export default function ({ router }: MockFactoryContext) {
  return router
    .post(
      `/getProductDetails`,
      defineEventHandler(async () => {
        return await getProductDetail();
      }),
    )
    .get(
      `/getProductDetails`,
      defineEventHandler(async () => {
        return await getProductDetail();
      }),
    );
}
