import { SfIconBase, SfIconMenu } from '@storefront-ui/react';
import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages, useTranslations } from 'next-intl';

import NavbarTop, { NavbarTopButton } from '@/components/navigations/navbar-top';
import { Link } from '@/config/navigation';

import AuthButton from './auth-button';
import NavCartButton from './nav-cart-button';
import Search from './search';
import SearchModal from './search-modal';
import UserSettingsButton from './user-settings-button';

export default function Navbar() {
  const t = useTranslations('Navbar');
  const messages = useMessages();

  return (
    <NavbarTop filled>
      <NavbarTopButton
        as={Link}
        className="-mx-2 hidden md:flex"
        data-testid="category-index-link"
        href="/category"
        slotPrefix={<SfIconMenu />}
      >
        {t('allProductsLinkText')}
      </NavbarTopButton>
      <Search className="hidden flex-1 md:block" placeholder={t('search')} />
      <nav className="ml-auto flex gap-3">
        <NavbarTopButton
          as={Link}
          className="hidden md:flex"
          data-testid="assistant-link"
          href="/assistant"
          slotPrefix={
            <SfIconBase viewBox="0 0 24 24">
              <svg
                fill="none"
                height="24"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z" />
                <path d="M9 16c1 .667 2 1 3 1s2 -.333 3 -1" />
                <path d="M9 7l-1 -4" />
                <path d="M15 7l1 -4" />
                <path d="M9 12v-1" />
                <path d="M15 12v-1" />
              </svg>
            </SfIconBase>
          }
        ></NavbarTopButton>
        <UserSettingsButton aria-label={t('selectLocation')} />
        <NavCartButton className="hidden md:flex" />
        <NextIntlClientProvider messages={pick(messages, 'AuthButton')}>
          <AuthButton />
        </NextIntlClientProvider>
        <SearchModal heading={t('search')}>
          <Search placeholder={t('search')} />
        </SearchModal>
      </nav>
    </NavbarTop>
  );
}
