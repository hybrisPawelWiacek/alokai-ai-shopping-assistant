'use client';

import { SfButton, SfChip, SfIconDownload } from '@storefront-ui/react';
import { useFormatter } from '@/hooks/use-formatter';
import type { QuoteSummaryProps } from '../types';

export default function QuoteSummary({ quote, onApprove, onReject }: QuoteSummaryProps) {
  const formatter = useFormatter();

  const handleDownload = () => {
    // Create CSV content
    const csvContent = [
      ['SKU', 'Product Name', 'Quantity', 'Unit Price', 'Total Price', 'Available', 'Notes'],
      ...quote.items.map(item => [
        item.sku,
        item.name || '',
        item.quantity,
        item.price || '',
        item.price ? item.price * item.quantity : '',
        item.available ? 'Yes' : 'No',
        item.alternatives && item.alternatives.length > 0 
          ? `Alternatives available: ${item.alternatives.map(a => a.sku).join(', ')}`
          : ''
      ])
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote-${quote.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-primary-50 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-lg">B2B Quote Summary</h4>
            <p className="text-sm text-neutral-600">Quote #{quote.id}</p>
          </div>
          <SfButton
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <SfIconDownload size="sm" />
            Download CSV
          </SfButton>
        </div>
      </div>

      {/* Customer Info */}
      {quote.customerInfo && (
        <div className="p-4 border-b border-neutral-200 bg-neutral-50">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-neutral-500">Company:</span>
              <p className="font-medium">{quote.customerInfo.company}</p>
            </div>
            <div>
              <span className="text-neutral-500">Contact:</span>
              <p className="font-medium">{quote.customerInfo.contact}</p>
            </div>
            <div>
              <span className="text-neutral-500">Email:</span>
              <p className="font-medium">{quote.customerInfo.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">SKU</th>
                <th className="text-left p-2">Product</th>
                <th className="text-right p-2">Qty</th>
                <th className="text-right p-2">Unit Price</th>
                <th className="text-right p-2">Total</th>
                <th className="text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2 font-mono text-xs">{item.sku}</td>
                  <td className="p-2">
                    {item.name || 'Product name pending'}
                    {item.alternatives && item.alternatives.length > 0 && (
                      <div className="text-xs text-secondary-700 mt-1">
                        {item.alternatives.length} alternative{item.alternatives.length > 1 ? 's' : ''} available
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">
                    {item.price
                      ? formatter.formatPrice(item.price, quote.summary.currency)
                      : '-'}
                  </td>
                  <td className="p-2 text-right font-medium">
                    {item.price
                      ? formatter.formatPrice(item.price * item.quantity, quote.summary.currency)
                      : '-'}
                  </td>
                  <td className="p-2 text-center">
                    {item.available ? (
                      <SfChip size="sm" className="bg-positive-100 text-positive-700">
                        Available
                      </SfChip>
                    ) : (
                      <SfChip size="sm" className="bg-negative-100 text-negative-700">
                        Unavailable
                      </SfChip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-600">Total Items:</span>
                <span className="font-medium">{quote.summary.totalItems}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-600">Available Items:</span>
                <span className="font-medium text-positive-700">{quote.summary.availableItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Unavailable Items:</span>
                <span className="font-medium text-negative-700">{quote.summary.unavailableItems}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-700">
                {formatter.formatPrice(quote.summary.totalPrice, quote.summary.currency)}
              </div>
              <div className="text-sm text-neutral-600">Total Quote Value</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              Valid until: {new Date(quote.validUntil).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          {onReject && (
            <SfButton
              variant="secondary"
              onClick={onReject}
              className="flex-1"
            >
              Reject Quote
            </SfButton>
          )}
          {onApprove && (
            <SfButton
              variant="primary"
              onClick={onApprove}
              className="flex-1"
            >
              Approve & Order
            </SfButton>
          )}
        </div>
      </div>
    </div>
  );
}