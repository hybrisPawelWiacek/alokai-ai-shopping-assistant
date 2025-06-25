# Money normalizer

The `normalizeMoney` function maps BigCommerce money amount into Unified [`SfMoney`](/reference/unified-data-model.html#sfmoney).

## Parameters

| Name    | Type                | Default value | Description                            |
| ------- | ------------------- | ------------- | -------------------------------------- |
| `money` | number              |               | Amount as number                       |
| `ctx`   | `NormalizerContext` |               | Context which contains e.g. `currency` |

## Extending

The `SfMoney` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If you want to extend the `SfMoney` with custom fields, you should use the `defineNormalizers` utility.

```ts
import { normalizers as normalizersBC, defineNormalizers } from "@vsf-enterprise/unified-api-bigcommerce";

const normalizers = defineNormalizers<typeof normalizersBC>()({
  ...normalizersBC,
  normalizeMoney: (money, ctx) => ({
    ...normalizersBC.normalizeMoney(money, ctx),
    someNewField: "someValue",
  }),
});
```

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
