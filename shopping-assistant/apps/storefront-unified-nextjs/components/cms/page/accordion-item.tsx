'use client';
import { SfAccordionItem, type SfAccordionItemProps, SfIconExpandLess } from '@storefront-ui/react';
import classNames from 'classnames';
import type { ReactNode } from 'react';

import { useAccordion } from './accordion-provider';

export interface AccordionItemProps extends SfAccordionItemProps {
  /**
   * Alias for `children` props
   */
  details?: ReactNode;
  /**
   * Accordion item id
   */
  id: string;
}

export default function AccordionItem({
  children,
  details,
  summary,
  summaryClassName,
  ...attributes
}: AccordionItemProps) {
  const { isOpen, toggle } = useAccordion();

  return (
    <SfAccordionItem
      onToggle={(e) => toggle(attributes.id, e)}
      open={isOpen(attributes.id)}
      summary={
        <>
          {summary}
          <SfIconExpandLess
            className={classNames('text-neutral-500 transition-transform', {
              'rotate-180': isOpen(attributes.id),
            })}
          />
        </>
      }
      summaryClassName={classNames(
        'md:rounded-md w-full py-2 pl-4 pr-3 flex justify-between items-center',
        summaryClassName,
      )}
      {...attributes}
    >
      {children ?? details}
    </SfAccordionItem>
  );
}
