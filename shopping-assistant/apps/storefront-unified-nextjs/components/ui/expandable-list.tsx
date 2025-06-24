'use client';
import { SfButton, useDisclosure } from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';
import { Children } from 'react';

export interface ExpandableListProps extends PropsWithChildren {
  /**
   * Class name for the toggle button.
   */
  buttonClassName?: string;
  /**
   * The id used to identify the toggle button in tests.
   */
  id?: string;
  /**
   * Whether the list should be expanded by default.
   * @default false
   */
  initialExpanded?: boolean;
  /**
   * Maximum number of items to show when the list is collapsed.
   * If the number of items is greater than this value, a button to expand the list will be shown.
   * @default 5
   */
  maxCollapsedItems?: number;
}

export default function ExpandableList({
  buttonClassName,
  children,
  id,
  initialExpanded = false,
  maxCollapsedItems = 5,
}: ExpandableListProps) {
  const t = useTranslations('ExpandableList');
  const isButtonVisible = Array.isArray(children) && maxCollapsedItems < children.length;
  const { isOpen: isExpanded, toggle } = useDisclosure({ initialValue: initialExpanded });
  const idPart = id ? `${id}-` : '';

  return (
    <>
      {Children.map(children, (child, index) => {
        if (isExpanded || index < maxCollapsedItems) {
          return child;
        }
        return null;
      })}
      {isButtonVisible && (
        <div className="col-span-full">
          <SfButton
            className={classNames('mt-2 grayscale md:h-8 md:px-3 md:text-sm lg:ml-1', buttonClassName)}
            data-testid={isExpanded ? `show-less-${idPart}button` : `show-more-${idPart}button`}
            onClick={toggle}
            variant="tertiary"
          >
            {isExpanded ? t('collapse') : t('expand')}
          </SfButton>
        </div>
      )}
    </>
  );
}
