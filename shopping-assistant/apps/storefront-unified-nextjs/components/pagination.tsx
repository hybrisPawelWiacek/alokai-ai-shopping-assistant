import type { PropsWithStyle } from '@storefront-ui/react';
import { SfButton, SfIconChevronLeft, SfIconChevronRight } from '@storefront-ui/react';
import classNames from 'classnames';
import paginate from 'jw-paginate';
import { useTranslations } from 'next-intl';
import { Fragment } from 'react';

import PaginationLink from './pagination-link';

export interface PaginationProps extends PropsWithStyle {
  /**
   * The current page number.
   */
  currentPage: number;
  /**
   * The number of items per page.
   */
  pageSize: number;
  /**
   * The total number of items.
   */
  totalResults: number;
}

export default function Pagination({ className, currentPage, pageSize, totalResults }: PaginationProps) {
  const t = useTranslations('Pagination');
  const { endPage, pages, startPage, totalPages } = paginate(totalResults, currentPage, pageSize, 5);
  const { pages: mobilePages } = paginate(totalResults, currentPage, pageSize, 1);
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  if (totalResults <= pageSize) {
    return null;
  }

  return (
    <nav
      aria-label="pagination"
      className={classNames('flex items-center justify-between border-t border-neutral-200', className)}
      data-testid="pagination"
      role="navigation"
    >
      <SfButton
        aria-label={t('prevAriaLabel')}
        as={isPrevDisabled ? 'button' : PaginationLink}
        className="mt-2 gap-3"
        data-testid="pagination-prev"
        disabled={isPrevDisabled}
        page={currentPage - 1}
        size="lg"
        slotPrefix={<SfIconChevronLeft />}
        variant="tertiary"
      >
        <span className="hidden sm:inline-flex">{t('prevButtonLabel')}</span>
      </SfButton>
      <ul className="flex flex-wrap justify-center text-center">
        {!pages.find((page: number) => page === 1) && (
          <li>
            <div
              className={classNames('flex border-t-4 border-transparent pt-1', {
                'border-t-4 !border-primary-700 font-medium': currentPage === 1,
              })}
            >
              <PaginationLink data-testid="pagination-first-page" page={1} type="button">
                1
              </PaginationLink>
            </div>
          </li>
        )}
        {startPage > 2 && (
          <li>
            <div className="flex border-t-4 border-transparent pt-1">
              <button
                aria-hidden="true"
                className="rounded-md px-4 py-3 text-neutral-500"
                data-testid="pagination-less-indicator"
                disabled
                type="button"
              >
                ...
              </button>
            </div>
          </li>
        )}
        {pages.map((page: number) => (
          <Fragment key={page}>
            {totalPages === 1 && currentPage === totalPages && (
              <li>
                <div className="flex border-t-4 border-transparent pt-1">
                  <PaginationLink data-testid="before-last-page" page={endPage - 1}>
                    {endPage - 1}
                  </PaginationLink>
                </div>
              </li>
            )}
            <li className={classNames(!mobilePages.includes(page) && 'max-md:hidden')}>
              <div
                className={classNames('flex border-t-4 border-transparent pt-1', {
                  'border-t-4 !border-primary-700 font-medium': currentPage === page,
                })}
              >
                <PaginationLink
                  className={classNames({
                    '!text-neutral-900 hover:!text-primary-800 active:!text-primary-900': currentPage === page,
                  })}
                  page={page}
                  type="button"
                >
                  {page}
                </PaginationLink>
              </div>
            </li>
            {totalPages === 1 && currentPage === 1 && (
              <li>
                <div className="flex border-t-4 border-transparent pt-1">
                  <PaginationLink
                    aria-label={t('secondPageAriaLabel')}
                    data-testid="second-page"
                    page={2}
                    type="button"
                  >
                    2
                  </PaginationLink>
                </div>
              </li>
            )}
          </Fragment>
        ))}
        {endPage < totalPages - 1 && (
          <li>
            <div className="flex border-t-4 border-transparent pt-1">
              <button
                aria-hidden="true"
                className="rounded-md px-4 py-3 text-neutral-500"
                data-testid="pagination-more-indicator"
                disabled
                type="button"
              >
                ...
              </button>
            </div>
          </li>
        )}
        {!pages.find((page: number) => page === totalPages) && (
          <li>
            <div
              className={classNames('flex border-t-4 border-transparent pt-1', {
                'border-t-4 !border-primary-700 font-medium': currentPage === totalPages,
              })}
            >
              <PaginationLink
                aria-label={t('lastPageAriaLabel')}
                data-testid="pagination-last-page"
                page={totalPages}
                type="button"
              >
                {totalPages}
              </PaginationLink>
            </div>
          </li>
        )}
      </ul>
      <SfButton
        aria-label={t('nextAriaLabel')}
        as={isNextDisabled ? 'button' : PaginationLink}
        className="mt-2 gap-3"
        data-testid="pagination-next"
        disabled={isNextDisabled}
        page={currentPage + 1}
        size="lg"
        slotSuffix={<SfIconChevronRight />}
        type="button"
        variant="tertiary"
      >
        <span className="hidden sm:inline-flex">{t('nextButtonLabel')}</span>
      </SfButton>
    </nav>
  );
}
