import type { ComponentType } from 'react';

import { getSdk } from '@/sdk/sdk.server';
import { logger } from '@/sdk/logger';

import LivePreview from './live-preview';

/**
 * A generic type that enhances page props with a connected CMS page
 */
export type PropsWithCmsPage<TPage = Record<string, any>> = {
  page: TPage;
  params: {
    locale: string;
  };
};

interface ConnectCmsPageParams<TProps> {
  /**
   * Get the path of the CMS page to fetch based on the page props
   *
   * @param props Page props
   * @returns The path of the CMS page to fetch
   */
  getCmsPagePath: (props: TProps) => Promise<string> | string;
}

/**
 * Server actions have limited access to the closure scope - they can't access the PageComponent,
 * so as a workaround we store store components in a global object.
 */
const componentsByPath: Record<string, ComponentType<any>> = {};

/**
 * A mapping of the Storefront app's locales to the CMS locales
 */
const appLocaleToCmsLocale: Record<string, string> = {
  de: 'de',
  en: 'en',
};

/**
 * Connects a CMS page to a Next.js page component
 */
export default function connectCmsPage<TProps>(
  PageComponent: ComponentType<TProps>,
  { getCmsPagePath }: ConnectCmsPageParams<TProps>,
) {
  async function CmsPage(props: any) {
    const sdk = getSdk();
    const { params } = props;
    const path = await getCmsPagePath(props);
    componentsByPath[path] = PageComponent;
    const cmsLocale = appLocaleToCmsLocale[params.locale];
    const page = await sdk.unifiedCms
      .getPage({ locale: cmsLocale, path })
      .catch((error: unknown) => logger.error(error));

    if (!page) {
      return <PageComponent {...props} page={null} />;
    }

    async function rerender(rawPage: Record<string, any>) {
      'use server';
      const PageComponent = componentsByPath[path];
      const page = await getSdk().unifiedCms.normalizePage({
        page: rawPage,
      });

      return <PageComponent {...props} page={page} />;
    }

    return (
      <>
        <LivePreview initialData={page.$raw} locale={cmsLocale} rerender={rerender} />
        <div id="ssr-content">
          <PageComponent {...props} page={page} />
        </div>
      </>
    );
  }

  return CmsPage;
}
