import type { MockFactoryContext } from '@core';
import { generateCustomer, getCustomer, setCustomer } from '@mocks/unified/data/customer';
import { createError, defineEventHandler, readBody } from 'h3';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/loginCustomer`,
    defineEventHandler(async (event) => {
      const [data] = await readBody(event);

      if (!data || data.email.includes('invalid') || data.password.includes('invalid')) {
        throw createError({
          message: 'Invalid credentials',
          statusCode: 401,
          statusMessage: 'Unauthorized',
        });
      }

      await setCustomer({
        ...generateCustomer(),
        ...data,
      });
      return await getCustomer();
    }),
  );
}
