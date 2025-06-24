# Money normalizer

The `normalizeMoney` function maps Commercetools `BaseMoney` into Unified [`SfMoney`](/reference/unified-data-model.html#sfmoney).

## Parameters

| Name    | Type                                                                                                      | Default value | Description         |
| ------- | --------------------------------------------------------------------------------------------------------- | ------------- | ------------------- |
| `context`  | `NormalizerContext`                                                                       |               | context needed for the normalizer |
| `money` | [`BaseMoney`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/BaseMoney) |               | Commercetools money |

## Extending

The `SfMoney` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If you want to extend the `SfMoney` with custom fields, you should use the `addCustomFields` API.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeMoney: (context, money) => ({
          type: money.type,
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/money/money.ts [money.ts]
