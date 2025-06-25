# Category normalizer

The `normalizeCategory` function is used to map a Magento `CategoryTree` into the unified [`SfCategory`](/reference/unified-data-model.html#sfcategory) data model.

## Parameters

| Name       | Type                                                                                                        | Default value | Description              |
| ---------- | ----------------------------------------------------------------------------------------------------------- | ------------- | ------------------------ |
| `context` | `NormalizerContext`                                                                   |               | Context which contains e.g. `currency` |
| `category` | [`CategoryTree`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/CategoryTree) |               | BigCommerce CategoryTree |

## Extending

The `SfCategory` model is returned from the Unified Methods such as [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts), and [`GetCategories`](/unified-data-layer/unified-methods/category#getcategories). If the `SfCategory` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfCategory` with a `depth` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCategory: (context, category) => ({
          depth: category.depth,
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-bigcommerce/src/normalizers/category/category.ts [category.ts]
