'use client';

import { SfButton } from '@storefront-ui/react';
import { useRouter } from 'next/navigation';
import { useAddCartLineItem } from '@/hooks/cart/use-add-cart-line-item';
import { useNotification } from '@/hooks/use-notification';
import type { ActionResult } from '../types';

interface ActionButtonsProps {
  actions: ActionResult[];
}

export default function ActionButtons({ actions }: ActionButtonsProps) {
  const router = useRouter();
  const { mutate: addToCart } = useAddCartLineItem();
  const { addSuccess, addError } = useNotification();

  const handleAction = async (action: ActionResult) => {
    try {
      switch (action.type) {
        case 'navigate':
          if (action.data.url) {
            router.push(action.data.url);
          }
          break;

        case 'add_to_cart':
          if (action.data.productId) {
            addToCart({
              productId: action.data.productId,
              quantity: action.data.quantity || 1,
            });
            addSuccess('Product added to cart');
          }
          break;

        case 'search':
          if (action.data.query) {
            router.push(`/search?q=${encodeURIComponent(action.data.query)}`);
          }
          break;

        case 'filter':
          if (action.data.filters) {
            const params = new URLSearchParams();
            Object.entries(action.data.filters).forEach(([key, value]) => {
              if (value) params.append(key, String(value));
            });
            router.push(`/search?${params.toString()}`);
          }
          break;

        case 'checkout':
          router.push('/checkout');
          break;

        case 'view_product':
          if (action.data.productId) {
            router.push(`/product/${action.data.productId}`);
          }
          break;

        default:
          console.log('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      addError('Failed to perform action');
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <SfButton
          key={index}
          size="sm"
          variant={action.type === 'add_to_cart' ? 'primary' : 'secondary'}
          onClick={() => handleAction(action)}
          disabled={!action.success}
        >
          {getActionLabel(action)}
        </SfButton>
      ))}
    </div>
  );
}

function getActionLabel(action: ActionResult): string {
  switch (action.type) {
    case 'add_to_cart':
      return 'Add to Cart';
    case 'navigate':
      return action.data.label || 'Go';
    case 'search':
      return 'Search';
    case 'filter':
      return 'Apply Filters';
    case 'checkout':
      return 'Checkout';
    case 'view_product':
      return 'View Details';
    default:
      return action.data.label || 'Action';
  }
}