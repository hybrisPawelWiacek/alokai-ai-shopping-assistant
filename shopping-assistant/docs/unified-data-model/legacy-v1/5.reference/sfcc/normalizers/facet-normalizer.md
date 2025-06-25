# Facet normalizer

Concept of facets exists in both Unified Data Layer world and SFCC. The `normalizeFacet` function maps SFCC `Refinement` into Unified [`SfFacet`](/unified-data-layer/unified-data-model.html#sffacet).

## Parameters

| Name         | Type                                                                                                                         | Default value | Description     |
|--------------| ---------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------- |
| `context`    | `NormalizeFacetContext`                                                                                                      |               |
| `refinement` | [`Refinement`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=Search%2BProducts) |               | SFCC Refinement |

## Extending

The `SfFacet` is returned from [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts) Method. If the `SfFacet` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfFacet` with a `description` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeFacet: (context, refinement) => ({
          description: refinement.description,
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/facets/facet.ts [facet.ts]
