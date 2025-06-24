import type { AgnosticCmsComponent } from '@vsf-enterprise/cms-components-utils';
import type { ComponentType, PropsWithChildren } from 'react';

import Accordion from '@/components/cms/page/accordion';
import AccordionItem from '@/components/cms/page/accordion-item';
import Banner from '@/components/cms/page/banner';
import Card from '@/components/cms/page/card';
import CategoryCard from '@/components/cms/page/category-card';
import Editorial from '@/components/cms/page/editorial';
import Gallery from '@/components/cms/page/gallery';
import Grid from '@/components/cms/page/grid';
import Hero from '@/components/cms/page/hero';
import NewsletterBox from '@/components/cms/page/newsletter-box';
import ProductList from '@/components/cms/page/product-list';
import Scrollable from '@/components/cms/page/scrollable';
import { logger } from '@/sdk/logger';

export interface RenderCmsContentProps extends PropsWithChildren {
  /**
   * The component to be rendered
   */
  item: AgnosticCmsComponent | AgnosticCmsComponent[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CmsComponent = ComponentType<any>;

/**
 * Map CMS components to React components
 */
const components: Record<string, CmsComponent> = {
  Accordion,
  AccordionItem,
  Banner,
  Card,
  CategoryCard,
  Editorial,
  Gallery,
  Grid,
  Hero,
  NewsletterBox,
  ProductList,
  Scrollable,
};

export default function RenderCmsContent({ children, item }: RenderCmsContentProps) {
  if (Array.isArray(item)) {
    return (
      <>
        {item.map((prop) => (
          <RenderCmsContent item={prop} key={prop.id} />
        ))}
      </>
    );
  }

  if (!item) {
    return null;
  }

  const { component, styles, uniqueClass, ...componentProps } = item;
  const Component = components[component];

  if (!Component) {
    if (component) {
      logger.warning(`Component "${component}" not found`);
    }
    return null;
  }

  const normalizedComponentProps = Object.entries(componentProps).reduce((acc, [key, value]) => {
    /**
     * Props may contain nested components, so we need to render them recursively
     */
    return { ...acc, [key]: normalizeComponentProp(value) };
  }, {});

  return (
    <>
      {styles && <style dangerouslySetInnerHTML={{ __html: styles }} suppressHydrationWarning />}
      <Component {...normalizedComponentProps} className={uniqueClass} key={componentProps.id}>
        {children}
      </Component>
    </>
  );
}

function isRenderCmsContentProp(prop: unknown): prop is RenderCmsContentProps['item'] {
  return (
    (!!prop && typeof prop === 'object' && 'component' in prop) ||
    (Array.isArray(prop) && prop.every(isRenderCmsContentProp))
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeComponentProp(prop: unknown): any {
  if (isRenderCmsContentProp(prop)) {
    const nestedComponentsArray = Array.isArray(prop) ? prop : [prop];
    return nestedComponentsArray.map((nestedComponent) => (
      <RenderCmsContent item={nestedComponent} key={nestedComponent.id} />
    ));
  } else if (Array.isArray(prop)) {
    return prop.map((item) => normalizeComponentProp(item));
  } else if (typeof prop === 'object' && prop) {
    return Object.entries(prop).reduce((acc, [key, value]) => {
      return { ...acc, [key]: normalizeComponentProp(value) };
    }, {});
  }

  return prop;
}
