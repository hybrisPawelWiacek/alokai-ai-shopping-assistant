import { pipe } from '@core';
import { createRouter, defineEventHandler, sendNoContent, useBase } from 'h3';

import { serverFactory as cmsEndpoints } from './cms/server';
import { serverFactory as unifiedEndpoints } from './unified/server';

export const mainRouterFactory = () => {
  const mainRouter = createRouter();
  mainRouter.get(
    '/',
    defineEventHandler((event) => sendNoContent(event, 200)),
  );

  const unifiedRouter = pipe(unifiedEndpoints, createRouter());
  mainRouter.use('/commerce/unified/**', useBase('/commerce/unified', unifiedRouter.handler));

  const cmsRouter = pipe(cmsEndpoints, createRouter());
  mainRouter.use('/cms/unified/**', useBase('/cms/unified', cmsRouter.handler));

  return mainRouter;
};
