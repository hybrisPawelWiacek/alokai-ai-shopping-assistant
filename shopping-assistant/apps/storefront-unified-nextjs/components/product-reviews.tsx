'use client';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useSdk } from '@/sdk/alokai-context';
import type { SfProductReview } from '@/types';

import Review from './ui/review';

const getReviewDate = (item: SfProductReview, locale = 'en-US') => {
  return new Intl.DateTimeFormat(locale).format(new Date(item.createdAt));
};

export interface ProductReviewsProps {
  /**
   * Product id
   */
  productId: string;
  /**
   *  Render component when there are no reviews
   */
  renderEmpty?: ReactNode;
  /**
   *  Render component when reviews are loading
   */
  renderLoading?: ReactNode;
  /**
   *  Show less text
   */
  showLessText?: string;
  /**
   *  Show more text
   */
  showMoreText?: string;
}

export default function ProductReviews({
  productId,
  renderEmpty,
  renderLoading,
  showLessText,
  showMoreText,
}: ProductReviewsProps) {
  const sdk = useSdk();
  const reviews = useQuery({
    queryFn: () => sdk.unified.getProductReviews({ pageSize: 5, productId }),
    queryKey: ['reviews', { productId }],
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
  });

  if (!reviews.isSuccess) {
    return renderLoading;
  }

  const reviewsList = reviews.data.reviews;

  if (!reviewsList.length) {
    return renderEmpty;
  }

  return (
    <>
      {reviewsList.map((review) => (
        <Review
          author={review.reviewer ?? undefined}
          className="mb-4"
          content={review.text ?? undefined}
          date={getReviewDate(review)}
          key={review.id}
          rating={review.rating ?? undefined}
          showLessText={showLessText}
          showMoreText={showMoreText}
          title={review.title ?? undefined}
        />
      ))}
    </>
  );
}
