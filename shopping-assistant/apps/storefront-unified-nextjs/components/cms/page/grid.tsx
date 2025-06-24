import type { PropsWithStyle } from '@storefront-ui/react';
import type { AgnosticCmsGridProps } from '@vsf-enterprise/cms-components-utils';
import classNames from 'classnames';
import { Children, type ReactNode } from 'react';

import styles from './grid.module.scss';

export type GridProps = {
  /**
   * Grid items
   */
  items: ReactNode;
} & AgnosticCmsGridProps &
  PropsWithStyle;

export default function Grid({ className, items = [], ...rest }: GridProps) {
  return (
    <div {...rest} className={classNames('auto-cols-fr overflow-auto', styles.grid, className)} data-testid="grid">
      {Children.map(items, (item, index) => (
        <div key={`${className}-item-${index}`}>{item}</div>
      ))}
    </div>
  );
}
