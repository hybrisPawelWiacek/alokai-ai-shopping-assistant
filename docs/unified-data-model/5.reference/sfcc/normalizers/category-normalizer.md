# Category normalizer

The `normalizeCategory` function is used to map a SFCC `Category` into the unified [`SfCategory`](/reference/unified-data-model.html#sfcategory) data model.

## Parameters

| Name       | Type                                                                                                                      | Default value | Description   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------- |
| `context` | `NormalizerContext`                                        |               | Context needed for the normalizer. |
| `category` | [`Category`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Acategory). |               | SFCC Category |

## Extending

The `SfCategory` model is returned from the Unified Methods such as [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts), and [`GetCategories`](/unified-data-layer/unified-methods/category#getcategories). If the `SfCategory` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfCategory` with an `thumbnail` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCategory: (context, category) => ({
          thumbnail: category.thumbnail,
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/category/category.ts [category.ts]
