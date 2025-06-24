import type { MockFactoryContext } from '@core';
import { defineEventHandler, readBody } from 'h3';

import { getCustomer, setCustomer } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/updateCustomer`,
    defineEventHandler(async (event) => {
      const payload = await readBody(event);
      const currentCustomer = await getCustomer();

      const updatedCustomer = {
        ...currentCustomer?.customer,
        ...payload[0],
      };

      await setCustomer(updatedCustomer);

      return {
        customer: updatedCustomer,
      };
    }),
  );
}
