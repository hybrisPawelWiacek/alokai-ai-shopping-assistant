import { SfLink } from '@storefront-ui/react';
import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages, useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import Alert from '@/components/ui/alert';
import { Link } from '@/config/navigation';

import LoginForm from './components/login-form';

export async function generateMetadata() {
  const t = await getTranslations('LoginPage');

  return {
    title: t('metaTitle'),
  };
}

export default function LoginPage() {
  const t = useTranslations('LoginPage');
  const messages = useMessages();

  return (
    <div className="pb-10 md:pb-6">
      <h1 className="mb-10 font-semibold typography-headline-2 md:px-0 md:typography-headline-1">{t('heading')}</h1>
      <NextIntlClientProvider messages={pick(messages, 'LoginForm')}>
        <LoginForm />
      </NextIntlClientProvider>
      <Alert className="mt-6" size="lg" variant="neutral">
        {t.rich('toRegisterAlert', {
          register: (chunks) => (
            <SfLink as={Link} data-testid="register-link" href="/register" variant="primary">
              {chunks}
            </SfLink>
          ),
        })}
      </Alert>
    </div>
  );
}
