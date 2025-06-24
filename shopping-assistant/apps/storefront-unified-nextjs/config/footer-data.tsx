import {
  SfIconCall,
  SfIconContactSupport,
  SfIconFacebook,
  SfIconHelp,
  SfIconInstagram,
  SfIconPinterest,
  SfIconTwitter,
  SfIconYoutube,
} from '@storefront-ui/react';
import type { ReactNode } from 'react';

import type { LinkHref } from '@/config/navigation';

type Category = {
  key: string;
  subcategories: {
    key: string;
    link: LinkHref;
  }[];
};
type SocialMedia = {
  icon: ReactNode;
  label: string;
  link: LinkHref;
};
type ContactOption = {
  details: string[];
  icon: ReactNode;
  key: string;
  link: LinkHref;
};
type BottomLink = Pick<ContactOption, 'key' | 'link'>;

export const categories: Category[] = [
  {
    key: 'howToBuy',
    subcategories: [
      {
        key: 'paymentMethods',
        link: '/',
      },
      {
        key: 'orderPickup',
        link: '/',
      },
      {
        key: 'purchaseStatus',
        link: '/',
      },
      {
        key: 'trackOrders',
        link: '/',
      },
      {
        key: 'returns',
        link: '/',
      },
    ],
  },
  {
    key: 'help',
    subcategories: [
      {
        key: 'helpCenter',
        link: '/',
      },
      {
        key: 'securityFraud',
        link: '/',
      },
      {
        key: 'feedback',
        link: '/',
      },
      {
        key: 'contact',
        link: '/',
      },
    ],
  },
  {
    key: 'services',
    subcategories: [
      {
        key: 'giftCards',
        link: '/',
      },
      {
        key: 'storeLocator',
        link: '/',
      },
      {
        key: 'clickCollect',
        link: '/',
      },
      {
        key: 'sameDayDelivery',
        link: '/',
      },
      {
        key: 'shippingDelivery',
        link: '/',
      },
      {
        key: 'couponsDiscounts',
        link: '/',
      },
      {
        key: 'newsletter',
        link: '/',
      },
    ],
  },
  {
    key: 'about',
    subcategories: [
      {
        key: 'aboutUs',
        link: '/',
      },
      {
        key: 'jobs',
        link: '/',
      },
      {
        key: 'pressCenter',
        link: '/',
      },
      {
        key: 'affiliateProgram',
        link: '/',
      },
      {
        key: 'suppliers',
        link: '/',
      },
    ],
  },
];
export const socialMedia: SocialMedia[] = [
  {
    icon: <SfIconFacebook />,
    label: 'Facebook',
    link: '/',
  },
  {
    icon: <SfIconTwitter />,
    label: 'Twitter',
    link: '/',
  },
  {
    icon: <SfIconInstagram />,
    label: 'Instagram',
    link: '/',
  },
  {
    icon: <SfIconPinterest />,
    label: 'Pinterest',
    link: '/',
  },
  {
    icon: <SfIconYoutube />,
    label: 'Youtube',
    link: '/',
  },
];
export const contactOptions: ContactOption[] = [
  {
    details: ['description'],
    icon: <SfIconHelp size="lg" />,
    key: 'helpCenter',
    link: '/',
  },
  {
    details: ['openingHours-1', 'openingHours-2'],
    icon: <SfIconContactSupport size="lg" />,
    key: 'liveChat',
    link: '/',
  },
  {
    details: ['openingHours-1', 'openingHours-2'],
    icon: <SfIconCall size="lg" />,
    key: 'phone',
    link: '/',
  },
];
export const bottomLinks: BottomLink[] = [
  {
    key: 'terms',
    link: '/',
  },
  {
    key: 'privacyPolicy',
    link: '/',
  },
];
export const companyName = `© ${new Date().getFullYear()} Alokai`;
