import { baseFixtureFactory } from '@core';
import { CartPage } from '@setup/pageObjects/cart.page';
import { CategoryPage } from '@setup/pageObjects/category.page';
import { HomepagePage } from '@setup/pageObjects/homepage.page';
import { LoginPage } from '@setup/pageObjects/login.page';
import { MyOrdersPage } from '@setup/pageObjects/my-orders.page';
import { NotFoundPage } from '@setup/pageObjects/not-found.page';
import { PersonalDataPage } from '@setup/pageObjects/personal-data.page';
import { ProductDetailsPage } from '@setup/pageObjects/product-details.page';
import { RegisterPage } from '@setup/pageObjects/register.page';
import { SearchPage } from '@setup/pageObjects/search.page';
import { ShippingDetailsPage } from '@setup/pageObjects/shipping-details.page';

export type TestFixtures = {
  cartPage: CartPage;
  categoryPage: CategoryPage;
  homepagePage: HomepagePage;
  loginPage: LoginPage;
  myOrdersPage: MyOrdersPage;
  notFoundPage: NotFoundPage;
  personalDataPage: PersonalDataPage;
  productDetailsPage: ProductDetailsPage;
  registerPage: RegisterPage;
  searchPage: SearchPage;
  shippingDetailsPage: ShippingDetailsPage;
};

const base = baseFixtureFactory();

export const test = base.extend<TestFixtures>({
  cartPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const cartPage = new CartPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await cartPage.prepare());
  },
  categoryPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const categoryPage = new CategoryPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await categoryPage.prepare());
  },
  homepagePage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const homepagePage = new HomepagePage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await homepagePage.prepare());
  },
  loginPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const loginPage = new LoginPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await loginPage.prepare());
  },
  myOrdersPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const myOrdersPage = new MyOrdersPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await myOrdersPage.prepare());
  },
  notFoundPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const notFoundPage = new NotFoundPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await notFoundPage.prepare());
  },
  personalDataPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const myAccountPage = new PersonalDataPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await myAccountPage.prepare());
  },
  productDetailsPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const productPage = new ProductDetailsPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await productPage.prepare());
  },
  registerPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const registerPage = new RegisterPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await registerPage.prepare());
  },
  searchPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const categoryPage = new SearchPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await categoryPage.prepare());
  },
  shippingDetailsPage: async ({ dataFactory, db, framework, frontendUrl, page, utils }, use) => {
    const shippingDetailsPage = new ShippingDetailsPage({ dataFactory, db, framework, frontendUrl, page, utils });
    await use(await shippingDetailsPage.prepare());
  },
});
