'use client';

import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect } from 'react';

import { useHash } from '@/hooks';

import type { AccordionItemProps } from './cms/page/accordion-item';
import AccordionItem from './cms/page/accordion-item';
import { useAccordion } from './cms/page/accordion-provider';

export interface ProductReviewsAccordionProps extends AccordionItemProps, PropsWithChildren {
  /**
   * Fallback content
   */
  fallback?: ReactNode;
}

export default function ProductReviewsAccordion({ children, ...rest }: ProductReviewsAccordionProps) {
  const { hash } = useHash();

  const { isOpen, toggle } = useAccordion();

  useEffect(() => {
    if (hash === 'customer-reviews') {
      toggle('customer-reviews', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  return <AccordionItem {...rest}>{isOpen('customer-reviews') && children}</AccordionItem>;
}
