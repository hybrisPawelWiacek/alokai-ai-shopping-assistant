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
| `context` | `NormalizerContext`                                                           |               | context needed for the normalizer |
| `address` | [`CartAddressInterface`](https://docs.alokai.com/integrations/magento/api/magento-types/CartAddressInterface) or [`OrderAddress`](https://docs.alokai.com/integrations/magento/api/magento-types/OrderAddress) |               | Magento Address |

### `normalizeCustomerAddress`

| Name      | Type                                                                                                | Default value | Description              |
| --------- | --------------------------------------------------------------------------------------------------- | ------------- | ------------------------ |
| `context` | `NormalizerContext`                                                           |               | context needed for the normalizer |
| `address` | [`CustomerAddress`](https://docs.alokai.com/integrations/magento/api/magento-types/CustomerAddress) |               | Magento Customer Address |

### `unnormalizeAddress`

| Name      | Type                                                                                                                                                                             | Default value | Description                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `context` | `NormalizerContext`                                                           |               | context needed for the normalizer |
| `address` | [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) or [`SfCustomerAddress`](/unified-data-layer/unified-data-model#sfcustomeraddress) |               | Unified address body sent in the request from the Storefront |

## Extending

The `SfCustomerAddress` model represents a reusable address, which customer decided to store. It is used within customer address methods, as for example [`GetCustomerAddresses`](/unified-data-layer/unified-methods/customer#getcustomeraddresses). If any of this models don't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. In the following example we extend the `normalizeCustomerAddress` with `vatId` field which is available on Magento Address.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCustomerAddress: (context, address) => ({
          vatId: address.vat_id,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

Similarly if you want to change the mapping of `unnormalizeAddress` function you can customize it within `addCustomFields`.

## Source

<<<../../../../node_modules/@vsf-enterprise/unified-api-magento/src/normalizers/cart/address.ts [address.ts]
