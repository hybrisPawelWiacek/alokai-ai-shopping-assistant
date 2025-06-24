'use client';
import {
  type PropsWithStyle,
  SfButton,
  SfIconChevronLeft,
  SfIconChevronRight,
  SfScrollable,
  type SfScrollableOnDragEndData,
} from '@storefront-ui/react';
import type { AgnosticCmsGalleryProps } from '@vsf-enterprise/cms-components-utils';
import classNames from 'classnames';
import { useState } from 'react';

import ImageWithPlaceholder from '@/components/image-with-placeholder';

export type GalleryProps = AgnosticCmsGalleryProps & PropsWithStyle;

export default function GalleryHorizontal({ className, images = [], ...rest }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onDragged = (event: SfScrollableOnDragEndData) => {
    if (event.swipeRight && activeIndex > 0) {
      setActiveIndex((currentActiveIndex) => currentActiveIndex - 1);
    } else if (event.swipeLeft && activeIndex < images.length - 1) {
      setActiveIndex((currentActiveIndex) => currentActiveIndex + 1);
    }
  };

  return (
    <div {...rest} className={classNames('relative flex aspect-[4/3] max-h-[600px] w-full flex-col', className)}>
      <SfScrollable
        activeIndex={activeIndex}
        buttonsPlacement="none"
        className="h-full w-full snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        drag={{ containerWidth: true }}
        isActiveIndexCentered
        onDragEnd={onDragged}
        wrapperClassName="h-full min-h-0"
      >
        {images &&
          images.map((image, index) => (
            <ImageWithPlaceholder
              alt={image.alt ?? ''}
              aria-hidden={activeIndex !== index}
              aria-label={image.alt}
              className="flex h-full shrink-0 grow basis-full snap-center justify-center"
              height={250}
              key={`${image.alt}-${index}`}
              nextImageClassName="w-auto h-full"
              placeholder="/images/placeholder-800.webp"
              src={image.desktop}
              width={300}
            />
          ))}
      </SfScrollable>
      <SfScrollable
        activeIndex={activeIndex}
        buttonsPlacement="floating"
        className="w-full items-center [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden"
        slotNextButton={
          <SfButton
            className="absolute right-4 z-10 !rounded-full bg-white disabled:hidden"
            size="sm"
            slotPrefix={<SfIconChevronRight size="sm" />}
            square
            variant="secondary"
          />
        }
        slotPreviousButton={
          <SfButton
            className="absolute left-4 z-10 !rounded-full bg-white disabled:hidden"
            size="sm"
            slotPrefix={<SfIconChevronLeft size="sm" />}
            square
            variant="secondary"
          />
        }
      >
        {images &&
          images.map((image, index) => (
            <button
              aria-current={activeIndex === index}
              aria-label={image.alt}
              className={classNames(
                'relative my-2 -mr-2 shrink-0 flex-grow cursor-pointer snap-start border-b-4 pb-1 transition-colors focus-visible:outline focus-visible:outline-offset md:h-auto md:w-14 md:flex-grow-0',
                activeIndex === index ? 'border-primary-700' : 'border-transparent',
              )}
              key={`${image.alt}-${index}-thumbnail`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <ImageWithPlaceholder
                alt={image.alt ?? ''}
                className="border border-neutral-200 object-contain"
                height="78"
                placeholder="/images/placeholder-300.webp"
                src={image.thumbnail ?? ''}
                width="78"
              />
            </button>
          ))}
      </SfScrollable>
    </div>
  );
}
