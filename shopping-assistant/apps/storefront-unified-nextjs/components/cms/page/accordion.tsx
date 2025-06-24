import type { PropsWithStyle } from '@storefront-ui/react';
import type { AgnosticCmsAccordionProps } from '@vsf-enterprise/cms-components-utils';
import classNames from 'classnames';
import { isValidElement, type PropsWithChildren, type ReactNode } from 'react';

import AccordionItem from './accordion-item';
import AccordionProvider from './accordion-provider';

interface AccordionItem {
  details: ReactNode;
  summary: string;
}

export type AccordionProps = {
  /**
   * Accordion items
   */
  items: AccordionItem[] | ReactNode[];
} & AgnosticCmsAccordionProps &
  PropsWithChildren &
  PropsWithStyle;

export default function Accordion({ allowMultipleOpen = false, children, className, items, ...rest }: AccordionProps) {
  return (
    <AccordionProvider allowMultipleOpen={allowMultipleOpen}>
      <div
        {...rest}
        className={classNames('divide-y rounded-md border border-neutral-200 text-neutral-900', className)}
      >
        {children ??
          items?.map((item, index) =>
            isValidElement(item) ? (
              item
            ) : (
              <AccordionItem id={item.summary ?? `accordion-item-${index}`} key={index} {...item} />
            ),
          )}
      </div>
    </AccordionProvider>
  );
}
