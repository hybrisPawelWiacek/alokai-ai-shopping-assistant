# `SetCartAddress`
Implements `SetCartAddress` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizedCart, getNormalizerContext, getShipmentId } from "@vsf-enterprise/unified-api-sfcc";
import {
  SfCreateAddressBody,
  SfCustomerAddress,
  getNormalizers,
} from "@vue-storefront/unified-data-model";
import "./extended.d";

export const setCartAddress = defineApi.setCartAddress(async (context, args) => {
  const { shippingAddress } = args;
  const { unnormalizeAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);
  const shipmentId = getShipmentId(context);

  if (!isAddressValid(shippingAddress)) {
    throw { message: "The provided address doesn't have all required fields.", status: 422 };
  }

  const cart = await context.api.updateShipment({
    shipmentId,
    shippingAddress: unnormalizeAddress(shippingAddress, normalizerContext),
  });

  return await getNormalizedCart(context, cart);
});

// eslint-disable-next-line complexity
function isAddressValid(address: SfCustomerAddress | SfCreateAddressBody): boolean {
  return Boolean(
    address.address1 &&
      address.city &&
      address.country &&
      address.firstName &&
      address.lastName &&
      address.phoneNumber &&
      address.postalCode &&
      address.state,
  );
}

```
