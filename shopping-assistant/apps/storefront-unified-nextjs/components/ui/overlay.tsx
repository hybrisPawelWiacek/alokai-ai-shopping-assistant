import type { PropsWithStyle } from '@storefront-ui/react';
import classNames from 'classnames';
import type { PropsWithChildren, SyntheticEvent } from 'react';

export interface OverlayProps extends PropsWithChildren, PropsWithStyle {
  /**
   * On click event handler. It can be used to close the overlay.
   */
  onClick?: (event: SyntheticEvent) => void;
}

export default function Overlay({ children, className, onClick, ...attributes }: OverlayProps) {
  return (
    <div
      className={classNames(
        'fixed inset-0 z-50 flex h-full w-full items-center justify-center overflow-y-auto bg-neutral-500/50 md:py-5',
        className,
      )}
      data-testid="overlay"
      onClick={onClick}
      {...attributes}
    >
      {children}
    </div>
  );
}
