'use client';
import { SfScrollable } from '@storefront-ui/react';
import type { AgnosticCmsScrollableProps } from '@vsf-enterprise/cms-components-utils';
import type { PropsWithChildren, ReactNode } from 'react';

export type ScrollableProps = {
  /**
   * Additional classes for the scrollable wrapper
   */
  className?: string;
  /**
   * Scrollable items.
   */
  items?: ReactNode;
} & AgnosticCmsScrollableProps &
  PropsWithChildren;

export default function Scrollable({
  buttonsPlacement,
  children,
  className,
  direction,
  drag,
  items,
  ...rest
}: ScrollableProps) {
  return (
    <SfScrollable
      {...rest}
      buttonsPlacement={buttonsPlacement}
      className="w-full items-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-testid="slider"
      direction={direction}
      drag={drag}
      wrapperClassName={className}
    >
      {children ?? items}
    </SfScrollable>
  );
}
