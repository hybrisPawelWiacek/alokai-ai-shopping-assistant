'use client';

import type { FormProps } from '@/components/ui/form';
import Form from '@/components/ui/form';
import { useUserSettings } from '@/hooks';
import type { SfLocale } from '@/types';

export type LocationSelectorsFormProps = FormProps;

export default function UserSettingsForm({ children, ...rest }: LocationSelectorsFormProps) {
  const { setCurrentCurrency, setCurrentLocale } = useUserSettings();

  return (
    <Form
      action={async (formData) => {
        setCurrentCurrency(`${formData.get('currency')}`);
        setCurrentLocale(`${formData.get('language')}` as SfLocale);
      }}
      {...rest}
    >
      {children}
    </Form>
  );
}
