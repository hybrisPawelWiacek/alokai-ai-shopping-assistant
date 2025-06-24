'use client';

import { SfButton, SfIconExpandLess } from '@storefront-ui/react';
import classNames from 'classnames';
import { useRef } from 'react';
import { useIntersection } from 'react-use';

export interface ScrollToTopButtonProps {
  /**
   * The aria label for the button.
   */
  ariaLabel: string;
}

export default function ScrollToTopButton({ ariaLabel }: ScrollToTopButtonProps) {
  const intersectionRef = useRef(null);
  const intersection = useIntersection(intersectionRef, {
    rootMargin: '0px',
    threshold: 0,
  });

  return (
    <div className="pointer-events-none absolute top-1/2 z-40" data-testid="scroll-top" ref={intersectionRef}>
      <SfButton
        aria-label={ariaLabel}
        className={classNames(
          'fixed bottom-20 right-4 bg-white transition-opacity',
          intersection?.isIntersecting ? 'opacity-0' : 'pointer-events-auto opacity-100',
        )}
        onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })}
        slotPrefix={<SfIconExpandLess />}
        square
        variant="secondary"
      />
    </div>
  );
}
