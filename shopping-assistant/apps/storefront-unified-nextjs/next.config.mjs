import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants.js';
// eslint-disable-next-line import/no-unresolved
import createNextIntlPlugin from 'next-intl/plugin';
import { env } from 'next-runtime-env';
import crypto from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import cloudinaryConfig from './config/image-loaders/cloudinary/cloudinary.config.mjs';
import defaultImageConfig from './config/image-loaders/default.config.mjs';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Setting custom destDir to enable parallel e2e tests
  distDir: process.env.TEST_BUILD_DIR || undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    outputFileTracingRoot: join(fileURLToPath(import.meta.url), '..', '..'),
    typedRoutes: true,
  },
  images: env('NEXT_PUBLIC_IMAGE_LOADER_FETCH_URL') ? cloudinaryConfig : defaultImageConfig,
  output: 'standalone',
};

/** @type {(phase: string, defaultConfig: import("next").NextConfig) => Promise<import("next").NextConfig>} */
export default async (phase) => {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withSerwist = (await import('@serwist/next')).default({
      additionalPrecacheEntries: [{ revision: crypto.randomUUID(), url: '/offline' }],
      cacheOnNavigation: false,
      disable: phase === PHASE_DEVELOPMENT_SERVER,
      swDest: 'public/sw.js',
      swSrc: 'app/sw.ts',
    });
    return withSerwist(withNextIntl(nextConfig));
  }

  return withNextIntl(nextConfig);
};
