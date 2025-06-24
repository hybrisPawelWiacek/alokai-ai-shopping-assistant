import classNames from 'classnames';
import { Children, isValidElement, type PropsWithChildren } from 'react';

import Divider from './divider';

export interface DescriptionListProps extends React.HTMLAttributes<HTMLDListElement> {}

export default function DescriptionList({ children, className, ...rest }: DescriptionListProps) {
  return (
    <dl className={classNames('mt-6 flex flex-col gap-6', className)} {...rest}>
      {Children.map(Children.toArray(children).filter(isValidElement), (child) => (
        <>
          {child}
          <Divider />
        </>
      ))}
    </dl>
  );
}

export interface DescriptionItemProps extends React.HTMLAttributes<HTMLElement>, PropsWithChildren {}

export function DescriptionItem({ children, className, ...rest }: DescriptionItemProps) {
  return (
    <div className={classNames('flex flex-col gap-2 pe-1 ps-4 md:ps-6 lg:ps-4', className)} {...rest}>
      {children}
    </div>
  );
}

export interface DescriptionItemTermProps extends React.HTMLAttributes<HTMLElement>, PropsWithChildren {}

export function DescriptionItemTerm({ children, className, ...rest }: DescriptionItemTermProps) {
  return (
    <dt
      className={classNames('font-headings text-lg font-semibold', className)}
      data-testid="description-term"
      {...rest}
    >
      {children}
    </dt>
  );
}

export interface DescriptionItemDetailsProps extends React.HTMLAttributes<HTMLElement>, PropsWithChildren {}

export function DescriptionItemDetails({ children, ...rest }: DescriptionItemDetailsProps) {
  return (
    <dd data-testid="description-body" {...rest}>
      {children}
    </dd>
  );
}
