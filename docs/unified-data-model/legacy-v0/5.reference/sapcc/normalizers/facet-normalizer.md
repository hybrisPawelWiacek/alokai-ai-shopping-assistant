# Facet normalizer

Concept of facets exists in both Unified Data Layer world and SAP. The `normalizeFacet` function maps SAP `Facet` into Unified [`SfFacet`](/unified-data-layer/unified-data-model.html#sffacet).

## Parameters

| Name    | Type                                                                                           | Default value | Description                                                |
| ------- | ---------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------- |
| `facet` | [`Facet`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.facet.html) |               | SAP Facet                                                  |
| `ctx`   | `NormalizerContext`                                                                            |               | Context which contains `currentQuery` for `searchProducts` |

## Extending

The `SfFacet` is returned from [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts) Method. If the `SfFacet` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfFacet` with a `multiSelect` field.

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeFacet: (facet) => ({
    ...normalizersSAP.normalizeFacet(facet),
    multiSelect: facet.multiSelect,
  }),
});
```

## Source

In the Unified Data Layer, the `SfFacet` array is expected to return all of the available facets, including the current selected facets. In SAP the selected facets are present in the `currentQuery` object returned from the `searchProducts` API Client method. So to retrieve them, we have to extract them from the query value. An explanation of the expected behaviour can be found in the `facet.feature` file which contains test scenarios.

```ts [facet.ts]
import { maybe } from "@shared/utils";
import type { Facet, FacetValue } from "@vsf-enterprise/sapcc-types";
import { SfFacetTypes, type SfFacetType } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeFacet = defineNormalizer.normalizeFacet((facet, ctx) => {
  const { name: label, values } = facet;
  const name = normalizeFacetName(facet);
  const selectedValues = getSelectedValues(ctx.currentQuery?.query?.value ?? "", name);

  const sfFacetItems =
    values?.map((term) => ({
      label: term.name as string,
      value: normalizeFacetItemValue(term, selectedValues),
      productCount: maybe(term.count),
    })) || [];

  if (sfFacetItems.length === 0) {
    return null;
  }
  const { getFacetType = defaultGetFacetType } = ctx;

  return {
    label: label as string,
    name: normalizeFacetName(facet),
    values: sfFacetItems,
    type: getFacetType(facet),
  };
});

function normalizeFacetName(facet: Facet): string {
  let name = facet.name as string;
  const nonSelectedValue = facet.values?.find((value) => !value?.selected);
  const exampleQueryUrl = nonSelectedValue?.query?.query?.value;

  if (exampleQueryUrl) {
    name = exampleQueryUrl.split(":").at(-2) ?? name;
  }

  return name;
}

function normalizeFacetItemValue(facetValue: FacetValue, selectedValues: string[]): string {
  let value = facetValue.name as string;
  const queryUrl = facetValue?.query?.query?.value;

  if (facetValue.selected) {
    value = guessSelectedFacetItemValue(value, selectedValues);
  } else if (queryUrl) {
    value = queryUrl.split(":").at(-1) ?? value;
  }

  return value;
}

function getSelectedValues(queryValue: string, facetName: string): string[] {
  const regex = new RegExp(`:${facetName}:([^:]+)`, "g");
  const matches = queryValue.match(regex);
  if (matches) {
    return matches.map((match) => match.split(":")?.[2]).filter(Boolean);
  }
  return [];
}

function guessSelectedFacetItemValue(facetItemName: string, selectedValues: string[]): string {
  const facetNameAsUri = encodeURIComponent(facetItemName as string).replace(/%20/g, "+");
  return (
    selectedValues.find((value) => value.toLowerCase() === facetNameAsUri.toLowerCase()) ??
    facetNameAsUri.toUpperCase()
  );
}

function defaultGetFacetType(facet: Facet): SfFacetType {
  return facet.multiSelect === false ? SfFacetTypes.SINGLE_SELECT : SfFacetTypes.MULTI_SELECT;
}

```
