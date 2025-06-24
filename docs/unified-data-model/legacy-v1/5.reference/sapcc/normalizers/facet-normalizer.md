# Facet normalizer

Concept of facets exists in both Unified Data Layer world and SAP. The `normalizeFacet` function maps SAP `Facet` into Unified [`SfFacet`](/unified-data-layer/unified-data-model.html#sffacet).

## Parameters

| Name      | Type                                                                                           | Default value | Description                                                |
|-----------| ---------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------- |
| `context` | `NormalizerContext`                                                                            |               | Context which contains `currentQuery` for `searchProducts` |
| `facet`   | [`Facet`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.facet.html) |               | SAP Facet                                                  |

## Extending

The `SfFacet` is returned from [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts) Method. If the `SfFacet` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfFacet` with a `multiSelect` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeFacet: (context, facet) => ({
          multiSelect: facet.multiSelect,
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

In the Unified Data Layer, the `SfFacet` array is expected to return all of the available facets, including the current selected facets. In SAP the selected facets are present in the `currentQuery` object returned from the `searchProducts` API Client method. So to retrieve them, we have to extract them from the query value. An explanation of the expected behaviour can be found in the `facet.feature` file which contains test scenarios.

:::code-group

<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/facets/facet.ts [facet.ts]

<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/facets/facet.feature [facet.feature]

:::
