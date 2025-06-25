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

| Name      | Type                                                                                                                                                                                                                      | Default value | Description                            |
| --------- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|----------------------------------------|
| `context` | `NormalizerContext`                                                                                                                                                                                                       |               | Context which contains e.g. `currency` |
| `address` | [`ShippingAddress`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/ShippingAddress) or [`Order["billing_address"]`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/Order) |               |  BigCommerce Address                   |

### `normalizeCustomerAddress`

| Name      | Type                                                                                                      | Default value | Description              |
| --------- | --------------------------------------------------------------------------------------------------------- | ------------- | ------------------------ |
| `context` | `NormalizerContext`                                                                   |               | Context which contains e.g. `currency` |
| `address` | [`UserAddress`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/UserAddress) |               | BigCommerce User Address |

### `unnormalizeAddress`

| Name      | Type                                                                                                                                                                             | Default value | Description                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `context` | `NormalizerContext`                                                                   |               | Context which contains e.g. `currency` |
| `address` | [`SfCreateAddressBody`](/unified-data-layer/unified-data-model#sfcreateaddressbody) or [`SfCustomerAddress`](/unified-data-layer/unified-data-model#sfcustomeraddress) |               | Unified address body sent in the request from the Storefront |

## Extending

The `SfCustomerAddress` model represents a reusable address, which customer decided to store. It is used within customer address methods, as for example [`GetCustomerAddresses`](/unified-data-layer/unified-methods/customer#getcustomeraddresses). If any of this models don't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. In the following example we extend the `normalizeCustomerAddress` with `customerId` field which is available on BigCommerce Address.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCustomerAddress: (context, address) => ({
          customerId: address.customer_id,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

Similarly if you want to change the mapping of `unnormalizeAddress` function you can customize it within `addCustomFields` API.

The `SfAddress` is used within the [`GetCart`](/unified-data-layer/unified-methods/cart#getcart) method. If you want to extend the `SfAddress` model, you should extend the `normalizeCart` function.

## Source

<<<../../../../node_modules/@vsf-enterprise/unified-api-bigcommerce/src/normalizers/cart/address.ts [address.ts]
