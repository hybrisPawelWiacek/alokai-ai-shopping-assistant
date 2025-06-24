# Address normalizers

Address management in the Storefront requires bidirectional normalization.

## Retrieving Addresses

To map Magento `Address` into Unified Model, following normalizers are used:

- **`normalizeAddress`**: This function is used to retrieve an address that has been saved in the checkout process.

- **`normalizeCustomerAddress`**: When a customer retrieves one of the addresses they've saved, this function comes into play.

## Saving Address

When a customer sets a shipping address during the checkout process, the [`SetCartAddress`](/unified-data-layer/unified-methods/checkout#setcartaddress) method is utilized. Here, a critical aspect arises in scenarios involving Magento. To ensure the correct handling of new addresses in Magento, a special unnormalization process is required.

- **`unnormalizeAddress`** To accurately save a new address in Magento, we need to _unnormalize_ the address data. This means mapping the unified [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) format used within the Storefront into the specific structure required by Magento, known as `CartAddressInput` or `CustomerAddressInput`. This unnormalization step ensures that the address is correctly processed and stored in Magento, maintaining data integrity between the Storefront and Magento.

## Parameters

### `normalizeAddress`

| Name      | Type                                                                                                                                                                                                           | Default value | Description     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------- |
| `address` | [`CartAddressInterface`](https://docs.alokai.com/integrations/magento/api/magento-types/CartAddressInterface) or [`OrderAddress`](https://docs.alokai.com/integrations/magento/api/magento-types/OrderAddress) |               | Magento Address |

### `normalizeCustomerAddress`

| Name      | Type                                                                                                | Default value | Description              |
| --------- | --------------------------------------------------------------------------------------------------- | ------------- | ------------------------ |
| `address` | [`CustomerAddress`](https://docs.alokai.com/integrations/magento/api/magento-types/CustomerAddress) |               | Magento Customer Address |

### `unnormalizeAddress`

| Name      | Type                                                                                                                                                                             | Default value | Description                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `address` | [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) or [`SfCustomerAddress`](/unified-data-layer/unified-data-model#sfcustomeraddress) |               | Unified address body sent in the request from the Storefront |

## Extending

The `SfCustomerAddress` model represents a reusable address, which customer decided to store. It is used within customer address methods, as for example [`GetCustomerAddresses`](/unified-data-layer/unified-methods/customer#getcustomeraddresses). If any of this models don't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. In the following example we extend the `normalizeCustomerAddress` with `vatId` field which is available on Magento Address.

```ts
import { normalizers as normalizersMagento, defineNormalizers } from "@vsf-enterprise/unified-api-magento";

const normalizers = defineNormalizers<typeof normalizersMagento>()({
  ...normalizersMagento,
  normalizeCustomerAddress: (address) => ({
    ...normalizersMagento.normalizeCustomerAddress(address),
    vatId: address.vat_id,
  }),
});
```

Similarly if you want to change the mapping of `unnormalizeAddress` function you can customize it within `defineNormalizers`.

## Source
```ts [address.ts]
import { maybe } from "@shared/utils";
import type { CartAddressInterface, OrderAddress } from "@vue-storefront/magento-types";
import type { Maybe } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeAddress = defineNormalizer.normalizeAddress((address) => {
  const { country, state } = resolveCountryState(address);

  return {
    address1: maybe(address?.street?.[0]),
    address2: maybe(address?.street?.[1]),
    city: maybe(address?.city),
    country: maybe(country),
    firstName: maybe(address?.firstname),
    lastName: maybe(address?.lastname),
    phoneNumber: maybe(address?.telephone),
    postalCode: maybe(address?.postcode),
    state: maybe(state),
    titleCode: null,
  };
});

export const normalizeCustomerAddress = defineNormalizer.normalizeCustomerAddress((address) => {
  if (address?.id == null) {
    throw new Error("Address is not a valid customer address. `id` field is missing");
  }

  return {
    id: address.id.toString(),
    address1: maybe(address?.street?.[0]),
    address2: maybe(address?.street?.[1]),
    city: maybe(address?.city),
    country: maybe(address?.country_code),
    firstName: maybe(address?.firstname),
    lastName: maybe(address?.lastname),
    phoneNumber: maybe(address?.telephone),
    postalCode: maybe(address?.postcode),
    state: maybe(address?.region?.region),
    titleCode: maybe(address?.prefix),
  };
});

export const unnormalizeAddress = defineNormalizer.unnormalizeAddress((address) => {
  return {
    firstname: address.firstName!,
    lastname: address.lastName!,
    postcode: address.postalCode,
    country_code: address.country,
    city: address.city!,
    street: [address.address1, address.address2].filter(Boolean),
    telephone: address.phoneNumber!,
    prefix: "id" in address ? address.titleCode : undefined,
    region: "id" in address ? { region: address.state } : address.state,
  } as any;
});

function resolveCountryState<
  TWithCountryAndRegion extends
    | Pick<CartAddressInterface, "country" | "region">
    | Pick<OrderAddress, "country_code" | "region">,
>(address?: Maybe<TWithCountryAndRegion>) {
  if (!address) return { country: null, state: null };

  return {
    country: "country" in address ? address?.country?.code : address?.country_code,
    state: typeof address.region === "object" ? address?.region?.label : address.region,
  };
}
```
