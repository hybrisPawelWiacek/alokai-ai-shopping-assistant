import type { PropsWithCmsPage } from '@sf-modules/cms-contentful/components/connect-cms-page';
import connectCmsPage from '@sf-modules/cms-contentful/components/connect-cms-page';
import RenderCmsContent from '@sf-modules/cms-contentful/components/render-cms-content';
import type { AgnosticCmsComponent } from '@vsf-enterprise/cms-components-utils';
import { notFound } from 'next/navigation';
import type { SearchParams } from 'nuqs/parsers';
import { Suspense } from 'react';

import { logger } from '@/sdk/logger';

/**
 * This interface should match the shape of the CMS page content type
 */
interface CmsPage {
  componentsAboveFold: AgnosticCmsComponent[];
  componentsBelowFold: AgnosticCmsComponent[];
  url: string;
}

type PageProps = {
  params: {
    slug?: string[];
  };
  searchParams: SearchParams;
} & PropsWithCmsPage<CmsPage>;

async function DynamicPage({ page }: PageProps) {
  if (!page) {
    logger.warning(`CMS page not found`);
    return notFound();
  }

  const { componentsAboveFold, componentsBelowFold } = page;

  return (
    <>
      <RenderCmsContent item={componentsAboveFold} />
      <Suspense>
        <RenderCmsContent item={componentsBelowFold} />
      </Suspense>
    </>
  );
}

export default connectCmsPage(DynamicPage, {
  getCmsPagePath: ({ params }) => `/${params.slug?.join('/') ?? ''}`,
});
