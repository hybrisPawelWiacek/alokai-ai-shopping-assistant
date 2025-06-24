import type { PropsWithStyle } from '@storefront-ui/react';
import {
  SfCounter,
  SfIconPackage,
  SfIconSafetyCheck,
  SfIconSell,
  SfIconWarehouse,
  SfLink,
  SfRating,
} from '@storefront-ui/react';
import classNames from 'classnames';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import type { PropsWithChildren, ReactNode } from 'react';

import type { SfProduct } from '@/types';

import DecoratedPrice from './decorated-price';
import DecoratedPriceClient from './decorated-price-client';
import PurchaseCardForm from './purchase-card-form';
import Divider from './ui/divider';
import Skeleton from './ui/skeleton';
import Tag from './ui/tag';

export interface PurchaseCardProps extends PropsWithChildren {
  /**
   * Product ID
   */
  id: string;
  /**
   * Product Data
   */
  product?: SfProduct;
  /**
   * Product SKU
   */
  sku: string;
}

export default function PurchaseCard({ id, product, sku }: PurchaseCardProps) {
  const t = useTranslations('PurchaseCard');

  const minProductQuantity = 1;
  const maxProductQuantity = product?.quantityLimit ?? undefined;
  const isOutOfStock = product?.quantityLimit === 0;

  return product ? (
    <div
      className="p-4 md:sticky md:top-20 md:rounded-md md:border md:border-neutral-100 md:shadow-lg xl:p-6"
      data-testid="purchase-card"
    >
      {!!product.price?.isDiscounted && (
        <Tag className="mb-4" data-testid="special-tag" strong variant="secondary">
          <SfIconSell className="ml-1" size="sm" />
          <span className="mr-1">{t('sale')}</span>
        </Tag>
      )}
      {product.name && (
        <h1 className="font-semibold text-neutral-900 typography-headline-4" data-testid="product-name">
          {product.name}
        </h1>
      )}
      {product.price && (
        <>
          <noscript>
            <DecoratedPrice
              className="mt-1"
              classNameVariants={{
                regular: 'typography-headline-2',
                special: 'text-base',
              }}
              price={product.price}
            />
          </noscript>
          <NextIntlClientProvider>
            <DecoratedPriceClient
              className="mt-1"
              classNameVariants={{
                regular: 'typography-headline-2',
                special: 'text-base',
              }}
              data-testid="price"
              id={id}
              sku={sku}
            />
          </NextIntlClientProvider>
        </>
      )}
      <div className="mb-2 mt-4 inline-flex items-center text-xs">
        <SfRating max={5} size="xs" value={product.rating?.average} />
        <SfCounter className="ml-1" size="xs">
          {product.rating?.count || 0}
        </SfCounter>
        <SfLink
          className="ml-2 cursor-pointer text-neutral-500 underline-offset-4"
          href="#customer-reviews"
          variant="secondary"
        >
          {t('reviewsCount', { count: product.rating?.count || 0 })}
        </SfLink>
      </div>
      {product.description && (
        <div
          className="mt-4 text-sm"
          dangerouslySetInnerHTML={{ __html: product.description }}
          data-testid="product-description"
        />
      )}
      <Divider className="my-4" />
      {isOutOfStock && (
        <Tag className="mb-4 w-full" variant="negative">
          {t('outOfStock')}
        </Tag>
      )}
      <PurchaseCardForm
        isOutOfStock={isOutOfStock}
        maxProductQuantity={maxProductQuantity}
        minProductQuantity={minProductQuantity}
        productId={product.id}
        sku={product.sku}
      />
      <Divider className="my-4" />
      <AdditionalInfo icon={<SfIconPackage className="flex-shrink-0 text-neutral-500" size="sm" />}>
        {t.rich('additionalInfo.shipping', {
          link: (chunks) => (
            <SfLink href="#" variant="secondary">
              {chunks}
            </SfLink>
          ),
        })}
      </AdditionalInfo>
      <AdditionalInfo className="mt-2" icon={<SfIconWarehouse className="flex-shrink-0 text-neutral-500" size="sm" />}>
        {t.rich('additionalInfo.pickup', {
          link: (chunks) => (
            <SfLink href="#" variant="secondary">
              {chunks}
            </SfLink>
          ),
        })}
      </AdditionalInfo>
      <AdditionalInfo
        className="mt-2"
        icon={<SfIconSafetyCheck className="flex-shrink-0 text-neutral-500" size="sm" />}
      >
        {t.rich('additionalInfo.returns', {
          link: (chunks) => (
            <SfLink href="#" variant="secondary">
              {chunks}
            </SfLink>
          ),
        })}
      </AdditionalInfo>
    </div>
  ) : (
    <Skeleton className={'min-h-[450px]'} inline={true} />
  );
}

interface AdditionalInfoProps extends PropsWithChildren, PropsWithStyle {
  /**
   * Icon to be displayed
   */
  icon?: ReactNode;
}

function AdditionalInfo({ children, className, icon }: AdditionalInfoProps) {
  return (
    <div className={classNames('flex', className)} data-testid="additional-info-line">
      {icon}
      <div className="ml-2 text-sm font-normal text-neutral-900">{children}</div>
    </div>
  );
}
