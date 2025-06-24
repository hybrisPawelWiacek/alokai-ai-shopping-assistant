import type { MockFactoryContext } from '@core';
import { getRegisterCustomerResponse } from '@mocks/unified/data/customer';
import { defineEventHandler } from 'h3';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/registerCustomer`,
    defineEventHandler(async () => {
      return await getRegisterCustomerResponse();
    }),
  );
}
