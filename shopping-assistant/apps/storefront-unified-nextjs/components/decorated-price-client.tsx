/**
 * The purpose of this component is to improve both performance and user experience in the app
 * by efficiently displaying product prices with a lazy-loading mechanism and a loading placeholder (`Skeleton`).
 * It utilizes the `DecoratedPrice` component for client-side rendering, ensuring no server-side features are used within this component.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import DecoratedPrice from '@/components/decorated-price';
import Skeleton from '@/components/ui/skeleton';
import { useSdk } from '@/sdk/alokai-context';
import type { SfProduct } from '@/types';

export interface ClassNameVariants {
  /**
   * Class name for the regular price.
   */
  regular?: string;
  /**
   * Class name for the special price.
   */
  special?: string;
}

export interface DecoratedPriceProps {
  /**
   * Class name for the wrapper of the component.
   */
  className?: string;
  /**
   * Class names for the price variants.
   */
  classNameVariants?: ClassNameVariants;
  /**
   * Product ID
   */
  id: string;
  /**
   * Product SKU
   */
  sku: string;
}

export default function DecoratedPriceClient({ className, classNameVariants, id, sku, ...rest }: DecoratedPriceProps) {
  const sdk = useSdk();
  const elementRef = useRef(null);
  const [isAboveFold, setIsAboveFold] = useState<boolean>(false);

  useEffect(() => {
    const ref = elementRef.current;
    /**
     * The IntersectionObserver API is employed to monitor the visibility of product tiles on the screen,
     * specifically those that are immediately viewable (above the fold). This approach ensures that product information,
     * including prices and stock levels, is only requested for items that are currently in view,
     * thereby reducing network load. Additionally, it highlights the importance of having a specialized API endpoint
     * dedicated to retrieving these specific pieces of information separately.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsAboveFold(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0,
      },
    );
    if (ref) {
      observer.observe(ref);
    }
    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, []);

  const { data, isFetching } = useQuery<{
    /**
     * Product data
     */
    product: SfProduct;
  }>({
    enabled: isAboveFold,
    queryFn: () =>
      sdk.unified.getProductDetails({
        id,
        sku,
      }),
    queryKey: ['lazyProduct', `${id}-${sku}`],
  });
  const product = data?.product;
  if (isFetching && product) product.price = null;

  return (
    <div ref={elementRef}>
      {!isFetching && product?.price && isAboveFold ? (
        <DecoratedPrice className={className} classNameVariants={classNameVariants} price={product.price} {...rest} />
      ) : (
        <Skeleton className={'mb-1 mt-2'} inline={true} />
      )}
    </div>
  );
}
