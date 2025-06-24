# Money normalizer

The `normalizeMoney` function maps Commercetools `BaseMoney` into Unified [`SfMoney`](/reference/unified-data-model.html#sfmoney).

## Parameters

| Name    | Type                                                                                                      | Default value | Description         |
| ------- | --------------------------------------------------------------------------------------------------------- | ------------- | ------------------- |
| `money` | [`BaseMoney`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/BaseMoney) |               | Commercetools money |

## Extending

The `SfMoney` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If you want to extend the `SfMoney` with custom fields, you should use the `defineNormalizers` utility.

```ts
import { normalizers as normalizersCT, defineNormalizers } from "@vsf-enterprise/unified-api-commercetools";

const normalizers = defineNormalizers<typeof normalizersCT>()({
  ...normalizersCT,
  normalizeMoney: (money, ctx) => ({
    ...normalizersCT.normalizeMoney(money, ctx),
    type: money.type,
  }),
});
```

## Source

```ts [money.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeMoney = defineNormalizer.normalizeMoney((money) => {
  // Invalid types for BaseMoney - fractionDigits are optional
  const fractionDigits = money.fractionDigits ?? 2;
  const divider = Math.pow(10, fractionDigits);
  const amount = money.centAmount / divider;

  return {
    currency: money.currencyCode,
    amount,
    precisionAmount: amount.toFixed(fractionDigits),
  };
});
```
