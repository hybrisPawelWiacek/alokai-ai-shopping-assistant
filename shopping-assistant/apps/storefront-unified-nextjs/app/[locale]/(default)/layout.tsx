import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';

import Footer from '@/components/navigations/footer';
import { getSdk } from '@/sdk';
import { ShoppingAssistantWidget, ShoppingAssistantProvider } from '@/components/ai-shopping-assistant';

import BottomNav from './components/bottom-nav';
import Navbar from './components/navbar';
import ScrollToTopButton from './components/scroll-to-top-button';
import UserSettingsModal from './components/user-settings-modal';

interface DefaultLayoutProps extends PropsWithChildren {}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <BaseDefaultLayout>
      <div className="mx-auto max-w-screen-3-extra-large md:px-6 lg:px-10">{children}</div>
    </BaseDefaultLayout>
  );
}

export async function BaseDefaultLayout({ children }: DefaultLayoutProps) {
  const sdk = getSdk();
  const currencies = await sdk.unified.getCurrencies();

  return (
    <ShoppingAssistantProvider defaultEnabled={true} defaultMode="b2c">
      <Navbar />
      <main>{children}</main>
      <BottomNav />
      <ScrollToTop />
      <Footer className="mb-[58px] md:mb-0" />
      <UserSettingsModal initialCurrency={currencies} />
      <ShoppingAssistantWidget 
        position="bottom-right"
        triggerText="AI Assistant"
      />
    </ShoppingAssistantProvider>
  );
}

function ScrollToTop() {
  const t = useTranslations('ScrollToTopButton');

  return <ScrollToTopButton ariaLabel={t('scrollTop')} />;
}
