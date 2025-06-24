# 🚀 Next.js Storefront App

Welcome to the **Next.js Storefront App**! This app leverages the power of [Next.js](https://nextjs.org/) and the **Alokai SDK** to communicate with the Middleware app. The application is built upon the **Unified Data Layer**, which you can learn more about [here](https://docs.alokai.com/storefront/unified-data-layer).

## 📝 First Steps

1. 🛠️ **Customize Metadata**: Update the default metadata in the `./app/[locale]/layout.tsx` file.
2. 🖼️ **Change Favicon**: Replace the favicon located at `./public/favicon.ico`.
3. 🎨 **Customize Primary Color**: Modify the primary color in the `./tailwind.config.ts` file. Check out the [customization docs](https://docs.storefrontui.io/v2/customization/theming) for more details.
4. ⚙️ **Review Configuration**: Explore other configurations in the `./config` directory.

## 🌐 Internationalization

We use [`next-intl`](https://next-intl-docs.vercel.app/) for internationalization. The default language is English. To add more languages, edit the `./i18n.ts` file.

## 🎨 Styling

This app utilizes [Tailwind CSS](https://tailwindcss.com/) for styling. Customize your styles in the `./tailwind.config.ts` file.

## 🎆 Progressive Web App

This app uses [Serwist](https://serwist.pages.dev/) library to enable PWA features. Customize your PWA settings in the `./next.config.mjs` file. Update the `./app/manifest.json` file to change the app's manifest settings and `./app/sw.ts` for service worker setup.

## 🔗 Useful Links

- 📚 [Architecture Key Concepts](https://docs.alokai.com/storefront/introduction/key-concepts)
- 🔗 [Unified Data Layer](https://docs.alokai.com/storefront/unified-data-layer)
- 🛍️ [Storefront UI Docs](https://docs.storefrontui.io/v2/)
- 🧑‍💻 [SDK Docs](https://docs.alokai.com/sdk/getting-started/middleware-module)
- 🔧 [Next.js Docs](https://nextjs.org/docs)
- 💅 [Tailwind CSS Docs](https://tailwindcss.com/docs)
- 📝 [TypeScript Docs](https://www.typescriptlang.org/docs/)
