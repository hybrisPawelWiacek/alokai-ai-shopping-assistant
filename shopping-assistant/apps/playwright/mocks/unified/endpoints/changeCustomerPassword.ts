import type { MockFactoryContext } from '@core';
import { getChangeCustomerPasswordResponse } from '@mocks/unified/data/my-account';
import { createError, defineEventHandler } from 'h3';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/changeCustomerPassword`,
    defineEventHandler(async () => {
      const res = await getChangeCustomerPasswordResponse();

      if (res == null) {
        return null;
      }

      throw createError(res as unknown as string);
    }),
  );
}
