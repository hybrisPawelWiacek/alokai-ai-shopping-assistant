import { SfIconPerson, SfIconShoppingCart } from '@storefront-ui/react';
import type { NestedKeyOf } from 'next-intl';

type NavGroup = {
  icon: React.ComponentType;
  items: {
    path: NestedKeyOf<IntlMessages['MyAccountLayout']['links']>;
    testId: string;
  }[];
  key: NestedKeyOf<IntlMessages['MyAccountLayout']>;
};

const myAccountNav = [
  {
    icon: SfIconPerson,
    items: [
      {
        path: 'personal-data',
        testId: 'navigation-item-personaldata',
      },
      {
        path: 'shipping-details',
        testId: 'navigation-item-shippingdetails',
      },
    ],
    key: 'accountSettings',
  },
  {
    icon: SfIconShoppingCart,
    items: [
      {
        path: 'my-orders',
        testId: 'navigation-item-myorders',
      },
      {
        path: 'returns',
        testId: 'navigation-item-returns',
      },
    ],
    key: 'ordersAndReturns',
  },
] satisfies NavGroup[];

export default myAccountNav;
