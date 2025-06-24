import type { MockFactoryContext } from '@core';
import { defineEventHandler, readBody } from 'h3';

import { getShippingAddresses, setShippingAddresses } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/createCustomerAddress`,
    defineEventHandler(async (event) => {
      const body = await readBody(event);
      const address = {
        ...body[0].address,
        id: Date.now(),
      };

      const addresses = await getShippingAddresses();
      addresses.addresses.push(address);
      setShippingAddresses({ ...addresses, items: addresses.addresses.length });

      return {
        address,
      };
    }),
  );
}
