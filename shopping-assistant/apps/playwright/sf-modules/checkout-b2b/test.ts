import { baseFixtureFactory } from '@core';

import { routerFactory } from './mocks/server';
import { CheckoutB2bPage } from './pageObjects/checkout-b2b.page';

const base = baseFixtureFactory(routerFactory);

type TestFixtures = {
  checkoutB2bPage: CheckoutB2bPage;
};

export const test = base.extend<TestFixtures>({
  checkoutB2bPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const checkoutB2bPage = new CheckoutB2bPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await checkoutB2bPage.prepare());
  },
});
