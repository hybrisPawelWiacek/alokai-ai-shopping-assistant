import { SfLink } from '@storefront-ui/react';
import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages, useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import Alert from '@/components/ui/alert';
import { Link } from '@/config/navigation';

import RegisterForm from './components/register-form';

export async function generateMetadata() {
  const t = await getTranslations('RegisterPage');

  return {
    title: t('metaTitle'),
  };
}

export default function RegisterPage() {
  const t = useTranslations('RegisterPage');
  const messages = useMessages();

  return (
    <>
      <h1 className="mb-10 font-semibold typography-headline-2 md:px-0 md:typography-headline-1">{t('heading')}</h1>
      <Alert className="mb-6" size="lg" variant="neutral">
        {t.rich('toLoginAlert', {
          login: (chunks) => (
            <SfLink as={Link} data-testid="switch-to-login-link" href="/login" variant="primary">
              {chunks}
            </SfLink>
          ),
        })}
      </Alert>

      <NextIntlClientProvider messages={pick(messages, 'RegisterForm')}>
        <RegisterForm />
      </NextIntlClientProvider>
    </>
  );
}
