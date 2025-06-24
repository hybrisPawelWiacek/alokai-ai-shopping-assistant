import type { MockFactoryContext } from '@core';
import { defineEventHandler } from 'h3';

import { getAvailableShippingMethods } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router
    .post(
      `/getAvailableShippingMethods`,
      defineEventHandler(async () => {
        return await getAvailableShippingMethods();
      }),
    )
    .get(
      `/getAvailableShippingMethods`,
      defineEventHandler(async () => {
        return await getAvailableShippingMethods();
      }),
    );
}
