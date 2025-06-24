'use client';

import { SfButton, SfIconCheck, SfIconClose } from '@storefront-ui/react';
import Link from 'next/link';
import { useFormatter } from '@/hooks/use-formatter';
import type { CartPreviewResultProps } from '../types';

export default function CartPreviewResult({
  cart,
  addedItems = [],
  removedItems = [],
  onCheckout,
}: CartPreviewResultProps) {
  const formatter = useFormatter();

  if (!cart) {
    return null;
  }

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    }
  };

  return (
    <div className="mt-4 bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="p-4 bg-neutral-50 border-b border-neutral-200">
        <h4 className="font-semibold text-sm">Shopping Cart Updated</h4>
      </div>

      <div className="p-4 space-y-3">
        {/* Added Items */}
        {addedItems.length > 0 && (
          <div className="flex items-start gap-2">
            <SfIconCheck className="text-positive-700 mt-0.5" size="sm" />
            <div className="flex-1">
              <p className="text-sm text-positive-700 font-medium">
                Added {addedItems.length} item{addedItems.length > 1 ? 's' : ''} to cart
              </p>
            </div>
          </div>
        )}

        {/* Removed Items */}
        {removedItems.length > 0 && (
          <div className="flex items-start gap-2">
            <SfIconClose className="text-negative-700 mt-0.5" size="sm" />
            <div className="flex-1">
              <p className="text-sm text-negative-700 font-medium">
                Removed {removedItems.length} item{removedItems.length > 1 ? 's' : ''} from cart
              </p>
            </div>
          </div>
        )}

        {/* Cart Items Summary */}
        <div className="border-t border-neutral-200 pt-3 space-y-2">
          {cart.items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className={`flex justify-between items-center text-sm ${
                addedItems.includes(item.productId) ? 'text-positive-700' : ''
              }`}
            >
              <span className="flex-1 line-clamp-1">
                {item.name} <span className="text-neutral-500">×{item.quantity}</span>
              </span>
              <span className="font-medium">
                {formatter.formatPrice(item.price.value * item.quantity, item.price.currency)}
              </span>
            </div>
          ))}

          {cart.items.length > 3 && (
            <p className="text-sm text-neutral-500">
              ...and {cart.items.length - 3} more items
            </p>
          )}
        </div>

        {/* Cart Totals */}
        <div className="border-t border-neutral-200 pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatter.formatPrice(cart.totals.subtotal, cart.totals.currency)}</span>
          </div>
          {cart.totals.shipping > 0 && (
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{formatter.formatPrice(cart.totals.shipping, cart.totals.currency)}</span>
            </div>
          )}
          {cart.totals.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>{formatter.formatPrice(cart.totals.tax, cart.totals.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-neutral-200">
            <span>Total</span>
            <span className="text-primary-700">
              {formatter.formatPrice(cart.totals.total, cart.totals.currency)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3">
          <SfButton
            as={Link}
            href="/cart"
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            View Cart ({cart.items.length})
          </SfButton>
          <SfButton
            as={Link}
            href="/checkout"
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={handleCheckout}
          >
            Checkout
          </SfButton>
        </div>
      </div>
    </div>
  );
}