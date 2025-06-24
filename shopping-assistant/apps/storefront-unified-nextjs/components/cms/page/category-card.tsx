import type { PropsWithStyle } from '@storefront-ui/react';
import type { AgnosticCmsCategoryCardProps } from '@vsf-enterprise/cms-components-utils';
import classNames from 'classnames';

import ImageWithPlaceholder from '@/components/image-with-placeholder';
import { Link } from '@/config/navigation';
import { getSdk } from '@/sdk';
import { logger } from '@/sdk/logger';

export type CategoryCardProps = AgnosticCmsCategoryCardProps & PropsWithStyle;

export default async function CategoryCard({ categoryId = '', className, image, ...rest }: CategoryCardProps) {
  const { category } = await getSdk()
    .unified.getCategory({ id: `${categoryId}` })
    .catch(() => ({ category: null }));

  if (!category) {
    logger.warning(`Category with ID '${categoryId}' not found`);
    return null;
  }

  const link = `/category/${category.slug}/${category.id}`;
  const title = category.name;

  return (
    <div
      {...rest}
      className={classNames('group relative min-w-[180px] max-w-[240px] flex-col', className)}
      data-testid="category-card"
    >
      <Link
        aria-label={title}
        className="absolute z-[1] h-full w-full focus-visible:rounded-md focus-visible:outline focus-visible:outline-offset"
        href={link ?? ''}
      />
      <ImageWithPlaceholder
        alt={image?.alt ?? title ?? ''}
        height="240"
        nextImageClassName="rounded-full bg-neutral-100 group-hover:shadow-xl group-active:shadow-none"
        placeholder="/images/placeholder-300.webp"
        src={image?.desktop || ''}
        width="240"
      />
      <div className="flex justify-center">
        <a className="text-normal-900 mt-4 font-semibold no-underline typography-text-base group-hover:font-normal group-hover:text-primary-800 group-hover:underline group-active:font-normal group-active:text-primary-800">
          {title}
        </a>
      </div>
    </div>
  );
}
