# Money normalizer

The `normalizeMoney` function maps SAP `Price` into Unified [`SfMoney`](/reference/unified-data-model.html#sfmoney).

## Parameters

| Name    | Type                                                                                                 | Default value | Description |
| ------- | ---------------------------------------------------------------------------------------------------- | ------------- | ----------- |
| `price` | [`Price`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.price.html) |               | SAP price   |

## Extending

The `SfMoney` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`.

::: warning
If you want to change the global attributes representation, you should override all root normalizers, so for example `normalizeCart`, `normalizeProduct` etc. Overriding the `normalizeMoney` function will not change have an impact of the image normalization inside these functions, it is just an utils function which may be then used in writing other custom normalizers or methods.
:::

## Source

```ts [money.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeMoney = defineNormalizer.normalizeMoney((money) => {
  const amount = money.value as number;

  return {
    currency: money.currencyIso as string,
    amount,
    precisionAmount: amount.toFixed(2),
  };
});
```
