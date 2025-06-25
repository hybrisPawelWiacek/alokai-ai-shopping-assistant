import { useEffect } from 'react';

interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
}

interface CartPreviewProps {
  items: CartItem[];
  total: number;
}

export default function CartPreview({ items, total }: CartPreviewProps) {
  // Only log once when component mounts
  useEffect(() => {
    console.log('[CartPreview] Mounted with:', { items, total });
  }, [items, total]);
  return (
    <div className="rounded-lg border p-4">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between">
            <span>{item.name} x {item.quantity}</span>
            <span>${item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t pt-2 font-semibold">
        Total: ${total.toFixed(2)}
      </div>
    </div>
  );
}
