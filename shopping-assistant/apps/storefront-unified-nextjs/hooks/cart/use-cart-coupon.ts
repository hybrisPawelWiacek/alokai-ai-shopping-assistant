import { useSdk } from '@/sdk/alokai-context';
import type { ApplyCouponToCartArgs, RemoveCouponFromCartArgs } from '@/types';

import { cartNotificationKey, useCartMutation } from './utils';

/**
 * @description Hook for applying and removing a coupon from the cart.
 *
 * @returns
 * An object containing the `applyCartCoupon` and `removeCartCoupon` objects
 * that are `UseMutationResult` from react-query.
 *
 * @example
 * const { applyCouponToCart, removeCouponFromCart } = useCartCoupon();
 * applyCouponToCart.mutate({ couponCode });
 * // couponId can be read from cart.appliedCoupons
 * removeCouponFromCart.mutate({ couponId });
 */
export function useCartCoupon() {
  const sdk = useSdk();
  const applyCartCoupon = useCartMutation(
    ['main', 'applyCartCoupon'],
    async (args: ApplyCouponToCartArgs) => sdk.unified.applyCouponToCart(args),
    {
      meta: cartNotificationKey('applyCartCoupon'),
      retry: false,
    },
  );
  const removeCartCoupon = useCartMutation(
    ['main', 'removeCartCoupon'],
    async (args: RemoveCouponFromCartArgs) => sdk.unified.removeCouponFromCart(args),
    {
      meta: cartNotificationKey('removeCartCoupon'),
    },
  );

  return { applyCartCoupon, removeCartCoupon };
}
