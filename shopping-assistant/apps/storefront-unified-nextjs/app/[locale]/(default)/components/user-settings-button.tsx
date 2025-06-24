'use client';
import Image from 'next/image';
import { useQueryState } from 'nuqs';

import { NavbarTopButton, type NavbarTopButtonProps } from '@/components/navigations/navbar-top';
import { createCurrencyFormatter } from '@/helpers/label-formatters';
import { useSfCurrencyState, useSfLocaleState } from '@/sdk/alokai-context';

export interface LocationsSelectorsButtonProps extends NavbarTopButtonProps {}

export default function UserSettingsButton({ ...rest }: LocationsSelectorsButtonProps) {
  const [_, setQueryParams] = useQueryState('user-settings-modal');
  const [currency] = useSfCurrencyState();
  const [locale] = useSfLocaleState();
  const currencyFormatter = createCurrencyFormatter(locale);
  const locationLabel = [locale, currencyFormatter(currency)].filter(Boolean).join(' / ');

  return (
    <NavbarTopButton
      data-testid="user-settings-action"
      onClick={() => setQueryParams('true')}
      slotPrefix={
        <Image
          alt={locale}
          className="rounded-full border border-neutral-200"
          height="24"
          src={`/images/${locale}-flag.svg`}
          unoptimized
          width="24"
        />
      }
      square
      {...rest}
    >
      <span className="hidden whitespace-nowrap uppercase lg:inline-block">{locationLabel}</span>
    </NavbarTopButton>
  );
}
