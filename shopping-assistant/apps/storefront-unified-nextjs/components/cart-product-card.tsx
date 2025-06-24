import type { PropsWithStyle } from '@storefront-ui/react';
import { SfButton, SfIconDelete, SfIconSell, SfLink } from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/config/navigation';
import { findAttribute } from '@/helpers';
import type { Maybe, SfAttribute, SfDiscountablePrice } from '@/types';

import DecoratedPrice from './decorated-price';
import ImageWithPlaceholder from './image-with-placeholder';
import QuantitySelector from './ui/quantity-selector';
import Tag from './ui/tag';

export interface CartProductCardProps extends PropsWithStyle {
  /**
   * Product attributes
   */
  attributes: SfAttribute[];
  /**
   * Desired quantity of the product
   */
  desiredQuantity?: number;
  /**
   * If the product is disabled
   */
  disabled?: boolean;
  /**
   * Unique identifier of the product
   */
  id: string;
  /**
   * Alternative text for the product image
   */
  imageAlt?: null | string;
  /**
   * URL of the product image
   */
  imageUrl?: string;
  /**
   * Maximum quantity of the product
   */
  maxValue: number;
  /**
   * Minimum quantity of the product
   */
  minValue: number;
  /**
   * Product name
   */
  name: string;
  /**
   * Callback to remove the product from the cart
   */
  onRemove?: () => void;
  /**
   * Callback to update the quantity of the product
   */
  onUpdate?: (quantity: number) => void;
  /**
   * If the product is out of stock
   */
  outOfStock?: boolean;
  /**
   * Regular price of the product
   */
  price?: Maybe<SfDiscountablePrice>;
  /**
   * Unique identifier of the product
   */
  productId: string;
  /**
   * Product SKU
   */
  sku: string;
  /**
   * If the SKU should be displayed first
   */
  skuFirst?: boolean;
  /**
   * Product slug
   */
  slug: string;
  /**
   * Special price of the product
   */
  specialPrice?: string;
  /**
   * Total price of the product
   */
  totalPrice?: string;
  /**
   * Current quantity of the product
   */
  value: number;
}

export default function CartProductCard({
  attributes,
  className,
  desiredQuantity,
  disabled,
  imageAlt,
  imageUrl,
  maxValue,
  minValue,
  name,
  onRemove,
  onUpdate,
  outOfStock,
  price,
  productId,
  sku,
  skuFirst,
  slug,
  specialPrice,
  totalPrice,
  value,
}: CartProductCardProps) {
  const [quantity, setQuantity] = useState<number>(value);
  const t = useTranslations('CartProductCard');

  const sizeAttribute = findAttribute(attributes, (attribute) => attribute.name.toLowerCase() === 'size');
  const colorAttribute = findAttribute(attributes, (attribute) => attribute.name.toLowerCase() === 'color');
  const selectedAttributes = [sizeAttribute, colorAttribute].filter(
    (filterValue): filterValue is SfAttribute => filterValue != null,
  );

  const handleUpdateQuantity = (quantityValue: number) => {
    setQuantity(quantityValue);
    onUpdate?.(quantityValue);
  };

  const isSmallerQuantity = desiredQuantity && maxValue && desiredQuantity > maxValue;

  return (
    <li
      className={classNames(
        'w-full min-w-[320px] border-b-[1px] border-neutral-200 p-4 first:border-t last:mb-0',
        className,
      )}
      data-testid="cart-product-card"
    >
      {(isSmallerQuantity || outOfStock) && (
        <Tag
          className="mb-4 w-full"
          data-testid="cart-product-card-tag"
          size="sm"
          variant={isSmallerQuantity ? 'warning' : 'negative'}
        >
          {isSmallerQuantity ? t('tag.smallerQuantity', { desiredQuantity, maxValue }) : t('tag.outOfStock')}
        </Tag>
      )}

      <div className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto]">
        <div
          className={classNames('relative col-[1] row-span-2 overflow-hidden rounded-md', {
            'opacity-50': outOfStock,
          })}
        >
          <SfLink
            as={Link}
            className="relative block w-[92px] overflow-hidden rounded-md border border-neutral-200"
            data-testid="cart-product-card-image-link"
            href={{ params: { id: productId, slug }, pathname: '/product/[slug]/[id]', query: { sku } }}
          >
            <ImageWithPlaceholder
              alt={imageAlt || t('imagePlaceholder')}
              data-testid="cart-product-card-image"
              height={92}
              nextImageClassName="w-full h-full object-contain aspect-square"
              placeholder="/images/placeholder-300.webp"
              sizes="(max-width: 1023px) 100px, 92px"
              src={imageUrl}
              unoptimized={!imageUrl}
              width={92}
            />
          </SfLink>
          {specialPrice && (
            <div
              className="absolute left-0 top-0 bg-secondary-600 px-2 py-1 text-xs font-medium text-white"
              data-testid="cart-product-card-sale"
            >
              <SfIconSell className="mr-1" size="xs" />
              {t('sale')}
            </div>
          )}
        </div>
        <div className="col-[2] row-[1] grid min-w-[180px] grid-cols-[1fr_auto] grid-rows-[auto_auto_1fr] pl-4">
          <SfLink
            as={Link}
            className={classNames('mb-1 text-neutral-900 no-underline typography-text-sm', { 'font-medium': skuFirst })}
            data-testid="cart-product-card-title"
            href={{ params: { id: productId, slug }, pathname: '/product/[slug]/[id]', query: { sku } }}
            variant="secondary"
          >
            {skuFirst ? productId : name}
          </SfLink>
          {price && (
            <DecoratedPrice
              className="row-[3] mb-0 sm:row-auto lg:text-right"
              classNameVariants={{
                regular: `typography-text-sm !font-normal`,
                special: 'typography-text-xs',
              }}
              data-testid="cart-product-card-price"
              price={price}
            />
          )}
          <div className="col-span-2 mb-1 text-xs font-normal leading-5 sm:typography-text-sm">
            {skuFirst ? (
              <p className="text-neutral-900" data-testid="cart-product-card-subtitle-skuFirst">
                {name}
              </p>
            ) : (
              <ul className="text-neutral-700" data-testid="cart-product-card-attributes-list">
                {selectedAttributes.map(({ label, name: attributeName, valueLabel }) => (
                  <li data-testid="cart-product-card-attribute-item" key={attributeName}>
                    <span className="mr-1" data-testid="cart-product-card-attribute-label">
                      {label}:
                    </span>
                    <span className="font-medium" data-testid="cart-product-card-attribute-value">
                      {valueLabel}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-span-2 row-[3] flex flex-wrap items-center pt-4 sm:mt-auto lg:col-[2] lg:row-[2] lg:pl-4 lg:pt-0">
          <QuantitySelector
            className="mr-auto sm:mt-0 lg:mr-4"
            data-testid="cart-product-card-selector"
            disabled={disabled || outOfStock}
            maxValue={maxValue}
            minValue={minValue}
            onChange={handleUpdateQuantity}
            showPlaceholder={outOfStock}
            value={quantity}
          />
          <SfButton
            className="order-1 ml-4 mr-1 text-sm lg:order-none lg:ml-auto"
            data-testid="cart-product-card-remove-btn"
            disabled={disabled}
            onClick={() => onRemove?.()}
            slotPrefix={<SfIconDelete size="sm" />}
            square
            variant="tertiary"
          />
          <div className="min-w-[100px] text-right font-medium" data-testid="cart-product-card-total">
            {totalPrice}
          </div>
        </div>
      </div>
    </li>
  );
}
