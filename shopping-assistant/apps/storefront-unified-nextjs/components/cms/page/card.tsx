import { type PropsWithStyle, SfButton } from '@storefront-ui/react';
import type { AgnosticCmsCardProps } from '@vsf-enterprise/cms-components-utils';
import classNames from 'classnames';
import Image from 'next/image';

import { Link } from '@/config/navigation';

export type CardProps = AgnosticCmsCardProps & PropsWithStyle;

export default function CardDefault({ button, className, description, image, title = '', ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={classNames(
        'relative flex min-w-[325px] max-w-[375px] flex-col rounded-md border border-neutral-200 hover:shadow-xl lg:w-[496px]',
        className,
      )}
    >
      <Link
        aria-label={title}
        className="z-1 absolute inset-0 focus-visible:rounded-md focus-visible:outline focus-visible:outline-offset"
        href="/"
      />
      {image && (
        <Image
          alt={title}
          className="aspect-video h-auto rounded-t-md object-cover"
          height={200}
          src={image.desktop ?? ''}
          width={350}
        />
      )}
      <div className="flex grow flex-col items-start p-4">
        <p className="font-medium typography-text-base">{title}</p>
        <p className="mb-4 mt-1 font-normal text-neutral-700 typography-text-sm">{description}</p>
        {button && (
          <SfButton as={Link} className="relative mt-auto" href={button.link ?? '#'} size="sm" variant="tertiary">
            {button.label}
          </SfButton>
        )}
      </div>
    </div>
  );
}
