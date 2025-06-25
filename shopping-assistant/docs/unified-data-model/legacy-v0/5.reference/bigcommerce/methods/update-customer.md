# `UpdateCustomer`
Implements `UpdateCustomer` Unified Method.
        
## Source

```ts
/* eslint-disable etc/throw-error */
import { defineApi, getCurrentCustomer, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";
import { UpdateCustomerResponse } from "@vsf-enterprise/bigcommerce-api";
import { getNormalizers } from "@vue-storefront/unified-data-model";

type UpdateCustomerParams = {
  first_name?: string;
  last_name?: string;
  email?: string;
  id: number;
  origin_channel_id: number;
  channel_ids?: number[];
};

export const updateCustomer = defineApi.updateCustomer(async (context, args) => {
  const { id: customerId, origin_channel_id, channel_ids } = await getCurrentCustomer(context);
  const { normalizeCustomer } = getNormalizers(context);

  const {
    data: { 0: updatedCustomer },
  } = await context.client.v3.put<UpdateCustomerResponse, UpdateCustomerParams[]>("/customers", [
    {
      email: args.email,
      first_name: args.firstName,
      last_name: args.lastName,
      id: customerId,
      origin_channel_id,
      channel_ids,
    },
  ]);

  return { customer: normalizeCustomer(updatedCustomer!, getNormalizerContext(context)) };
});

```
