'use client';
import type { PropsWithStyle } from '@storefront-ui/react';
import classNames from 'classnames';
import type { ImageProps } from 'next/image';
import Image from 'next/image';
import { useState } from 'react';

export interface ImageWithPlaceholderProps
  extends Omit<ImageProps, 'className' | 'placeholder' | 'src'>,
    PropsWithStyle {
  /**
   * Class name for the wrapper of the image.
   */
  nextImageClassName?: string;
  /**
   * Path to the placeholder image.
   */
  placeholder: string;
  /**
   * Path to the image.
   */
  src?: ImageProps['src'];
}

/**
 * Component gives possibility to benefit from Image component provided by Next.js
 * but still be able to use own placeholder image without any blur and passing
 * image as base64.
 */
export default function ImageWithPlaceholder({
  className,
  nextImageClassName,
  placeholder,
  src,
  ...image
}: ImageWithPlaceholderProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [failedToLoad, setFailedToLoad] = useState(false);

  return (
    <div
      className={classNames(
        'relative',
        'bg-center',
        'bg-no-repeat',
        'bg-contain',
        failedToLoad || !src ? 'static' : 'absolute',
        className,
      )}
      data-testid="image-with-placeholder-wrapper"
      style={{
        backgroundImage: !imageLoaded || failedToLoad ? `url(${placeholder})` : 'none',
      }}
    >
      {src && (
        <Image
          {...image}
          alt=""
          className={nextImageClassName}
          onError={() => setFailedToLoad(true)}
          onLoad={() => setImageLoaded(true)}
          src={src}
        />
      )}
    </div>
  );
}
