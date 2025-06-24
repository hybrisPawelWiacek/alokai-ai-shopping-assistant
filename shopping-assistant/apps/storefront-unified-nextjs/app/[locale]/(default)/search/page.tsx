import { SfButton } from '@storefront-ui/react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { SearchParams } from 'nuqs/server';

import ProductsListingPage from '@/components/products-listing/products-listing-page';
import { Link } from '@/config/navigation';
import { parseSearchProductsQuery } from '@/helpers/query-parsers';
import { getSdk } from '@/sdk';

interface SearchPageProps {
  searchParams: SearchParams;
}

export async function generateMetadata() {
  const t = await getTranslations('SearchPage');

  return {
    title: t('metaTitle'),
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const t = await getTranslations('SearchPage');
  const sdk = getSdk();
  const searchProductsQuery = {
    ...parseSearchProductsQuery(searchParams),
  };
  const productCatalog = await sdk.unified.searchProducts(searchProductsQuery);
  const isEmpty = productCatalog.products.length === 0;

  return (
    <div className="px-4 pt-4 lg:px-0">
      <ProductsListingPage
        hideFilters={isEmpty}
        productsCatalog={productCatalog}
        slotEmptyState={
          <div
            className="col-span-full mx-auto flex max-w-screen-sm flex-col items-center gap-4 text-center"
            data-testid="category-empty-state"
          >
            <Image
              alt={t('empty.imgAlt')}
              height="192"
              loading="eager"
              src="/images/empty-search.svg"
              unoptimized
              width="192"
            />
            <p className="text-lg font-medium" data-testid="empty-state-text-1">
              {t('empty.paragraph1')}
            </p>
            <p data-testid="empty-state-text-2">{t('empty.paragraph2')}</p>
            <SfButton as={Link} href="/category">
              {t('empty.button')}
            </SfButton>
          </div>
        }
        slotSummary={isEmpty ? t('empty.summary') : undefined}
        title={t('heading', { search: searchProductsQuery.search })}
      />
    </div>
  );
}
