import type { MiddlewareConfig } from "@vsf-enterprise/contentful-api";
import type { Integration } from "@vue-storefront/middleware";

const { CNTF_TOKEN, CNTF_SPACE, CNTF_ENVIRONMENT } = process.env;

if (!CNTF_TOKEN) throw new Error("Missing env var: CNTF_TOKEN");
if (!CNTF_SPACE) throw new Error("Missing env var: CNTF_SPACE");
if (!CNTF_ENVIRONMENT) throw new Error("Missing env var: CNTF_ENVIRONMENT");

export const config = {
  location: "@vsf-enterprise/contentful-api/server",
  configuration: {
    token: CNTF_TOKEN,
    space: CNTF_SPACE,
    environment: CNTF_ENVIRONMENT,
    unified: {
      resolvePages: () => ({
        "/product/*slug": {
          content_type: "productPage",
          url: "/product",
        },
        "/category{/*slug}": {
          content_type: "categoryPage",
          url: "/category",
        },
        "/{*slug}": {
          content_type: "page",
        },
      }),
      resolveFallbackPage: () => ({
        path: "/vsf-fallback-page",
        content_type: "page",
      }),
    },
  },
} satisfies Integration<MiddlewareConfig>;
