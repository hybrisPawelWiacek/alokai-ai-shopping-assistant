import type { Breadcrumb } from '@/components/ui/breadcrumbs';
import type { SfCategory } from '@/types';

/**
 * @description Helper function for generating breadcrumbs for a given category ancestors.
 *
 * @param categoryAncestors - An array of category objects representing the category ancestors.
 *
 * @returns An array of breadcrumb items.
 */
export function getCategoryBreadcrumbs(categoryAncestors: SfCategory[]): Breadcrumb[] {
  const breadcrumbsList = categoryAncestors.map(({ id, name }, i, array) => {
    const basePath = array.slice(0, i).map((ancestor) => ancestor.id);

    return {
      id,
      link: { params: { slugs: basePath.concat(id) }, pathname: '/category/[[...slugs]]' },
      name,
    };
  });

  return breadcrumbsList;
}
