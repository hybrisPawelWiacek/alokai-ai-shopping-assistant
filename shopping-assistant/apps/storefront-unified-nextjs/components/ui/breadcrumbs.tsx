import type { PropsWithStyle } from '@storefront-ui/react';
import { SfButton, SfIconMoreHoriz, SfLink } from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import type { LinkHref } from '@/config/navigation';
import { Link } from '@/config/navigation';

export interface Breadcrumb {
  /**
   * Unique identifier of the resource
   */
  id: string;
  /**
   * Link to the resource
   */
  link: LinkHref;
  /**
   * Display name of the resource
   */
  name: ReactNode;
}

export interface BreadcrumbsProps extends PropsWithStyle {
  /**
   * List of breadcrumbs
   */
  breadcrumbs: Breadcrumb[];
}

export default function Breadcrumbs({ breadcrumbs, className, ...rest }: BreadcrumbsProps) {
  const t = useTranslations('Breadcrumbs');

  return (
    <nav {...rest} className={classNames('inline-flex text-sm font-normal', className)} data-testid="breadcrumbs">
      <ol className="group flex w-auto items-center leading-none md:flex-wrap">
        <li className="z-10 flex items-center text-neutral-500 sm:hidden">
          <div className="group relative">
            <SfButton
              aria-label={t('dropdownAriaLabel')}
              className="relative h-5 w-5 rounded-sm !p-0 outline-secondary-600 hover:bg-transparent active:bg-transparent"
              data-testid="breadcrumbsDropdownButton"
              slotPrefix={
                <SfIconMoreHoriz
                  className="text-neutral-500 hover:text-primary-700 active:bg-transparent active:text-primary-800"
                  size="sm"
                />
              }
              square
              type="button"
              variant="tertiary"
            />
            <ol
              className="absolute left-0 top-0 z-10 mt-8 hidden min-w-40 rounded-md border-neutral-100 bg-white px-4 py-2 shadow-md group-focus-within:block sm:w-64"
              data-testid="breadcrumbsDropdown"
            >
              {breadcrumbs.map(({ id, link, name }) => (
                <li className="w-full py-2 last-of-type:hidden" key={id}>
                  <SfLink
                    as={Link}
                    className="inline-block w-full whitespace-nowrap leading-5 text-inherit no-underline outline-secondary-600 hover:underline active:underline"
                    href={link}
                    variant="secondary"
                  >
                    {name}
                  </SfLink>
                </li>
              ))}
            </ol>
          </div>
        </li>
        {breadcrumbs.map(({ id, link, name }, index) => (
          <li
            className="peer hidden text-neutral-500 last:pointer-events-none last-of-type:flex last-of-type:font-medium last-of-type:text-neutral-900 last-of-type:before:font-normal last-of-type:before:text-neutral-500 peer-[:nth-of-type(even)]:before:px-2 peer-[:nth-of-type(even)]:before:leading-5 peer-[:nth-of-type(even)]:before:content-['/'] sm:flex"
            key={id}
          >
            {index < breadcrumbs.length - 1 ? (
              <SfLink
                as={Link}
                className="whitespace-nowrap leading-5 text-inherit no-underline outline-secondary-600 hover:underline active:underline"
                data-testid="breadcrumb-link"
                href={link}
                variant="secondary"
              >
                {name}
              </SfLink>
            ) : (
              <span
                className="whitespace-nowrap leading-5 text-inherit no-underline outline-secondary-600 hover:underline active:underline"
                data-testid="breadcrumb-link"
              >
                {name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
