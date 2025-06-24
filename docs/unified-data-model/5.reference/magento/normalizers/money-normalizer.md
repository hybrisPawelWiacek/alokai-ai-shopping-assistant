# Money normalizer

The `normalizeMoney` function maps Magento `Money` into Unified [`SfMoney`](/reference/unified-data-model.html#sfmoney).

## Parameters

| Name    | Type                                                                            | Default value | Description   |
| ------- | ------------------------------------------------------------------------------- | ------------- | ------------- |
| `context` | `NormalizerContext`                                                           |               | context needed for the normalizer |
| `money` | [`Money`](https://docs.alokai.com/integrations/magento/api/magento-types/Money) |               | Magento money |

## Extending

The `SfMoney` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If you want to change the global attributes representation, you should override all root normalizers, so for example `normalizeCart`, `normalizeProduct` etc. If you want to extend the `SfMoney` with custom fields, you should use the `addCustomFields` API.

## Source

<<<../../../../node_modules/@vsf-enterprise/unified-api-magento/src/normalizers/money/money.ts [money.ts]
