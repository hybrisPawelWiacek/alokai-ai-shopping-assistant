import type { MockFactoryContext } from '@core';
import { defineEventHandler, readBody } from 'h3';

import { getShippingAddresses, setShippingAddresses } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/updateCustomerAddress`,
    defineEventHandler(async (event) => {
      const body = await readBody(event);
      const address = {
        id: body[0].id,
        ...body[0].address,
      };

      const addresses = await getShippingAddresses();
      const index = addresses.addresses.findIndex((a) => a.id === address.id);
      addresses.addresses[index] = address;
      setShippingAddresses({ ...addresses, items: addresses.addresses.length });

      return {
        address,
      };
    }),
  );
}
