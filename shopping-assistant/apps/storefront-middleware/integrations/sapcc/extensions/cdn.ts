import middlewareHeaders from '@vsf-enterprise/middleware-headers';

const DEFAULT_MIDDLEWARE_TTL = 60 * 5;
const cacheControl =
  process.env.CACHE_CONTROL ||
  `public, max-age=0, s-maxage=${DEFAULT_MIDDLEWARE_TTL}, must-revalidate`;

export const cdnExtension = middlewareHeaders({
  cacheControl,
  isNamespaced: false,
  methods: {},
});
