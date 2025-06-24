import type { PropsWithStyle } from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';

import Divider from '@/components/ui/divider';
import { bottomLinks, categories, companyName, contactOptions, socialMedia } from '@/config/footer-data';
import { Link } from '@/config/navigation';
import type { UnsafeUseTranslations } from '@/types';

export type FooterProps = PropsWithStyle;

export default function Footer({ className }: FooterProps) {
  const t = useTranslations('Footer') as UnsafeUseTranslations<'Footer'>;

  return (
    <footer className={classNames('bg-neutral-100 pt-10', className)} data-testid="footer">
      <div
        className="mx-auto grid max-w-screen-3-extra-large grid-cols-[1fr_1fr] justify-center gap-5 px-4 pb-10 md:grid-cols-[repeat(4,1fr)] md:px-6 lg:px-10"
        data-testid="section-top"
      >
        {categories.map(({ key, subcategories }) => (
          <div className="flex min-w-[25%] flex-col extra-small:min-w-[50%]" data-testid="footer-category" key={key}>
            <p className="pb-2 text-lg font-medium leading-7 text-neutral-900" data-testid="footer-headers">
              {t(`categories.${key}.label`)}
            </p>
            {subcategories?.map(({ key: subcategoryKey, link }) => (
              <Link
                className="py-2 text-sm leading-5 text-neutral-600 hover:underline"
                data-testid="footer-item"
                href={link}
                key={subcategoryKey}
              >
                {t(`categories.${key}.subcategories.${subcategoryKey}`)}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <Divider />
      <div className="mx-auto max-w-screen-3-extra-large py-10 lg:flex" data-testid="section-middle">
        {contactOptions.map(({ details, icon, key, link }) => (
          <div className="mx-auto my-4 flex flex-col items-center text-center" data-testid="footer-section" key={key}>
            {icon}
            <Link
              className="my-2 py-1 text-lg font-medium leading-7 text-neutral-900"
              data-testid="footer-headline"
              href={link}
            >
              {t(`contactOptions.${key}.label`)}
            </Link>
            {details?.map((option) => (
              <p className="text-sm leading-5" data-testid="footer-description-line" key={option}>
                {t(`contactOptions.${key}.details.${option}`)}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div className="bg-neutral-900" data-testid="section-bottom">
        <div className="mx-auto max-w-screen-3-extra-large justify-end px-4 py-10 text-sm leading-5 text-white lg:flex lg:px-10 lg:py-6">
          <div className="flex justify-center gap-6 lg:self-start">
            {socialMedia.map(({ icon, label, link }) => (
              <Link
                className="rounded-full hover:bg-neutral-500 hover:shadow-[0_0_0_8px] hover:shadow-neutral-500"
                data-testid={label}
                href={link}
                key={label}
              >
                {icon}
              </Link>
            ))}
          </div>
          <div className="my-6 flex justify-center gap-6 lg:my-0 lg:ml-auto">
            {bottomLinks.map(({ key, link }) => (
              <Link data-testid="bottom-link" href={link} key={key}>
                {t(`bottomLinks.${key}`)}
              </Link>
            ))}
          </div>
          <p className="text-center text-white/50 lg:ml-6">{companyName}</p>
        </div>
      </div>
    </footer>
  );
}
