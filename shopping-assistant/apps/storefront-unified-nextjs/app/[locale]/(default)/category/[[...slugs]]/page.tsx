import { SfLink } from '@storefront-ui/react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { SearchParams } from 'nuqs/server';
import { cache } from 'react';

import type { PropsWithCmsPage } from '@sf-modules/cms-contentful/components/connect-cms-page';
import connectCmsPage from '@sf-modules/cms-contentful/components/connect-cms-page';
import RenderCmsContent from '@sf-modules/cms-contentful/components/render-cms-content';
import CategoryTree from '@/components/products-listing/category-tree';
import ProductsListingPage from '@/components/products-listing/products-listing-page';
import SeoItemList from '@/components/seo/seo-item-list';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import Portal from '@/components/ui/portal';
import { Link } from '@/config/navigation';
import { getCategoryBreadcrumbs } from '@/helpers/get-category-breadcrumbs';
import { parseSearchProductsQuery } from '@/helpers/query-parsers';
import { getSdk } from '@/sdk';

const getCategory = cache(async (id: string | undefined) => {
  if (!id) {
    return null;
  }

  const sdk = getSdk();
  try {
    return await sdk.unified.getCategory({ id });
  } catch (_) {
    return notFound();
  }
});

/**
 * CMS Category Page interface
 */
interface CategoryPage {
  /**
   * Components to be rendered only after scrolling down the page.
   */
  componentsBottom: any;
  /**
   * Components to be rendered immediately when the page is loaded.
   */
  componentsTop: any;
}

/**
 * Category Page props.
 */
interface CategoryPageProps extends PropsWithCmsPage<CategoryPage> {
  params: {
    locale: string;
    slugs?: string[];
  };
  searchParams: SearchParams;
}

/**
 * By default Next.js encodes path params (for example "-" is encoded to "%3D"), this function decodes them.
 */
const resolveSlugs = ({ slugs }: CategoryPageProps['params']) => slugs?.map((slug) => decodeURIComponent(slug)) ?? [];

export async function generateMetadata({ params }: Omit<CategoryPageProps, 'page'>) {
  const id = resolveSlugs(params).at(-1);
  const t = await getTranslations();
  const category = await getCategory(id);

  return {
    title: category?.category.name ?? t('CategoryPage.allProducts'),
  };
}

export default connectCmsPage<CategoryPageProps>(
  async (props) => {
    const { page, params, searchParams } = props;
    const slugs = resolveSlugs(params);
    const categoryId = slugs.at(-1);
    const t = await getTranslations();
    const sdk = getSdk();
    const searchProductsQuery = {
      ...parseSearchProductsQuery(searchParams),
      category: categoryId,
    };
    const [categoryData, productCatalog] = await Promise.all([
      getCategory(categoryId),
      sdk.unified.searchProducts(searchProductsQuery),
    ]);
    const categoryTitle = categoryData?.category.name || t('CategoryPage.allProducts');
    const breadcrumbs = [
      { id: '_home_', link: '/', name: t('Breadcrumbs.home') },
      { id: '_category_', link: '/category', name: t('CategoryPage.allProducts') },
      ...getCategoryBreadcrumbs(categoryData?.ancestors ?? []),
      ...(categoryData ? [{ id: categoryTitle, link: '#', name: categoryTitle }] : []),
    ];
    const categoryFacet = productCatalog.facets.find((facet) => facet.type === 'CATEGORY');

    return (
      <div className="px-4 pt-4 lg:px-0">
        <Portal>
          <SeoItemList config={{ productCatalogItemList: productCatalog?.products ?? [] }} />
        </Portal>
        <Breadcrumbs breadcrumbs={breadcrumbs} className="mb-5" />
        <ProductsListingPage
          productsCatalog={productCatalog}
          slotComponentsBottom={page?.componentsBottom && <RenderCmsContent item={page.componentsBottom} />}
          slotComponentsTop={page?.componentsTop && <RenderCmsContent item={page.componentsTop} />}
          slotEmptyState={
            <div
              className="col-span-full mt-8 flex flex-col items-center gap-4 text-center"
              data-testid="category-empty-state"
            >
              <Image
                alt={t('CategoryPage.empty.imgAlt')}
                height="192"
                loading="eager"
                src="/images/empty-category.svg"
                unoptimized
                width="192"
              />
              <p className="text-lg font-medium" data-testid="empty-state-text-1">
                {t('CategoryPage.empty.paragraph1')}
              </p>
              <p data-testid="empty-state-text-2">
                {t.rich('CategoryPage.empty.paragraph2', {
                  clear: (chunks) => (
                    <SfLink as={Link} data-testid="button" href={{ pathname: '/category' }}>
                      {chunks}
                    </SfLink>
                  ),
                })}
              </p>
            </div>
          }
          slotFiltersPrefix={<CategoryTree categoryData={categoryData} facet={categoryFacet} slugs={slugs} />}
          title={categoryTitle}
        />
      </div>
    );
  },
  {
    getCmsPagePath(props) {
      const slugs = resolveSlugs(props.params);
      return `/category/${slugs.join('/')}`;
    },
  },
);
