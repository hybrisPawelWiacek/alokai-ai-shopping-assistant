'use client';
import { SfButton, SfDrawer, SfIconClose, SfIconTune, useDisclosure } from '@storefront-ui/react';
import classNames from 'classnames';
import { mapValues } from 'lodash-es';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { type PropsWithChildren, useEffect, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useMedia } from 'react-use';

import { FACET_QUERY_PREFIX } from '@/config/constants';
import { getFacetsQueryParsers, searchProductsStaticQueryParsers } from '@/helpers/query-parsers';

export interface FiltersContainerProps extends PropsWithChildren {}

export default function FiltersContainer({ children }: FiltersContainerProps) {
  const t = useTranslations('FiltersContainer');
  const { close, isOpen, open } = useDisclosure({ initialValue: false });
  const isMobile = useMedia('(max-width: 1023px)');
  const nodeReference = useRef(null);
  const facetsParsers = getFacetsQueryParsers(useSearchParams());
  const [activeFilters, setActiveFilters] = useQueryStates(
    {
      ...searchProductsStaticQueryParsers,
      ...facetsParsers,
    },
    { shallow: false },
  );
  const onClearFilters = () => {
    setActiveFilters((values) => ({
      ...mapValues(values, () => null),
      // don't clear the search query
      search: values.search,
    }));
    close();
  };
  const hasActiveFilters = Object.entries(activeFilters).some(
    ([key, value]) => key.startsWith(FACET_QUERY_PREFIX) && value !== null,
  );

  useEffect(() => {
    if (!isMobile) {
      close();
    }
  }, [isMobile, close]);

  return (
    <>
      <CSSTransition data-testid="category-sidebar" in={isOpen} nodeRef={nodeReference} timeout={100}>
        {(state) => (
          <SfDrawer
            className={classNames(
              'z-[100] w-full shrink-0 bg-white shadow-none transition duration-500 ease-in-out lg:static lg:z-0 lg:row-span-3 lg:max-w-[303px] lg:translate-x-0 lg:transition-none',
              {
                '-translate-x-full transition-none': state === 'entering' || state === 'exited',
              },
            )}
            open
            placement="left"
            ref={nodeReference}
          >
            <div className="grid h-full [grid-template-rows:min-content_auto_min-content] lg:block">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-semibold typography-headline-4" data-testid="list-settings-title">
                  {t('heading')}
                </span>
                <SfButton
                  aria-label={t('close')}
                  className="lg:hidden"
                  onClick={close}
                  slotPrefix={<SfIconClose className="text-neutral-500" />}
                  variant="tertiary"
                />
              </div>
              <div className="overflow-y-auto lg:overflow-y-visible">{children}</div>
              <div className="flex flex-wrap justify-between gap-3 whitespace-nowrap border-t border-t-neutral-200 p-4 lg:mt-2 lg:border-0">
                <SfButton
                  className="flex-1"
                  data-testid="clear-all-filters-button"
                  disabled={!hasActiveFilters}
                  onClick={onClearFilters}
                  variant="secondary"
                >
                  {t('clear')}
                </SfButton>
                <SfButton className="flex-1 lg:hidden" onClick={close}>
                  {t('showProducts')}
                </SfButton>
              </div>
            </div>
          </SfDrawer>
        )}
      </CSSTransition>
      <SfButton
        className="col-start-2 row-start-1 w-auto justify-self-end whitespace-nowrap lg:hidden"
        data-testid="list-settings-button"
        onClick={open}
        slotPrefix={<SfIconTune />}
        variant="tertiary"
      >
        {t('heading')}
      </SfButton>
    </>
  );
}
