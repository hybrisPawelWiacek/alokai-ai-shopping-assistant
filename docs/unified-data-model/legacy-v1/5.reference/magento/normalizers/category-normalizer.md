# Category normalizer

The `normalizeCategory` function is used to map a Magento `CategoryTree` into the unified [`SfCategory`](/reference/unified-data-model.html#sfcategory) data model.

## Parameters

| Name       | Type                                                                                                             | Default value | Description                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| `context` | `NormalizerContext`                                                           |               | context needed for the normalizer |
| `category` | [`CategoryTreeWithParentUid`](https://docs.alokai.com/integrations/magento/api/magento-types/CategoryTree) |               | Magento CategoryTree with information about categories' parent uid |

## Extending

The `SfCategory` model is returned from the Unified Methods such as [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts), and [`GetCategories`](/unified-data-layer/unified-methods/category#getcategories). If the `SfCategory` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfCategory` with a `description` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCategory: (context, category) => ({
          description: category.description,
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-magento/src/normalizers/category/category.ts [category.ts]
