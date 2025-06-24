'use client';
import type { PropsWithStyle } from '@storefront-ui/react';
import classNames from 'classnames';
import { useParams, useSearchParams } from 'next/navigation';
import { parseAsInteger, useQueryState } from 'nuqs';
import type { ComponentProps } from 'react';

import type { LinkHref } from '@/config/navigation';
import { Link, usePathname } from '@/config/navigation';

export interface PaginationLinkProps extends Omit<ComponentProps<typeof Link>, 'href'>, PropsWithStyle {
  /**
   * The page number to link to
   */
  page: number;
  /**
   * The query parameter name to set on click
   */
  queryParamName?: string;
}

export default function PaginationLink({
  className,
  page,
  queryParamName = 'currentPage',
  ...rest
}: PaginationLinkProps) {
  const pathname = usePathname();
  const params = useParams();
  const query = Object.fromEntries(useSearchParams().entries());
  const [currentPage] = useQueryState(queryParamName, parseAsInteger.withDefault(1));

  return (
    <Link
      aria-current={currentPage === page ? true : undefined}
      className={classNames(
        'h-12 min-w-[34px] rounded-md px-1 py-3 text-center text-neutral-500 hover:bg-primary-100 hover:text-primary-800 active:bg-primary-200 active:text-primary-900 md:min-w-12',
        className,
      )}
      data-testid={`pagination-page-${page}`}
      href={
        {
          params: {
            slugs: [],
            ...params,
          },
          pathname,
          query: {
            ...query,
            [queryParamName]: page,
          },
        } as LinkHref
      }
      type="button"
      {...rest}
    />
  );
}
