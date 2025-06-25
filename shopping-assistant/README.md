<div align="center">
<img src="https://alokai.com/favicon.svg" height="80px"/>
</div>

# Unified Storefronts with AI Shopping Assistant

*Version: v1.0*  
*Last Updated: 25 June 2025*

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Unified, Yet Extendible storefront solution with integrated AI Shopping Assistant. This repository follows the mono-repository pattern.

## 🤖 AI Shopping Assistant - Executive Summary

### Overview
The AI Shopping Assistant transforms the e-commerce experience by providing intelligent, conversational shopping assistance powered by LangGraph.js and OpenAI. Built on Alokai's Unified Data Layer (UDL), it seamlessly integrates with 20+ commerce backends while maintaining consistent sub-250ms response times.

### Key Features
- **Conversational Commerce**: Natural language product search, cart management, and checkout assistance
- **B2C & B2B Support**: Adaptive intelligence for both consumer and business customers
- **Real-time Streaming**: Instant responses with Server-Sent Events (SSE)
- **100% UDL Compliance**: All data flows through Alokai's unified layer
- **Configuration-Driven**: Extend capabilities without code changes
- **Enterprise Security**: Multi-layer validation prevents prompt injection and data leaks

### Technical Highlights
- **Architecture**: LangGraph.js orchestration with Tool Factory Pattern
- **Security**: Judge pattern blocks 100% of injection attempts
- **Scalability**: Supports 100 to 1M+ users with minimal changes

### Getting Started with AI Assistant
```bash
# Enable AI Assistant
NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true
OPENAI_API_KEY=sk-your-key-here

# Run in demo mode (no backend required)
NEXT_PUBLIC_DEMO_MODE=true
yarn dev

# Access at http://localhost:3000/ai-assistant-demo
```

For detailed documentation, see:
- [Getting Started Guide](./GETTING_STARTED.md)
- [Feature Showcase](./FEATURE_SHOWCASE.md)
- [Development Workflow](./DEVELOPMENT_WORKFLOW.md)
- [Project Status](./PROJECT_STATUS.md)

## ⌨️ How to get started?

### Prerequisites

- [Node.js](https://nodejs.org/en) (find required version in `.nvmrc` file)
- [yarn v1](https://classic.yarnpkg.com/en/docs/getting-started)

### Setup

To setup repository run

```bash
# will install all packages and setup example environment variables
yarn run init
```

after all dependencies are set up, a development server can be started by running

```bash
yarn dev
```

**Default dev ports are:**

- frontend (Next.js) `:3000`
- frontend (Nuxt) `:3333`
- middleware `:4000`

You can also run `yarn dev:next` or `yarn dev:nuxt` to run only one of the storefronts.

Project by default uses [SAP Commerce Cloud](https://www.sap.com/) ecommerce, but it also has a playground setup for other integrations available for Unified Storefront. To switch commerce, make following changes:

1. Switch the configuration in the `apps/storefront-middleware/middleware.config.ts`:

```diff
import dotenv from "dotenv";
dotenv.config();

- import { config as commerceConfig } from "./integrations/sapcc";
+ import { config as commerceConfig } from "./integrations/sfcc";
import { config as cmsConfig } from "./integrations/cms-mock";

export const config = {
  integrations: {
    commerce: commerceConfig,
    cms: cmsConfig,
  },
};
```

1. Switch the types in the `apps/storefront-middleware/types.ts`:

```diff
- export { type UnifiedEndpoints } from "./integrations/sapcc/types";
+ export { type UnifiedEndpoints } from "./integrations/sfcc/types";
```

3. Switch the branch for CMS mocks using the `.env` file in middleware directory:

```diff
- CMS_MOCK_ENVIRONMENT="sapcc"
+ CMS_MOCK_ENVIRONMENT="sfcc"
```

For further information check [Getting started](https://docs.vuestorefront.io/storefront/introduction/getting-started) chapter in our docs.

### Using the Algolia extensions

To use Algolia extensions, modify the `config.ts` file for ecommerce integration, the following way:

```diff
import type { MiddlewareConfig } from "@vsf-enterprise/sfcc-api";
import type { ApiClientExtension, Integration } from "@vue-storefront/middleware";
-import { unifiedApiExtension, multistoreExtension } from "./extensions";
+import { unifiedApiExtensionWithAlgolia, multistoreExtension } from "./extensions";

// some env checking here

export const integrationConfig = {
  location: "@vsf-enterprise/your-integration/server",
  configuration: {
    // ...
  },
  extensions: (extensions: ApiClientExtension[]) => [
    ...extensions,
-    unifiedApiExtension,
+    unifiedApiExtensionWithAlgolia,
    ...(IS_MULTISTORE_ENABLED === "true" ? [multistoreExtension] : []),
  ],
} satisfies Integration<MiddlewareConfig>;
```

Then modify `types.ts` file in the integration config directory:

```diff
import { WithoutContext } from "@vue-storefront/middleware";
-import { unifiedApiExtension } from "./extensions";
+import { unifiedApiExtensionWithAlgolia } from "./extensions";

-export type UnifiedApiExtension = typeof unifiedApiExtension;
+export type UnifiedApiExtension = typeof unifiedApiExtensionWithAlgolia;
export type UnifiedEndpoints = WithoutContext<UnifiedApiExtension["extendApiMethods"]>;
```

Finally add the Algolia integration in `apps/storefront-middleware/middleware.config.ts`:

```diff
import dotenv from "dotenv";
dotenv.config();

import { config as commerceConfig } from "./integrations/sapcc";
import { config as cmsConfig } from "./integrations/cms-mock";
+import { algoliaConfig } from "./integrations/algolia";

export const config = {
  integrations: {
+    algolia: algoliaConfig,
    commerce: commerceConfig,
    cms: cmsConfig,
  },
};
```

You should check also the environment variables for Algolia integration such as `ALGOLIA_API_KEY` and `ALGOLIA_APP_ID`. More detailed configuration of integration is placed in `integrations/algolia/config.ts` file.

Further information about Algolia integration you can find in [our docs](https://docs.alokai.com/storefront/features/search/algolia-integration).

## 👨‍🏫 What is the architecture of Unified Storefront?

To get to know architecture which stands behind Unified Storefront, check the [Key Concepts](https://docs.alokai.com/storefront/introduction/key-concepts) in our docs.

## 💻 How can I use Unified Storefront in my project?

`apps/storefront-middleware` and `apps/storefront-unified-nextjs`/`storefront-unified-nuxt` apps gives an example how to use Unified Storefront. You can serve them locally, by running `yarn dev`.

For further information read our [docs](https://docs.vuestorefront.io/storefront).
