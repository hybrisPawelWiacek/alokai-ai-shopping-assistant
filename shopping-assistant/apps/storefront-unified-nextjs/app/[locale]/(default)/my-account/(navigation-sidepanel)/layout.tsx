import { SfIconChevronRight } from '@storefront-ui/react';
import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages, useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';

import Divider from '@/components/ui/divider';
import myAccountNav from '@/config/my-account-nav';

import LayoutHeading from './components/layout-heading';
import NavigationSidepanelContainer, {
  NavigationSidepanelGroup,
  NavigationSidepanelLink,
  NavigationSidepanelLogoutItem,
} from './components/navigation-sidepanel';

export default function MyAccountLayout({ children }: PropsWithChildren) {
  const t = useTranslations('MyAccountLayout');
  const messages = useMessages();

  return (
    <>
      <NextIntlClientProvider messages={pick(messages, 'Breadcrumbs', 'MyAccountLayout')}>
        <LayoutHeading />
      </NextIntlClientProvider>
      <div className="mb-20 flex flex-col gap-10 md:-mx-6 lg:mx-0 lg:flex-row" data-testid="account-layout">
        <NavigationSidepanelContainer data-testid="account-page-sidebar">
          <nav className="top-16 rounded-md bg-white lg:sticky lg:w-[304px] lg:self-start lg:border lg:border-neutral-200 lg:p-4">
            <ul className="flex flex-col gap-4 py-4 lg:py-0">
              {myAccountNav.map(({ icon: Icon, items, key }) => (
                <li key={key}>
                  <NavigationSidepanelGroup slotPrefix={<Icon />}>{t(key)}</NavigationSidepanelGroup>
                  <ul>
                    {items.map(({ path, testId }) => (
                      <li key={path}>
                        <NavigationSidepanelLink
                          data-testid={testId}
                          href={`/my-account/${path}`}
                          slotSuffix={<SfIconChevronRight className="lg:hidden" />}
                        >
                          {t(`links.${path}`)}
                        </NavigationSidepanelLink>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
              <Divider />
              <li>
                <NavigationSidepanelLogoutItem>{t('links.logout')}</NavigationSidepanelLogoutItem>
              </li>
            </ul>
          </nav>
        </NavigationSidepanelContainer>
        <div className="flex-1 overflow-hidden">
          <Divider className="max-lg:hidden" />
          {children}
        </div>
      </div>
    </>
  );
}
