# Money normalizer

The `normalizeMoney` function maps Magento `Money` into Unified [`SfMoney`](/reference/unified-data-model.html#sfmoney).

## Parameters

| Name    | Type                                                                            | Default value | Description   |
| ------- | ------------------------------------------------------------------------------- | ------------- | ------------- |
| `money` | [`Money`](https://docs.alokai.com/integrations/magento/api/magento-types/Money) |               | Magento money |

## Extending

The `SfMoney` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If you want to change the global attributes representation, you should override all root normalizers, so for example `normalizeCart`, `normalizeProduct` etc. If you want to extend the `SfMoney` with custom fields, you should use the `defineNormalizers` utility.

## Source

```ts [money.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeMoney = defineNormalizer.normalizeMoney((price) => {
  const amount = price.value ?? 0;
  return {
    amount,
    currency: price.currency as string,
    precisionAmount: amount.toFixed(2),
  };
});
```
