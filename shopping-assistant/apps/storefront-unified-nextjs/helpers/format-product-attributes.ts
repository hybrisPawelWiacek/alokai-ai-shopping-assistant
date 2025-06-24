import { sortBy, uniqBy } from 'lodash-es';

import type { SfAttribute, SfProductVariant } from '@/types';

export type AttributePredicate = (attribute: SfAttribute) => boolean;

/**
 * @description This function is used to guess the color value of the color attribute.
 * Some commerces set is as a valueLabel, some as a value.
 * @param attribute - The color attribute.
 */
export function guessAttributeColor(attribute: SfAttribute) {
  const isValueStringNumber = !Number.isNaN(Number(attribute.value));
  const guessedColor = isValueStringNumber ? attribute.valueLabel : attribute.value;
  return guessedColor.toLowerCase();
}

/**
 * Find attribute in the list of attributes.
 */
export function findAttribute(attributes: SfAttribute[], matcher: AttributePredicate | string) {
  return attributes.find(
    (attribute) => attribute.name === matcher || (typeof matcher === 'function' && matcher(attribute)),
  );
}

const hasVariantAttribute = (variant: SfProductVariant, attribute: SfAttribute) =>
  findAttribute(variant.attributes, attribute.name)?.value === attribute.value;

const hasEqualAttributes = (variant: SfProductVariant, attributes: SfAttribute[]) =>
  attributes.every((attribute) => hasVariantAttribute(variant, attribute));

/**
 * @description This function is used to guess the color value of the color attribute.
 * Some commerces set is as a valueLabel, some as a value.
 * @param variants - The product variants.
 * @param availableAttributeMatcher - The attribute name or a function that returns true if the attribute matches.
 * @param requiredAttributesInVariant - The list of required attributes which variant should contain.
 */
export function getAvailableAttributeValues(
  variants: SfProductVariant[],
  availableAttributeMatcher: AttributePredicate | string,
  requiredAttributesInVariant: SfAttribute[],
) {
  const availableAttributes = variants
    .map((variant) => ({
      ...findAttribute(variant.attributes, availableAttributeMatcher)!,
      disabled: !hasEqualAttributes(variant, requiredAttributesInVariant),
      variant,
    }))
    .filter((variant) => variant.value);
  const attributeValuesOriginalOrder = availableAttributes.map((attribute) => attribute.value);
  const getAttributeOrderInOriginalArray = (attribute: SfAttribute) =>
    attributeValuesOriginalOrder.indexOf(attribute.value);
  const sortedAttributes = sortBy(availableAttributes, getAttributeOrderInOriginalArray, 'disabled');
  return uniqBy(sortedAttributes, 'value');
}
