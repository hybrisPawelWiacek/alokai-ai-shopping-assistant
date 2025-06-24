import classNames from 'classnames';
import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages, useTranslations } from 'next-intl';
import type { PropsWithChildren, ReactNode } from 'react';

import type { SearchProducts } from '@/types';

import AccordionProvider from '../cms/page/accordion-provider';
import Pagination from '../pagination';
import Facets from './facets';
import FiltersContainer from './filters-container';
import ProductsList from './products-list';
import SortByDropdown from './sort-by-dropdown';

export interface ProductsListingPageProps extends PropsWithChildren {
  /**
   * Whether to hide the filters sidebar
   */
  hideFilters?: boolean;
  /**
   * Response of the search products query
   */
  productsCatalog: Awaited<ReturnType<SearchProducts>>;
  /**
   * Slot for content to be displayed below the products grid.
   */
  slotComponentsBottom?: ReactNode;
  /**
   * Slot for content to be displayed above the products grid.
   */
  slotComponentsTop?: ReactNode;
  /**
   * Slot for the empty state
   */
  slotEmptyState: ReactNode;
  /**
   * Slot for the filters prefix
   */
  slotFiltersPrefix?: ReactNode;
  /**
   * Slot for the summary paragraph which is displayed above the products grid
   * By default, it displays the number of products
   */
  slotSummary?: ReactNode;
  /**
   * Title of the page
   */
  title: string;
}

export default function ProductsListingPage({
  hideFilters,
  productsCatalog,
  slotComponentsBottom,
  slotComponentsTop,
  slotEmptyState,
  slotFiltersPrefix,
  slotSummary,
  title,
}: ProductsListingPageProps) {
  const t = useTranslations('ProductsListingPage');
  const messages = useMessages();
  const {
    facets,
    pagination: { currentPage, pageSize, totalResults },
    products,
  } = productsCatalog;

  return (
    <div className="lg:mb-18 mb-20" data-testid="category-layout">
      <h1
        className="mb-4 mt-4 font-semibold typography-headline-3 lg:typography-headline-2"
        data-testid="category-title"
      >
        {title}
      </h1>
      <div className="mb-10" data-testid="slot-components-top">
        {slotComponentsTop}
      </div>
      <div
        className={classNames(
          'grid grid-cols-2 gap-4 lg:gap-x-10',
          !hideFilters && 'lg:grid-cols-[303px_minmax(auto,_1fr)_auto]',
        )}
        data-testid="category-page-content"
      >
        {!hideFilters && (
          <NextIntlClientProvider
            messages={pick(messages, 'Facets', 'FiltersContainer', 'ExpandableList', 'SortByDropdown')}
          >
            <AccordionProvider active={['category-tree', ...facets.map((facet) => facet.name)]} allowMultipleOpen>
              <FiltersContainer>
                <FilterGroup title={t('sortBy')}>
                  <SortByDropdown />
                </FilterGroup>
                <FilterGroup title={t('filters')}>
                  {slotFiltersPrefix}
                  <Facets facets={facets} />
                </FilterGroup>
              </FiltersContainer>
            </AccordionProvider>
          </NextIntlClientProvider>
        )}
        <span
          className={classNames(
            'font-medium typography-text-base max-lg:self-center',
            hideFilters ? 'col-span-full' : 'col-start-1 row-start-1 lg:col-start-2',
          )}
          data-testid="products-count"
        >
          {slotSummary || t('numberOfProducts', { total: totalResults })}
        </span>
        <section
          className={classNames(
            'col-span-full grid grid-cols-1 gap-4 2-extra-small:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-6 2xl:grid-cols-4',
            hideFilters ? 'lg:col-span-full' : 'lg:col-start-2 lg:row-start-1',
          )}
          data-testid="category-grid"
        >
          {products.length === 0 && slotEmptyState}
          <ProductsList products={products} />
          {products.length > 0 && (
            <Pagination
              className="col-span-full mt-4"
              currentPage={currentPage}
              pageSize={pageSize ?? 24}
              totalResults={totalResults}
            />
          )}
        </section>
      </div>
      <div className="mb-20 mt-20" data-testid="slot-components-bottom">
        {slotComponentsBottom}
      </div>
    </div>
  );
}

interface FilterGroupProps extends PropsWithChildren {
  title: string;
}

function FilterGroup({ children, title }: FilterGroupProps) {
  return (
    <div className="mb-6 w-full last:mb-0">
      <span
        className="mb-2 block bg-neutral-100 px-4 py-2 font-headings text-sm font-semibold uppercase tracking-widest md:rounded-md"
        data-testid="list-settings-item"
      >
        {title}
      </span>
      {children}
    </div>
  );
}
