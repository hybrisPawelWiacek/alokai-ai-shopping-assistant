# Address normalizers

Address management in the Storefront requires bidirectional normalization.

## Retrieving Addresses

To map BigCommerce `Address` into Unified Model, following normalizers are used:

- **`normalizeAddress`**: This function is used to retrieve an address that has been saved in the checkout process.

- **`normalizeCustomerAddress`**: When a customer retrieves one of the addresses they've saved, this function comes into play.

## Saving Address

When a customer sets a shipping address during the checkout process, the [`SetCartAddress`](/unified-data-layer/unified-methods/checkout#setcartaddress) method is utilized. Here, a critical aspect arises in scenarios involving BigCommerce. To ensure the correct handling of new addresses in BigCommerce, a special unnormalization process is required.

- **`unnormalizeAddress`** To accurately save a new address in BigCommerce, we need to _unnormalize_ the address data. This means mapping the unified [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) format used within the Storefront into the specific structure required by BigCommerce, known as `CreateAddressParameters`. This unnormalization step ensures that the address is correctly processed and stored in BigCommerce, maintaining data integrity between the Storefront and BigCommerce.

## Parameters

### `normalizeAddress`

| Name      | Type                                                                                                                                                                                                                                  | Default value | Description         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------- |
| `address` | [`ShippingAddress`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/ShippingAddress) or [`Order["billing_address"]`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/Order) |               | BigCommerce Address |

### `normalizeCustomerAddress`

| Name      | Type                                                                                                      | Default value | Description              |
| --------- | --------------------------------------------------------------------------------------------------------- | ------------- | ------------------------ |
| `address` | [`UserAddress`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/UserAddress) |               | BigCommerce User Address |

### `unnormalizeAddress`

| Name      | Type                                                                                                                                                                             | Default value | Description                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `address` | [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) or [`SfCustomerAddress`](/unified-data-layer/unified-data-model#sfcustomeraddress) |               | Unified address body sent in the request from the Storefront |

## Extending

The `SfCustomerAddress` model represents a reusable address, which customer decided to store. It is used within customer address methods, as for example [`GetCustomerAddresses`](/unified-data-layer/unified-methods/customer#getcustomeraddresses). If any of this models don't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. In the following example we extend the `normalizeCustomerAddress` with `customerId` field which is available on BigCommerce Address.

```ts
import { normalizers as normalizersBC, defineNormalizers } from "@vsf-enterprise/unified-api-bigcommerce";

const normalizers = defineNormalizers<typeof normalizersBC>()({
  ...normalizersBC,
  normalizeCustomerAddress: (address) => ({
    ...normalizersBC.normalizeCustomerAddress(address),
    customerId: address.customer_id,
  }),
});
```

Similarly if you want to change the mapping of `unnormalizeAddress` function you can customize it within `defineNormalizers`.

The `SfAddress` is used within the [`GetCart`](/unified-data-layer/unified-methods/cart#getcart) method. If you want to extend the `SfAddress` model, you should extend the `normalizeCart` function.

## Source

```ts [address.ts]
/* eslint-disable complexity */
import { maybe } from "@shared/utils";
import type { SfCreateAddressBody, SfCustomerAddress } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeAddress = defineNormalizer.normalizeAddress((address) => {
  return {
    address1: maybe(address?.street_1),
    address2: maybe(address?.street_2),
    city: maybe(address?.city),
    country: maybe(address?.country),
    firstName: maybe(address?.first_name),
    lastName: maybe(address?.last_name),
    phoneNumber: maybe(address?.phone?.toString()),
    postalCode: maybe(address?.zip?.toString()),
    state: maybe(address?.state),
    titleCode: null,
  };
});

export const unnormalizeAddress = defineNormalizer.unnormalizeAddress(
  (address: SfCreateAddressBody | SfCustomerAddress) => {
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
      first_name: firstName,
      last_name: lastName,
      address1: address1,
      address2: address2 || undefined,
      city: city,
      country_code: country,
      state_or_province: state,
      postal_code: postalCode,
      phone: phoneNumber || undefined,
      company: "",
    };
  },
);

export const normalizeCustomerAddress = defineNormalizer.normalizeCustomerAddress((address) => {
  return {
    id: `${address.id}`,
    firstName: address.first_name,
    lastName: address.last_name,
    address1: address.address1,
    address2: maybe(address.address2),
    city: address.city,
    country: address.country_code,
    state: address.state_or_province,
    postalCode: address.postal_code,
    phoneNumber: address.phone,
    titleCode: null,
  };
});

```
