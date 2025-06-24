'use client';

import { SfButton, SfLoaderCircular } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';

import OrderSummary from '@/components/order-summary';
import { Link } from '@/config/navigation';
import { useCart } from '@/hooks';
import { useSfCartState } from '@/sdk/alokai-context';

import Empty from './components/empty';
import ProductCard from './components/product-card';

export default function CartPageClient() {
  const t = useTranslations('CartPage');
  const [cart] = useSfCartState();
  const { isLoading } = useCart();

  const isEmpty = !cart?.lineItems.length;

  if (isLoading) {
    return (
      <span className="my-40 !flex h-24 justify-center">
        <SfLoaderCircular size="3xl" />
      </span>
    );
  }

  return (
    <div className="mb-20">
      {isEmpty ? (
        <Empty />
      ) : (
        <div className="md:grid md:grid-cols-12 md:gap-x-6">
          <ul className="col-span-7 mb-10 md:mb-0">
            {cart.lineItems.map((lineItem) => (
              <ProductCard key={lineItem.id} product={lineItem} />
            ))}
          </ul>
          <OrderSummary className="col-span-5 h-fit md:sticky md:top-20">
            <SfButton as={Link} className="mb-4 w-full md:mb-0" data-testid="go-to-checkout" href="/checkout" size="lg">
              {t('goToCheckout')}
            </SfButton>
          </OrderSummary>
        </div>
      )}
    </div>
  );
}
