# Category normalizer

The `normalizeCategory` function is used to map a SAP `CategoryHierarchy` or `Category` into the unified [`SfCategory`](/reference/unified-data-model.html#sfcategory) data model.

## Parameters

| Name       | Type                                                                                                                                                                                                                                       | Default value | Description  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------ |
| `context` | `NormalizerContext`                                                                          |               | context needed for the normalizer.                                                                |
| `category` | [`CategoryHierarchy`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.categoryhierarchy.html) or [`Category`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.category.html) |               | SAP Category |

## Extending

The `SfCategory` model is returned from the Unified Methods such as [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts), and [`GetCategories`](/unified-data-layer/unified-methods/category#getcategories). If the `SfCategory` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfCategory` with an `url` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCategory: (context, category) => ({
          url: category.url,
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

`CategoryHiearchy` is returned from API Client's the `getCatalogVersion` and `Category` from the `getProduct`.

<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/category/category.ts [category.ts]
