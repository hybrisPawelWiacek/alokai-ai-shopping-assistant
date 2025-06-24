import type { PropsWithStyle } from '@storefront-ui/react';
import { SfIconArrowBack, SfIconCheck, SfListItem } from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';

import AccordionItem from '@/components/cms/page/accordion-item';
import ExpandableList from '@/components/ui/expandable-list';
import { Link, type LinkHref } from '@/config/navigation';
import type { GetCategory, SfFacet } from '@/types';

export interface CategoryTreeProps {
  /**
   * Category data returned from the getCategory query
   */
  categoryData: Awaited<ReturnType<GetCategory>> | null;
  /**
   * Facet data for the category returned from the searchProducts query.
   */
  facet?: SfFacet;
  /**
   * Category slugs for the current nested category
   */
  slugs: string[];
}

export default function CategoryTree({ categoryData, facet, slugs }: CategoryTreeProps) {
  const t = useTranslations('CategoryTree');
  const { ancestors = [], category } = categoryData ?? {};
  const categories = facet?.values ?? [];
  const parent = ancestors.at(-1);

  return (
    <AccordionItem
      className="border-b border-neutral-200"
      data-testid="category-tree"
      id="category-tree"
      summary={
        <span className="text-base font-medium capitalize" data-testid="filter-category-heading">
          {t('category')}
        </span>
      }
    >
      <div className="pb-6">
        <div className="flex flex-col gap-y-2">
          {parent ? (
            <CategoryTreeItem
              href={{
                params: { slugs: slugs.slice(0, -1) },
                pathname: '/category/[[...slugs]]',
              }}
            >
              <SfIconArrowBack className="mr-2 text-neutral-500" size="sm" />
              {t('backToParent', { parent: parent.name })}
            </CategoryTreeItem>
          ) : (
            category && (
              <CategoryTreeItem href="/category">
                <SfIconArrowBack className="mr-2 text-neutral-500" size="sm" />
                {t('backToParent', { parent: t('allProducts') })}
              </CategoryTreeItem>
            )
          )}
          {category && (
            <CategoryTreeItem key={category.id} selected>
              {category.name}
            </CategoryTreeItem>
          )}
          <div data-testid="categories">
            <ExpandableList>
              {categories.map(({ label, value }) => (
                <CategoryTreeItem
                  href={{
                    params: { slugs: [...slugs, value] },
                    pathname: '/category/[[...slugs]]',
                  }}
                  key={value}
                >
                  {label}
                </CategoryTreeItem>
              ))}
            </ExpandableList>
          </div>
        </div>
      </div>
    </AccordionItem>
  );
}

interface CategoryTreeItemProps extends PropsWithChildren, PropsWithStyle {
  href?: LinkHref;
  selected?: boolean;
}

function CategoryTreeItem({ children, className, href, selected }: CategoryTreeItemProps) {
  return (
    <SfListItem
      as={selected ? 'span' : Link}
      className={classNames(
        'lg:sf-list-item-sm py-4 lg:rounded-md lg:py-1.5',
        className,
        selected && 'cursor-auto bg-primary-100 hover:bg-primary-100',
      )}
      data-testid={selected ? 'category-tree-current' : 'category-tree-item'}
      disabled={selected}
      href={href}
      selected={selected}
      size="sm"
      slotSuffix={selected && <SfIconCheck className="text-primary-700" size="sm" />}
    >
      <span className="flex items-center gap-2">
        <span
          className="flex items-center text-base capitalize text-black lg:text-sm"
          data-testid="list-item-menu-label"
        >
          {children}
        </span>
      </span>
    </SfListItem>
  );
}
