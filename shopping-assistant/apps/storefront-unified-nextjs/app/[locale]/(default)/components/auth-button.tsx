'use client';

import { SfDropdown, SfIconPerson, SfListItem, SfLoaderCircular, useDisclosure } from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import type { NestedKeyOf } from 'next-intl';
import { useEffect } from 'react';

import type { NavbarTopButtonProps } from '@/components/navigations/navbar-top';
import { NavbarTopButton } from '@/components/navigations/navbar-top';
import Divider from '@/components/ui/divider';
import type { LinkHref } from '@/config/navigation';
import { Link, usePathname } from '@/config/navigation';
import { useCustomer, useLogoutCustomer } from '@/hooks';
import { useSfCustomerState } from '@/sdk/alokai-context';

const accountDropdown = [
  {
    label: 'myAccount',
    link: '/my-account',
  },
  {
    label: 'myOrders',
    link: '/my-account/my-orders',
  },
] satisfies {
  label: NestedKeyOf<IntlMessages['AuthButton']['dropdown']>;
  link: LinkHref;
}[];

export default function AuthButton() {
  const [customer] = useSfCustomerState();
  const { isFetching } = useCustomer();
  const logout = useLogoutCustomer();
  const pathname = usePathname();
  const { close, isOpen, toggle } = useDisclosure({ initialValue: false });
  const t = useTranslations('AuthButton');
  const isLoading = isFetching || logout.isPending;

  useEffect(() => {
    if (isOpen) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- effect should be triggered only on pathname change
  }, [pathname]);

  return customer && !logout.isPending ? (
    <SfDropdown
      onClose={close}
      open={isOpen}
      trigger={
        <Button disabled={isLoading} onClick={toggle}>
          <span className="hidden whitespace-nowrap lg:inline-block">{customer?.firstName}</span>
        </Button>
      }
    >
      <ul className="min-w-[152px] rounded border border-neutral-100 bg-white py-2 text-neutral-900 shadow-md">
        <nav>
          {accountDropdown.map(({ label, link }) => (
            <Link
              className={classNames('block last-of-type:mb-2', { 'bg-neutral-200': pathname === link })}
              data-testid="account-dropdown-list-item"
              href={link}
              key={label}
            >
              <SfListItem>{t(`dropdown.${label}`)}</SfListItem>
            </Link>
          ))}
        </nav>
        <Divider className="my-2" />
        <SfListItem onClick={() => logout.mutate()}>
          <span className="flex items-start" data-testid="account-dropdown-list-item">
            {t('dropdown.logout')}
          </span>
        </SfListItem>
      </ul>
    </SfDropdown>
  ) : (
    <Button aria-label={t('login')} as={Link} disabled={isLoading} href="/login">
      <span className="relative">
        <span className={classNames(isLoading && 'opacity-0')}>{customer?.firstName ?? t('login')}</span>
        {isLoading && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <SfLoaderCircular />
          </span>
        )}
      </span>
    </Button>
  );
}

interface ButtonProps extends NavbarTopButtonProps {}

function Button({ ...rest }: ButtonProps) {
  return (
    <NavbarTopButton
      className="hidden md:flex"
      data-testid="account-action"
      slotPrefix={<SfIconPerson />}
      square
      {...rest}
    />
  );
}
