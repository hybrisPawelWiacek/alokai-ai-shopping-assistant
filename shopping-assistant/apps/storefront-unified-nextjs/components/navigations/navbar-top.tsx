import { type PropsWithStyle, SfButton, type SfButtonProps, SfIconAlokaiFull } from '@storefront-ui/react';
import classNames from 'classnames';
import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages, useTranslations } from 'next-intl';
import type { ElementType, PropsWithChildren } from 'react';

import { Link, type LinkHref } from '@/config/navigation';

import Notifications from '../notifications/notifications';

export interface NavbarTopProps extends PropsWithChildren, PropsWithStyle {
  /**
   * If true, the navbar will be filled with the primary color.
   */
  filled?: boolean;
}

export type NavbarTopButtonProps = {
  /**
   * The element type to render the component as.
   */
  as?: ElementType;
  /**
   * The link to navigate to.
   */
  href?: LinkHref;
} & SfButtonProps;

export function NavbarTopButton({ children, className, ...rest }: NavbarTopButtonProps) {
  return (
    <SfButton
      className={classNames(
        'bg-transparent px-4 text-white hover:bg-primary-800 hover:text-white active:bg-primary-900 active:text-white',
        className,
      )}
      variant="tertiary"
      {...rest}
    >
      {children}
    </SfButton>
  );
}

export default function NavbarTop({ children, className, filled }: NavbarTopProps) {
  const t = useTranslations('NavbarTop');
  const messages = useMessages();

  return (
    <header
      className={classNames(
        'sticky top-0 z-40 flex h-14 md:-top-5 md:h-20 md:pt-2.5',
        filled ? 'bg-primary-700 text-white md:shadow-md' : 'border-b border-neutral-200 bg-white text-neutral-900',
        className,
      )}
      data-testid="navbar-top"
    >
      <div className="sticky top-0 mx-auto flex w-full max-w-screen-3-extra-large items-center gap-[clamp(1rem,3vw,3rem)] px-4 py-6 md:h-[60px] md:px-6 lg:px-10">
        <Link className="-mt-1.5 h-6 md:h-7" data-testid="logo-link" href="/" title={t('homepage')}>
          <SfIconAlokaiFull className="h-full w-auto" data-testid="logo" />
        </Link>
        {children}
        <NextIntlClientProvider messages={pick(messages, 'Notifications')}>
          <Notifications />
        </NextIntlClientProvider>
      </div>
    </header>
  );
}
