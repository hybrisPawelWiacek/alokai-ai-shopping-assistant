import type { ImageLoaderProps } from 'next/image';
import { env, useEnvContext } from 'next-runtime-env';

import { logger } from '@/sdk/logger';

/**
 * This function allows to get the environment variable regardless if called from client side or server side.
 */
function getEnvUniversal(envName: string) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const envs = useEnvContext();
    return envs[envName];
  }

  return env(envName);
}

export default function cloudinaryLoader({ quality, src, width }: ImageLoaderProps): string {
  const NEXT_PUBLIC_IMAGE_LOADER_FETCH_URL = getEnvUniversal('NEXT_PUBLIC_IMAGE_LOADER_FETCH_URL');
  const NEXT_PUBLIC_IMAGE_LOADER_UPLOAD_URL = getEnvUniversal('NEXT_PUBLIC_IMAGE_LOADER_UPLOAD_URL');

  if (!NEXT_PUBLIC_IMAGE_LOADER_FETCH_URL) {
    logger.warning(`NEXT_PUBLIC_IMAGE_LOADER_FETCH_URL is not defined, skipping Cloudinary image optimization.`);
    return src;
  }

  let baseURL = NEXT_PUBLIC_IMAGE_LOADER_FETCH_URL;

  if (!src.startsWith('http') && NEXT_PUBLIC_IMAGE_LOADER_UPLOAD_URL) {
    baseURL = NEXT_PUBLIC_IMAGE_LOADER_UPLOAD_URL;
  }

  const params = ['f_auto', 'c_limit', 'dpr_auto', `w_${width}`, `q_${quality || 'auto'}`];

  return `${baseURL}${params.join(',')}/${src}`;
}
