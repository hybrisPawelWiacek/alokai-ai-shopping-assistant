# Money normalizer

The `normalizeMoney` function maps SFCC `price` values into Unified [`SfMoney`](/reference/unified-data-model.html#sfmoney).

## Parameters

| Name    | Type                                                                                                                                             | Default value | Description |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ----------- |
| `price` | Price in SFCC [`Product`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aproduct) it's float. |               | SFCC price  |

## Extending

The `SfMoney` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If you want to extend the `SfMoney` with custom fields, you should use the `defineNormalizers` utility.

## Source

```ts [money.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeMoney = defineNormalizer.normalizeMoney((amount, context) => {
  return {
    amount,
    currency: context.currency,
    precisionAmount: amount.toFixed(2),
  };
});
```
