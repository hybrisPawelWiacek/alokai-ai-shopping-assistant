import { type MockFactoryContext, pipe } from '@core';
import { createRouter, type Router, useBase } from 'h3';

import { createOrder, getPaymentTypes, replaceOrgCartPaymentType } from './endpoints';

export function routerFactory(mainRouter: Router) {
  const serverFactory = [
    (ctx: MockFactoryContext) => createOrder(ctx),
    (ctx: MockFactoryContext) => getPaymentTypes(ctx),
    (ctx: MockFactoryContext) => replaceOrgCartPaymentType(ctx),
  ];

  const router = pipe(serverFactory, createRouter());
  mainRouter.use('/commerce/b2b-checkout/**', useBase('/commerce/b2b-checkout', router.handler));

  return mainRouter;
}
