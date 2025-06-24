import type { PropsWithStyle } from '@storefront-ui/react';
import type { AgnosticCmsEditorialProps } from '@vsf-enterprise/cms-components-utils';
import classNames from 'classnames';
import type { PropsWithChildren } from 'react';

import styles from './editorial.module.scss';

export type EditorialProps = AgnosticCmsEditorialProps & PropsWithChildren & PropsWithStyle;

/**
 * Component to render html content coming from CMS
 * Children are skipped, because React does not allow to render children together with dangerouslySetInnerHTML
 */
export default function Editorial({ children: _children, className, content = '', ...rest }: EditorialProps) {
  return (
    <div {...rest} className={classNames(styles.editorial, className)} dangerouslySetInnerHTML={{ __html: content }} />
  );
}
