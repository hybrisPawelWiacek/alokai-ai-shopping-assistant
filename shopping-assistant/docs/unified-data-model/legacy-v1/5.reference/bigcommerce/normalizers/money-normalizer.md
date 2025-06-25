# Money normalizer

The `normalizeMoney` function maps BigCommerce money amount into Unified [`SfMoney`](/reference/unified-data-model.html#sfmoney).

## Parameters

| Name      | Type                | Default value | Description                            |
|-----------| ------------------- | ------------- | -------------------------------------- |
| `context` | `NormalizerContext` |               | Context which contains e.g. `currency` |
| `money`   | number              |               | Amount as number                       |

## Extending

The `SfMoney` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If you want to extend the `SfMoney` with custom fields, you should use the `addCustomFields` API.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeMoney: (context, money) => ({
          someNewField: "someValue",
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

## Source

<<<../../../../node_modules/@vsf-enterprise/unified-api-bigcommerce/src/normalizers/money/money.ts [money.ts]
