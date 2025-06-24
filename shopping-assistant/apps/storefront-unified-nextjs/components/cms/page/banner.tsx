import { type PropsWithStyle, SfButton } from '@storefront-ui/react';
import type { AgnosticCmsBannerProps } from '@vsf-enterprise/cms-components-utils';
import classNames from 'classnames';
import Image from 'next/image';

import { Link } from '@/config/navigation';

export type BannerProps = AgnosticCmsBannerProps & PropsWithStyle;

export default function Banner({
  backgroundColor,
  button,
  className,
  description,
  image,
  subtitle,
  title = '',
  ...rest
}: BannerProps) {
  return (
    <div
      {...rest}
      className={classNames(
        'flex h-full w-full grow flex-col flex-wrap justify-between overflow-hidden md:flex-row',
        className,
      )}
      data-testid="banners"
      style={{ backgroundColor }}
    >
      {image && (
        <Image
          alt={title}
          className="h-fit w-full min-w-0 flex-shrink flex-grow basis-1/2 object-contain"
          height={300}
          src={image?.desktop ?? ''}
          width={300}
        />
      )}
      <div className="m-auto block min-w-[50%] flex-shrink flex-grow basis-auto p-6 text-center md:text-start lg:p-10">
        <p
          className="block font-semibold uppercase tracking-widest typography-text-xs md:typography-headline-6"
          data-testid="section-subtitle"
        >
          {subtitle}
        </p>
        <h2
          className="mb-4 mt-2 font-semibold typography-headline-3 md:typography-headline-2"
          data-testid="section-title"
        >
          {title}
        </h2>
        <p className="mb-4 block typography-text-base md:typography-text-lg" data-testid="section-description">
          {description}
        </p>
        {button?.label && (
          <SfButton as={Link} className="!bg-black" href={button.link ?? ''}>
            {button.label}
          </SfButton>
        )}
      </div>
    </div>
  );
}
