import { SfChip } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';

import { COLOR_FACET_NAMES, SIZE_FACET_NAMES } from '@/config/constants';
import { Link } from '@/config/navigation';
import type { AttributePredicate } from '@/helpers';
import { findAttribute, getAvailableAttributeValues, guessAttributeColor } from '@/helpers';
import type { SfAttribute, SfProductVariant } from '@/types';

import Divider from './ui/divider';

const colorPredicate: AttributePredicate = (attribute) => COLOR_FACET_NAMES.includes(attribute.name);
const sizePredicate: AttributePredicate = (attribute) => SIZE_FACET_NAMES.includes(attribute.name);

export interface ProductAttributesProps {
  /**
   * List of current attributes
   */
  currentAttributes: SfAttribute[];
  /**
   * Product ID
   */
  productId: string;
  /**
   * Product slug
   */
  productSlug: string;
  /**
   * List of product variants
   */
  variants: SfProductVariant[];
}

export default function ProductAttributes({
  currentAttributes,
  productId,
  productSlug,
  variants,
}: ProductAttributesProps) {
  const selectedSize = findAttribute(currentAttributes, sizePredicate);
  const selectedColor = findAttribute(currentAttributes, colorPredicate);
  const availableSizes = getAvailableAttributeValues(variants, sizePredicate, selectedColor ? [selectedColor] : []);
  const availableColors = getAvailableAttributeValues(variants, colorPredicate, selectedSize ? [selectedSize] : []);
  const isCustomizationAvailable = availableSizes.length > 1 || availableColors.length > 1;

  const t = useTranslations('ProductAttributes');

  if (!isCustomizationAvailable) {
    return null;
  }

  return (
    <>
      <Divider className="mb-6" />
      <div className="px-4" data-testid="product-properties">
        {availableSizes.length > 1 && (
          <>
            <div className="mb-2 flex justify-between">
              <span className="block text-base font-medium leading-6 text-neutral-900" data-testid="size-heading">
                {t('filter.size')}
              </span>
            </div>
            {availableSizes.map(({ disabled, value, valueLabel, variant }) => (
              <div className="mb-2 mr-2 inline-block uppercase" data-testid="size-chip-pdp" key={value}>
                <Link
                  href={{
                    params: { id: productId, slug: productSlug },
                    pathname: '/product/[slug]/[id]',
                    query: { sku: variant.sku },
                  }}
                >
                  <SfChip
                    className="min-w-[48px]"
                    inputProps={{
                      checked: value === selectedSize?.value,
                      disabled,
                      readOnly: true,
                    }}
                    size="sm"
                  >
                    {valueLabel}
                  </SfChip>
                </Link>
              </div>
            ))}
          </>
        )}
        {availableColors.length > 1 && (
          <>
            <span className="mb-2 mt-2 block text-base font-medium leading-6 text-neutral-900">
              {t('filter.color')}
            </span>
            {availableColors.map((attribute) => (
              <div className="mb-2 mr-2 inline-block" data-testid="color-chip-pdp" key={attribute.value}>
                <Link
                  href={{
                    params: { id: productId, slug: productSlug },
                    pathname: '/product/[slug]/[id]',
                    query: { sku: attribute.variant.sku },
                  }}
                >
                  <SfChip
                    inputProps={{
                      checked: attribute.value === selectedColor?.value,
                      disabled: attribute.disabled,
                      readOnly: true,
                    }}
                    size="sm"
                    slotPrefix={
                      <svg
                        className="h-5 w-5 fill-neutral-500"
                        style={{ fill: guessAttributeColor(attribute) }}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" />
                      </svg>
                    }
                  >
                    {attribute.valueLabel}
                  </SfChip>
                </Link>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
