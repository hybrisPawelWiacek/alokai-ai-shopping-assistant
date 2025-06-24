'use client';

import {
  type PropsWithStyle,
  SfButton,
  SfIconChevronLeft,
  SfIconChevronRight,
  SfScrollable,
  type SfScrollableOnDragEndData,
} from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { useIntersection, useMedia } from 'react-use';

import type { SfImage } from '@/types';

import ImageWithPlaceholder from './image-with-placeholder';

export interface GalleryProps extends PropsWithStyle {
  /**
   * Array of images to display in the gallery.
   */
  images: SfImage[];
}

export default function Gallery({ className, images, ...attributes }: GalleryProps) {
  const t = useTranslations('Gallery');
  const isTabletScreen = useMedia('(min-width: 768px)', false);
  const thumbnailsReference = useRef<HTMLDivElement>(null);
  const firstThumbnailReference = useRef<HTMLButtonElement>(null);
  const lastThumbnailReference = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const firstVisibleThumbnail = useIntersection(firstThumbnailReference, {
    root: thumbnailsReference.current,
    rootMargin: '0px',
    threshold: 1,
  });

  const lastVisibleThumbnail = useIntersection(lastThumbnailReference, {
    root: thumbnailsReference.current,
    rootMargin: '0px',
    threshold: 1,
  });

  const getThumbReference = (index: number) => {
    if (isTabletScreen) {
      if (index === 0) {
        return firstThumbnailReference;
      }
      if (index === images.length - 1) {
        return lastThumbnailReference;
      }
    }

    return null;
  };

  const onDragged = (event: SfScrollableOnDragEndData) => {
    if (event.swipeRight && activeIndex > 0) {
      setActiveIndex((currentActiveIndex) => currentActiveIndex - 1);
    } else if (event.swipeLeft && activeIndex < images.length - 1) {
      setActiveIndex((currentActiveIndex) => currentActiveIndex + 1);
    }
  };

  return (
    <div
      {...attributes}
      className={classNames('relative flex h-full flex-col scroll-smooth md:flex-row md:gap-4', className)}
      data-testid="gallery"
    >
      <div
        className="relative max-h-[600px] w-full flex-1 overflow-hidden after:block after:pt-[100%]"
        data-testid="gallery-images"
      >
        <SfScrollable
          activeIndex={activeIndex}
          buttonsPlacement="none"
          className="flex h-full w-full snap-x snap-mandatory items-center [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden"
          drag={{ containerWidth: true }}
          isActiveIndexCentered
          onDragEnd={onDragged}
          wrapperClassName="!absolute top-0 left-0 w-full h-full"
        >
          {images.map((image, index) => (
            <ImageWithPlaceholder
              alt={image.alt ?? t('image', { index: index + 1 })}
              aria-hidden={activeIndex !== index}
              className="relative h-full w-full shrink-0 grow basis-full snap-center snap-always"
              draggable={false}
              fill
              key={image.url}
              nextImageClassName="object-contain"
              placeholder="/images/placeholder-800.webp"
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 700px"
              src={image.url}
            />
          ))}
        </SfScrollable>
      </div>
      <div className="flex-shrink-0 basis-auto overflow-hidden md:-order-1" data-testid="gallery-controls">
        <SfScrollable
          activeIndex={activeIndex}
          className="flex w-full snap-y snap-mandatory flex-row items-center gap-0.5 overflow-auto [-ms-overflow-style:'none'] [scrollbar-width:'none'] md:h-full md:scroll-pl-4 md:flex-col md:gap-2 md:px-0 [&::-webkit-scrollbar]:hidden"
          direction="vertical"
          nextDisabled={activeIndex === images.length - 1}
          onDragEnd={onDragged}
          prevDisabled={activeIndex === 0}
          ref={thumbnailsReference}
          slotNextButton={
            <SfButton
              aria-label={t('next')}
              className={classNames(
                'absolute bottom-4 z-10 rotate-90 !rounded-full bg-white !text-neutral-500 !ring-neutral-500 disabled:!hidden',
                { hidden: lastVisibleThumbnail?.isIntersecting },
              )}
              size="sm"
              slotPrefix={<SfIconChevronRight />}
              square
              variant="secondary"
            />
          }
          slotPreviousButton={
            <SfButton
              aria-label={t('prev')}
              className={classNames(
                'absolute top-4 z-10 rotate-90 !rounded-full bg-white !text-neutral-500 !ring-neutral-500 disabled:!hidden',
                { hidden: firstVisibleThumbnail?.isIntersecting },
              )}
              size="sm"
              slotPrefix={<SfIconChevronLeft />}
              square
              variant="secondary"
            />
          }
          wrapperClassName="hidden md:inline-flex"
        >
          {images.map((image, index) => (
            <button
              aria-current={activeIndex === index}
              aria-label={t('thumb', { index: index + 1 })}
              className={classNames(
                'relative h-[88px] w-20 shrink-0 flex-grow-0 cursor-pointer snap-start border-b-4 pb-1 transition-colors',
                [activeIndex === index ? 'border-primary-700' : 'border-transparent'],
              )}
              key={`gallery-thumbnail-${image.url}`}
              onFocus={() => setActiveIndex(index)}
              ref={getThumbReference(index)}
              type="button"
            >
              <ImageWithPlaceholder
                alt={image.alt ?? t('image', { index: index + 1 })}
                height="80"
                nextImageClassName="object-contain aspect-square border border-neutral-200"
                placeholder="/images/placeholder-300.webp"
                src={image.url}
                width="80"
              />
            </button>
          ))}
        </SfScrollable>
        <div className="flex gap-0.5 md:hidden" role="group">
          {images.map((image, index) => (
            <button
              aria-current={activeIndex === index}
              aria-label={t('thumb', { index: index + 1 })}
              className={classNames('relative shrink-0 flex-grow cursor-pointer border-b-4 pb-1 transition-colors', [
                activeIndex === index ? 'border-primary-700' : 'border-neutral-200',
              ])}
              key={`gallery-bullet-${image.url}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
