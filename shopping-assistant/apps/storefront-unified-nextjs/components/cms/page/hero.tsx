import { type PropsWithStyle, SfButton } from '@storefront-ui/react';
import type { AgnosticCmsHeroProps } from '@vsf-enterprise/cms-components-utils';
import classNames from 'classnames';
import Image from 'next/image';

import { Link } from '@/config/navigation';

export type HeroProps = AgnosticCmsHeroProps & PropsWithStyle;

export default function Hero({
  backgroundImage,
  buttonA,
  buttonB,
  className,
  description,
  image,
  subtitle,
  title,
  ...rest
}: HeroProps) {
  return (
    <section {...rest} className={classNames('relative min-h-[576px] w-full shrink-0', className)} data-testid="hero">
      {backgroundImage && (
        <picture>
          <source media="(min-width: 768px)" srcSet={backgroundImage.desktop} />
          <img
            alt={backgroundImage.alt}
            className="absolute z-[-1] h-full w-full object-cover"
            src={backgroundImage.mobile}
          />
        </picture>
      )}
      <div className="mx-auto min-h-[576px] max-w-[1536px] md:flex md:flex-row-reverse md:justify-center">
        {image && (
          <div className="flex flex-col md:basis-2/4 md:items-stretch md:overflow-hidden">
            <Image
              alt={image.alt ?? ''}
              className="h-full w-full object-cover object-left"
              height={640}
              priority
              src={image.desktop ?? ''}
              width={640}
            />
          </div>
        )}
        <div className="p-4 md:flex md:basis-2/4 md:flex-col md:items-start md:justify-center md:p-10">
          <p
            className="font-medium uppercase tracking-widest text-neutral-900 typography-text-xs md:typography-text-sm"
            data-testid="section-subtitle"
          >
            {subtitle}
          </p>
          <h1
            className="mb-4 mt-2 font-semibold typography-headline-2 md:leading-[67.5px] md:tracking-[-.022em] md:typography-headline-1"
            data-testid="section-title"
          >
            {title}
          </h1>
          <p className="typography-text-base md:typography-text-lg" data-testid="section-description">
            {description}
          </p>
          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            {buttonA && (
              <SfButton as={Link} data-testid="button-order-now" href={buttonA.link ?? ''} size="lg">
                {buttonA.label}
              </SfButton>
            )}
            {buttonB && (
              <SfButton
                as={Link}
                className="bg-white"
                data-testid="button-show-more"
                href={buttonB.link ?? ''}
                size="lg"
                variant="secondary"
              >
                {buttonB.label}
              </SfButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
