# Address normalizers

Address management in the Storefront requires bidirectional normalization.

## Retrieving Addresses

To map SFCC `BasketAddress` into Unified Model, following normalizers are used:

- **`normalizeAddress`**: This function is used to retrieve an address that has been saved in the checkout process.

- **`normalizeCustomerAddress`**: When a customer retrieves one of the addresses they've saved, this function comes into play.

## Saving Address

When a customer sets a shipping address during the checkout process, the [`SetCartAddress`](/unified-data-layer/unified-methods/checkout#setcartaddress) method is utilized. Here, a critical aspect arises in scenarios involving SalesForce Commerce Cloud. To ensure the correct handling of new addresses in SFCC, a special unnormalization process is required.

- **`unnormalizeAddress`** To accurately save a new address in SFCC, we need to _unnormalize_ the address data. This means mapping the unified [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) format used within the Storefront into the specific structure required by SFCC, known as `CustomerCreateAddressParams`. This unnormalization step ensures that the address is correctly processed and stored in SFCC, maintaining data integrity between the Storefront and SFCC.

## Parameters

### `normalizeAddress`

| Name      | Type        | Default value | Description  |
| --------- | ----------- | ------------- | ------------ |
| `address` | [`Address`] |               | SFCC Address |

### `normalizeCustomerAddress`

| Name      | Type                                                                                                                                    | Default value | Description                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------- |
| `address` | [`CustomerAddress`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Acustomer_address) |               | SFCC Address. If address does not contain the `id`, an error is thrown |

### `unnormalizeAddress`

| Name      | Type                                                                                     | Default value | Description                                                  |
| --------- | ---------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `address` | [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) |               | Unified address body sent in the request from the Storefront |

## Extending

The `SfCustomerAddress` model represents a reusable address, which customer decided to store. It is used within customer address methods, as for example [`GetCustomerAddresses`](/unified-data-layer/unified-methods/customer#getcustomeraddresses). If any of this models don't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. In the following example we extend the `normalizeCustomerAddress` with `visibleInAddressBook` field which is available on SFCC Address.

```ts
import { normalizers as normalizersSFCC, defineNormalizers } from "@vsf-enterprise/unified-api-sfcc";

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeCustomerAddress: (address) => ({
    ...normalizersSFCC.normalizeCustomerAddress(address),
    visibleInAddressBook: address?.visibleInAddressBook ?? false,
  }),
});
```

Similarly if you want to change the mapping of `unnormalizeAddress` function you can customize it within `defineNormalizers`.

## Source

```ts [address.ts]
/* eslint-disable complexity */
import { KnownKeys } from "@/normalizers/types";
import { maybe } from "@shared/utils";
import { BasketAddress } from "@vsf-enterprise/sfcc-types";
import { defineNormalizer } from "../defineNormalizer";

export type Address = KnownKeys<BasketAddress>;

export const normalizeAddress = defineNormalizer.normalizeAddress((address) => {
  return {
    titleCode: maybe(address?.title),
    address1: maybe(address?.address1),
    address2: maybe(address?.address2),
    city: maybe(address?.city),
    country: maybe(address?.countryCode),
    firstName: maybe(address?.firstName),
    lastName: maybe(address?.lastName),
    phoneNumber: maybe(address?.phone),
    postalCode: maybe(address?.postalCode),
    state: maybe(address?.stateCode),
  };
});

export const normalizeCustomerAddress = defineNormalizer.normalizeCustomerAddress(
  (address, ctx) => {
    if (!address.addressId) {
      throw new Error("Address is not a valid customer address. `addressId` field is missing");
    }

    return {
      id: address.addressId,
      ...normalizeAddress(address, ctx),
    };
  },
);

export const unnormalizeAddress = defineNormalizer.unnormalizeAddress((address) => {
  const {
    titleCode,
    firstName,
    lastName,
    postalCode,
    country,
    city,
    address1,
    address2,
    phoneNumber,
    state,
  } = address;

  if (
    !titleCode ||
    !firstName ||
    !lastName ||
    !postalCode ||
    !country ||
    !city ||
    !address1 ||
    !phoneNumber ||
    !state
  ) {
    throw new Error("Address is not a valid customer address. Some required fields are missing");
  }

  return {
    title: titleCode,
    firstName: firstName,
    lastName: lastName,
    postalCode: postalCode,
    countryCode: country,
    city: city,
    address1: address1,
    address2: address2 || undefined,
    phone: phoneNumber,
    stateCode: state,
  };
});
```
