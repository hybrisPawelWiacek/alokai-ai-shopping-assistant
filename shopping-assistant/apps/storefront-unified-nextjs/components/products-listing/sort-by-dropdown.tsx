'use client';
import { SfSelect } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';

import { searchProductsStaticQueryParsers } from '@/helpers/query-parsers';

const sortingOptions = [
  {
    id: 'relevance',
  },
  {
    id: 'price-low-to-high',
  },
  {
    id: 'price-high-to-low',
  },
] as const;

export default function SortByDropdown() {
  const t = useTranslations('SortByDropdown');
  const [{ sortBy }, setQuery] = useQueryStates(searchProductsStaticQueryParsers, { shallow: false });

  return (
    <label className="mx-4 mt-6 block" suppressHydrationWarning>
      <span className="sr-only">{t('label')}</span>
      <SfSelect onChange={(e) => setQuery({ sortBy: e.target.value })} value={sortBy}>
        {sortingOptions.map((value) => (
          <option aria-selected={value.id === sortBy} key={value.id} value={value.id}>
            {t(`options.${value.id}`)}
          </option>
        ))}
      </SfSelect>
    </label>
  );
}
