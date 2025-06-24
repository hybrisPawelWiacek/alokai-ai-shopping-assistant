'use client';
import type { ContentfulSubscribeConfig } from '@contentful/live-preview';
import { debounce } from 'lodash-es';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useSdk } from '@/sdk/alokai-context';

const DEBOUCE_TIME = 300;

export interface LivePreviewProps<TData extends ContentfulSubscribeConfig['data']> {
  /**
   * Raw initial data coming from the Contentful
   * Contentful needs it to initialize the live preview
   */
  initialData: TData;
  /**
   * Contentful locale
   */
  locale: string | undefined;
  /**
   * A function that should rerender the content in the preview
   *
   * @param updatedData raw data coming from the Contentful
   * @returns A promise that resolves to the ReactNode that will replace the initial content in the preview
   */
  rerender: (updatedData: TData) => Promise<ReactNode>;
}

export default function LivePreview<TData extends ContentfulSubscribeConfig['data']>({
  initialData,
  locale,
  rerender,
}: LivePreviewProps<TData>) {
  const [previewContent, setPreviewContent] = useState<ReactNode>(null);
  const sdk = useSdk();
  const callback = debounce(async (updatedData: ContentfulSubscribeConfig['data']) => {
    setPreviewContent(await rerender(updatedData as TData));
  }, DEBOUCE_TIME);

  useEffect(() => {
    sdk.contentful.utils.initLivePreview(initialData, {
      callback,
      locale,
    });
  }, []);

  useEffect(() => {
    const ssrContent = document.getElementById('ssr-content');
    if (previewContent && ssrContent) {
      /**
       * Hide the old SSR content when the preview is ready
       */
      ssrContent.style.display = 'none';
    }
  }, [previewContent]);

  return previewContent;
}
