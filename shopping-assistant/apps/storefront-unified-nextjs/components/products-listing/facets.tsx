'use client';
import { useTranslations } from 'next-intl';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import type { ReactNode } from 'react';

import AccordionItem from '@/components/cms/page/accordion-item';
import type { ExpandableListProps } from '@/components/ui/expandable-list';
import ExpandableList from '@/components/ui/expandable-list';
import { FACET_QUERY_PREFIX } from '@/config/constants';
import type { SfFacet } from '@/types';

import type { FacetItemProps } from './facet-item';
import { CheckboxItem, ColorItem, RadioItem, SizeItem } from './facet-item';

export interface FacetsProps {
  /**
   * An array of facets to display
   */
  facets: SfFacet[];
}

export default function Facets({ facets }: FacetsProps) {
  const t = useTranslations('Facets');
  if (!facets || facets?.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col" data-testid="category-filters">
      {facets.map((facet) => {
        switch (facet.type) {
          case 'CATEGORY': {
            return null;
          }
          case 'COLOR': {
            return (
              <Facet
                expandableListProps={{
                  id: 'color',
                }}
                facet={{ ...facet, label: t('colorHeading') }}
                itemRenderer={ColorItem}
                key={facet.name}
                multiSelect
              />
            );
          }
          case 'SINGLE_SELECT': {
            return <Facet facet={facet} itemRenderer={RadioItem} key={facet.name} />;
          }
          case 'SIZE': {
            return (
              <Facet
                containerClassName="grid md:grid-cols-[repeat(auto-fill,_minmax(47px,_1fr))] grid-cols-[repeat(auto-fill,_minmax(60px,_1fr))] gap-2 justify-center px-4 pt-2"
                expandableListProps={{
                  buttonClassName: '-ml-4 lg:!-ml-3 mt-2',
                  id: 'size',
                  maxCollapsedItems: 15,
                }}
                facet={{ ...facet, label: t('sizeHeading') }}
                itemRenderer={SizeItem}
                key={facet.name}
                multiSelect
              />
            );
          }
          default: {
            return <Facet facet={facet} itemRenderer={CheckboxItem} key={facet.name} multiSelect />;
          }
        }
      })}
    </div>
  );
}

interface FacetProps {
  containerClassName?: string;
  expandableListProps?: Omit<ExpandableListProps, 'children'>;
  facet: SfFacet;
  itemRenderer: (props: FacetItemProps) => ReactNode;
  multiSelect?: boolean;
}

function Facet({
  containerClassName,
  expandableListProps,
  facet,
  itemRenderer: FacetItem,
  multiSelect = false,
}: FacetProps) {
  const [selected, setSelected] = useQueryState(
    `${FACET_QUERY_PREFIX}${facet.name}`,
    parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: false }),
  );
  function toggleFacet(value: string) {
    if (selected.includes(value)) {
      const updated = selected.filter((v) => v !== value);
      return setSelected(updated.length ? updated : null);
    }

    return setSelected(multiSelect ? [...selected, value] : [value]);
  }

  return (
    <AccordionItem
      className="border-b border-neutral-200 pb-6"
      id={facet.name}
      key={facet.name}
      summary={
        <span
          className="text-base font-medium capitalize"
          data-testid={`filter-${facet.label.replace(/\s+/g, '-').toLowerCase()}-heading`}
        >
          {facet.label}
        </span>
      }
      summaryClassName="pt-4"
    >
      <div className={containerClassName}>
        <ExpandableList {...expandableListProps}>
          {facet.values.map((item) => (
            <FacetItem
              key={item.value}
              {...item}
              onItemClick={() => toggleFacet(item.value)}
              selected={selected.includes(item.value)}
            />
          ))}
        </ExpandableList>
      </div>
    </AccordionItem>
  );
}
