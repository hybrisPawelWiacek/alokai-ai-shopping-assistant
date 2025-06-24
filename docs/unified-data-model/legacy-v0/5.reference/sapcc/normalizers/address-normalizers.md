# Address normalizers

Address management in the Storefront requires bidirectional normalization.

## Retrieving Addresses

To map SAP `Address` into Unified Model, following normalizers are used:

- **`normalizeAddress`**: This function is used to retrieve an address that has been saved in the checkout process.

- **`normalizeCustomerAddress`**: When a customer retrieves one of the addresses they've saved, this function comes into play.

## Saving Address

When a customer sets a shipping address during the checkout process, the [`SetCartAddress`](/unified-data-layer/unified-methods/checkout#setcartaddress) method is utilized. Here, a critical aspect arises in scenarios involving SAP Commerce Cloud. To ensure the correct handling of new addresses in SAP, a special unnormalization process is required.

- **`unnormalizeAddress`** To accurately save a new address in SAP, we need to _unnormalize_ the address data. This means mapping the unified [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) format used within the Storefront into the specific structure required by SAP, known as `CreateAddressProps`. This unnormalization step ensures that the address is correctly processed and stored in SAP, maintaining data integrity between the Storefront and SAP.

## Parameters

### `normalizeAddress`

| Name      | Type                                                                                               | Default value | Description |
| --------- | -------------------------------------------------------------------------------------------------- | ------------- | ----------- |
| `address` | [`Address`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.address.html) |               | SAP Address |

### `normalizeCustomerAddress`

| Name      | Type                                                                                               | Default value | Description                                                           |
| --------- | -------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------- |
| `address` | [`Address`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.address.html) |               | SAP Address. If address does not contain the `id`, an error is thrown |

### `unnormalizeAddress`

| Name      | Type                                                                                     | Default value | Description                                                  |
| --------- | ---------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `address` | [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) |               | Unified address body sent in the request from the Storefront |

## Extending

The `SfCustomerAddress` model represents a reusable address, which customer decided to store. It is used within customer address methods, as for example [`GetCustomerAddresses`](/unified-data-layer/unified-methods/customer#getcustomeraddresses). If any of this models don't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. In the following example we extend the `normalizeCustomerAddress` with `visibleInAddressBook` field which is available on SAP Address.

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeCustomerAddress: (address) => ({
    ...normalizersSAP.normalizeCustomerAddress(address),
    visibleInAddressBook: address?.visibleInAddressBook ?? false,
  }),
});
```

Similarly if you want to change the mapping of `unnormalizeAddress` function you can customize it within `defineNormalizers`.

## Source

```ts [address.ts]
/* eslint-disable complexity */
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeAddress = defineNormalizer.normalizeAddress((address) => {
  return {
    titleCode: maybe(address?.titleCode),
    address1: maybe(address?.line1),
    address2: maybe(address?.line2),
    city: maybe(address?.town),
    country: maybe(address?.country?.isocode),
    firstName: maybe(address?.firstName),
    lastName: maybe(address?.lastName),
    phoneNumber: maybe(address?.phone),
    postalCode: maybe(address?.postalCode),
    state: maybe(address?.district),
  };
});

export const normalizeCustomerAddress = defineNormalizer.normalizeCustomerAddress(
  (address, ctx) => {
    if (!address.id) {
      throw new Error("Address is not a valid customer address. `id` field is missing");
    }

    return {
      id: address.id,
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
    titleCode,
    firstName,
    lastName,
    postalCode,
    country: { isocode: country },
    town: city,
    line1: address1,
    line2: address2 || undefined,
    phone: phoneNumber,
    district: state,
  };
});
```
