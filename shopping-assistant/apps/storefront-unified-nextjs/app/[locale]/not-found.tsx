import { SfButton } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';
import { PublicEnvScript } from 'next-runtime-env';

import { Link } from '@/config/navigation';

import { BaseDefaultLayout } from './(default)/layout';

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <BaseDefaultLayout>
      <div className="flex flex-col items-center justify-center gap-4 p-10">
        <PublicEnvScript />
        <h2 className="typography-headline-2">404 | {t('notFound')}</h2>
        <p>{t('header')}</p>
        <SfButton as={Link} href="/">
          {t('return')}
        </SfButton>
      </div>
    </BaseDefaultLayout>
  );
}
