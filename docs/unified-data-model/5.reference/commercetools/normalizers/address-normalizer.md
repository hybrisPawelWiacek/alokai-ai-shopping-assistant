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
| `context`  | `NormalizerContext`                                                                       |               | context needed for the normalizer |
| `address` | [`Address`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Address) |               | Commercetools Address |

### `normalizeCustomerAddress`

| Name      | Type                                                                                                  | Default value | Description                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| `context`  | `NormalizerContext`                                                                       |               | context needed for the normalizer |
| `address` | [`Address`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Address) |               | Commercetools Address. If address does not contain the `id`, an error is thrown |

### `unnormalizeAddress`

| Name      | Type                                                                                     | Default value | Description                                                  |
| --------- | ---------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `context`  | `NormalizerContext`                                                                       |               | context needed for the normalizer |
| `address` | [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) |               | Unified address body sent in the request from the Storefront |

## Extending

The `SfCustomerAddress` model represents a reusable address, which customer decided to store. It is used within customer address methods, as for example [`GetCustomerAddresses`](/unified-data-layer/unified-methods/customer#getcustomeraddresses). If any of this models don't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. In the following example we extend the `normalizeCustomerAddress` with `externalId` field which is available on Commercetools Address.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCustomerAddress: (context, address) => ({
          externalId: address.externalId,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

Similarly if you want to change the mapping of `normalizeCustomerAddress` or `unnormalizeAddress` function you can customize it within `addCustomFields`.

## Source

<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/cart/address.ts [address.ts]
