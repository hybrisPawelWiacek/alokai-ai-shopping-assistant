import type { PropsWithStyle } from '@storefront-ui/react';
import { SfButton, SfInput, SfLink } from '@storefront-ui/react';
import type { AgnosticCmsNewsletterBoxProps } from '@vsf-enterprise/cms-components-utils';

import NewsletterBoxForm from './newsletter-box-form';

export type NewsletterBoxProps = AgnosticCmsNewsletterBoxProps & PropsWithStyle;

export default function NewsletterBox({
  backgroundColor,
  backgroundImage,
  buttonText,
  className,
  header,
  inputPlaceholder,
  subheader,
  ...rest
}: NewsletterBoxProps) {
  return (
    <div {...rest} className={`relative ${className}`} data-testid="newsletter-box">
      {backgroundImage && (
        <picture>
          <source media="(min-width: 768px)" srcSet={backgroundImage.desktop} />
          <img
            alt={backgroundImage.alt}
            className="absolute z-[-1] h-full w-full md:object-cover"
            src={backgroundImage.mobile}
          />
        </picture>
      )}
      <div className="p-4 text-center sm:p-10" style={{ backgroundColor }}>
        <p className="font-semibold typography-headline-4 sm:typography-headline-3">{header}</p>
        <p className="my-2 mb-4 typography-text-sm sm:typography-text-base">{subheader}</p>
        <NewsletterBoxForm className="mx-auto mb-4 flex max-w-[688px] flex-col gap-4 md:flex-row md:items-center">
          <SfInput name="email" placeholder={inputPlaceholder} type="email" wrapperClassName="grow" />
          <SfButton size="lg" type="submit">
            {buttonText}
          </SfButton>
        </NewsletterBoxForm>
        <div className="text-neutral-600 typography-text-xs">
          To learn how we process your data, visit our{' '}
          <SfLink className="!text-neutral-600" href="#">
            Privacy Notice
          </SfLink>
          . You can{' '}
          <SfLink className="!text-neutral-600" href="#">
            unsubscribe
          </SfLink>{' '}
          at any time without costs.
        </div>
      </div>
    </div>
  );
}
