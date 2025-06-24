# Address normalizers

Address management in the Storefront requires bidirectional normalization.

## Retrieving Addresses

To map Commercetools `Address` into Unified Model, following normalizers are used:

- **`normalizeAddress`**: This function is used to retrieve an address that has been saved in the checkout process.

- **`normalizeCustomerAddress`**: When a customer retrieves one of the addresses they've saved, this function comes into play.

## Saving Address

When a customer sets a shipping address during the checkout process, the [`SetCartAddress`](/unified-data-layer/unified-methods/checkout#setcartaddress) method is utilized. Here, a critical aspect arises in scenarios involving Commercetools. To ensure the correct handling of new addresses in Commercetools, a special unnormalization process is required.

- **`unnormalizeAddress`** To accurately save a new address in Commercetools, we need to _unnormalize_ the address data. This means mapping the unified [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) format used within the Storefront into the specific structure required by Commercetools, known as `Address`. This unnormalization step ensures that the address is correctly processed and stored in Commercetools, maintaining data integrity between the Storefront and Commercetools.

## Parameters

### `normalizeAddress`

| Name      | Type                                                                                                  | Default value | Description           |
| --------- | ----------------------------------------------------------------------------------------------------- | ------------- | --------------------- |
| `address` | [`Address`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Address) |               | Commercetools Address |

### `normalizeCustomerAddress`

| Name      | Type                                                                                                  | Default value | Description                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| `address` | [`Address`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Address) |               | Commercetools Address. If address does not contain the `id`, an error is thrown |

### `unnormalizeAddress`

| Name      | Type                                                                                     | Default value | Description                                                  |
| --------- | ---------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `address` | [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) |               | Unified address body sent in the request from the Storefront |

## Extending

The `SfCustomerAddress` model represents a reusable address, which customer decided to store. It is used within customer address methods, as for example [`GetCustomerAddresses`](/unified-data-layer/unified-methods/customer#getcustomeraddresses). If any of this models don't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. In the following example we extend the `normalizeCustomerAddress` with `externalId` field which is available on Commercetools Address.

```ts
import { normalizers as normalizersCT, defineNormalizers } from "@vsf-enterprise/unified-api-commercetools";

const normalizers = defineNormalizers<typeof normalizersCT>()({
  ...normalizersCT,
  normalizeCustomerAddress: (address) => ({
    ...normalizersCT.normalizeCustomerAddress(address),
    externalId: address.externalId,
  }),
});
```

Similarly if you want to change the mapping of `normalizeCustomerAddress` or `unnormalizeAddress` function you can customize it within `defineNormalizers`.

## Source

```ts [address.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeAddress = defineNormalizer.normalizeAddress((address) => {
  return {
    address1: maybe(address?.streetName),
    address2: maybe(address?.streetNumber),
    city: maybe(address?.city),
    country: maybe(address?.country),
    firstName: maybe(address?.firstName),
    lastName: maybe(address?.lastName),
    phoneNumber: maybe(address?.phone),
    postalCode: maybe(address?.postalCode),
    state: maybe(address?.state) || maybe(address?.region),
    titleCode: maybe(address?.title),
  };
});

export const normalizeCustomerAddress = defineNormalizer.normalizeCustomerAddress(
  (address, ctx) => {
    if (!address.id) {
      throw new Error("Address is not a valid customer address. `id` field is missing");
    }

    return {
      id: address.id,
      ...ctx.normalizers.normalizeAddress(address),
    };
  },
);

export const unnormalizeAddress = defineNormalizer.unnormalizeAddress((address) => {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    postalCode: address.postalCode,
    country: address.country,
    city: address.city,
    streetName: address.address1,
    streetNumber: address.address2,
    phone: address.phoneNumber,
    state: address.state,
    title: address.titleCode,
  };
});

```

