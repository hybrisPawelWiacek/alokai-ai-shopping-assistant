import type { MockFactoryContext } from '@core';
import { defineEventHandler, readBody } from 'h3';

import { getShippingAddresses, setShippingAddresses } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/deleteCustomerAddress`,
    defineEventHandler(async (event) => {
      const body = await readBody(event);
      const addressId = body[0].id;

      const addresses = await getShippingAddresses();
      const index = addresses.addresses.findIndex((a) => a.id === addressId);
      addresses.addresses.splice(index, 1);
      setShippingAddresses({ ...addresses, items: addresses.addresses.length });

      return null;
    }),
  );
}
