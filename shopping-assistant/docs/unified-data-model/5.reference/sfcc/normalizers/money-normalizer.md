# Money normalizer

The `normalizeMoney` function maps SFCC `price` values into Unified [`SfMoney`](/reference/unified-data-model.html#sfmoney).

## Parameters

| Name    | Type                                                                                                                                             | Default value | Description |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ----------- |
| `context` | `NormalizerContext`                                        |               | Context needed for the normalizer. |
| `price` | Price in SFCC [`Product`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aproduct) it's float. |               | SFCC price  |

## Extending

The `SfMoney` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If you want to extend the `SfMoney` with custom fields, you should use the `addCustomFields` API.

## Source

<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/money/money.ts [money.ts]
