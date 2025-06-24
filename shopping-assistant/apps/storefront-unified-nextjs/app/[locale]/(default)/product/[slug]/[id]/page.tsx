import { SfLoaderCircular } from '@storefront-ui/react';
import { pick } from 'lodash-es';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { parseAsString, type SearchParams } from 'nuqs/server';
import { cache } from 'react';

import AccordionItem from '@/components/cms/page/accordion-item';
import AccordionProvider from '@/components/cms/page/accordion-provider';
import type { PropsWithCmsPage } from '@sf-modules/cms-contentful/components/connect-cms-page';
import connectCmsPage from '@sf-modules/cms-contentful/components/connect-cms-page';
import RenderCmsContent from '@sf-modules/cms-contentful/components/render-cms-content';
import Gallery from '@/components/gallery';
import ProductAttributes from '@/components/product-attributes';
import ProductReviews from '@/components/product-reviews';
import ProductReviewsAccordion from '@/components/product-reviews-accordion';
import PurchaseCard from '@/components/purchase-card';
import SeoProduct from '@/components/seo/seo-product';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import Divider from '@/components/ui/divider';
import Portal from '@/components/ui/portal';
import { getCategoryBreadcrumbs } from '@/helpers/get-category-breadcrumbs';
import { getSdk } from '@/sdk';
import type { GetProductDetailsArgs } from '@/types';

/**
 * CMS Product Details Page interface
 */
interface ProductDetailsPage {
  /**
   * Components to be rendered only after scrolling down the page.
   */
  componentsBottom: any;
}

/**
 * Product Details Page props.
 */
interface ProductDetailsPageProps extends PropsWithCmsPage<ProductDetailsPage> {
  params: {
    id: string;
    locale: string;
    slug: string;
  };
  searchParams: SearchParams;
}

const getProductDetails = cache(async ({ id, sku }: GetProductDetailsArgs) => {
  const sdk = getSdk();

  try {
    return await sdk.unified.getProductDetails({
      id,
      sku,
    });
  } catch (_) {
    return null;
  }
});

const parseSearchParams = (searchParams: SearchParams) => ({
  sku: parseAsString.parseServerSide(searchParams.sku) ?? undefined,
});

export async function generateMetadata({
  params,
  searchParams,
}: Omit<ProductDetailsPageProps, 'page'>): Promise<Metadata> {
  const { sku } = parseSearchParams(searchParams);
  const productData = await getProductDetails({ id: params.id, sku });

  return {
    title: productData?.product?.name,
  };
}

export default connectCmsPage<ProductDetailsPageProps>(
  async (props) => {
    const { page, params, searchParams } = props;
    const { sku } = parseSearchParams(searchParams);
    const productData = await getProductDetails({ id: params.id, sku });
    const messages = await getMessages();
    const t = await getTranslations();

    if (!productData?.product) {
      notFound();
    }
    const { categoryHierarchy, product } = productData;

    const breadcrumbs = [
      { id: '_home_', link: '/', name: t('Breadcrumbs.home') },
      ...getCategoryBreadcrumbs(categoryHierarchy),
      { id: '_current_', link: `#`, name: product.name! },
    ];

    return (
      <>
        <Portal>
          <SeoProduct config={{ product: productData.product ?? [] }} />
        </Portal>
        <Breadcrumbs breadcrumbs={breadcrumbs} className="p-4 md:px-0" />
        <div className="grid-cols-[minmax(56%,500px)auto] gap-x-6 [grid-template-areas:'left-top_right''left-bottom_right'] md:grid">
          <section className="[grid-area:left-top] md:h-full xl:max-h-[700px]">
            <NextIntlClientProvider messages={pick(messages, 'Gallery')}>
              <Gallery images={product.gallery} />
            </NextIntlClientProvider>
          </section>
          <section className="mb-10 [grid-area:right] md:mb-0">
            <NextIntlClientProvider
              messages={pick(messages, ['PurchaseCard', 'PurchaseCardForm', 'QuantitySelector', 'AddToCartButton'])}
            >
              <PurchaseCard id={params.id} product={product} sku={sku!} />
            </NextIntlClientProvider>
          </section>
          <section className="[grid-area:left-bottom] md:mt-8">
            <ProductAttributes
              currentAttributes={product.attributes}
              productId={product.id}
              productSlug={product.slug}
              variants={product.variants}
            />
            <Divider className="mb-2 mt-4" />
            <AccordionProvider active={['productDetails']} allowMultipleOpen>
              <AccordionItem
                id="productDetails"
                summary={
                  <h2
                    className="font-semibold typography-headline-5 md:typography-headline-2"
                    data-testid="product-details-heading"
                  >
                    {t('ProductAccordion.productDetails')}
                  </h2>
                }
              >
                <div
                  className="px-4 text-neutral-900"
                  dangerouslySetInnerHTML={{ __html: product.description ?? t('ProductAccordion.descriptionFallback') }}
                  data-testid="product-description"
                />
              </AccordionItem>
              <Divider className="my-4" />
              <ProductReviewsAccordion
                id="customer-reviews"
                summary={
                  <h2
                    className="font-semibold typography-headline-5 md:typography-headline-2"
                    data-testid="customer-reviews-heading"
                  >
                    {t('ProductAccordion.customerReviews')}
                  </h2>
                }
              >
                <div className="min-h-10 p-4 text-neutral-900" data-testid="customer-reviews">
                  <ProductReviews
                    productId={product.id}
                    renderEmpty={t('ProductAccordion.noReviews')}
                    renderLoading={
                      <div className="my-2 flex justify-center">
                        <SfLoaderCircular ariaLabel={t('ProductAccordion.loading')} data-testid="loading" />
                      </div>
                    }
                    showLessText={t('ProductAccordion.readLess')}
                    showMoreText={t('ProductAccordion.readMore')}
                  />
                </div>
              </ProductReviewsAccordion>
            </AccordionProvider>
          </section>
          <Divider className="mb-2 mt-4" />
        </div>
        <div className="mb-20 mt-20 px-4 md:px-0" data-testid="slot-components-bottom">
          {page?.componentsBottom && <RenderCmsContent item={page.componentsBottom} />}
        </div>
      </>
    );
  },
  {
    getCmsPagePath(props) {
      const { id, slug } = props.params;
      return `/product/${slug}/${id}`;
    },
  },
);
