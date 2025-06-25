'use client';

import { useEffect, useState } from 'react';
import { 
  SfButton,
  SfIconCheckCircle,
  SfIconError,
  SfIconWarning,
  SfProgressLinear,
  SfChip,
} from '@storefront-ui/react';
import type { BulkOperationProgress, BulkOperationResult } from '@/hooks/use-bulk-operations';

interface BulkProgressTrackerProps {
  progress: BulkOperationProgress | null;
  result: BulkOperationResult | null;
  error: string | null;
  onCancel?: () => void;
  onComplete?: () => void;
}

export default function BulkProgressTracker({
  progress,
  result,
  error,
  onCancel,
  onComplete,
}: BulkProgressTrackerProps) {
  const [itemStatuses, setItemStatuses] = useState<Map<string, {
    status: 'processing' | 'success' | 'failed';
    error?: string;
  }>>(new Map());

  // Update item statuses when progress changes
  useEffect(() => {
    if (progress?.currentItem) {
      setItemStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(progress.currentItem!.sku, {
          status: progress.currentItem!.status,
          error: progress.currentItem!.error,
        });
        return newMap;
      });
    }
  }, [progress]);

  const getPhaseIcon = () => {
    if (error) return <SfIconError className="text-red-600" size="lg" />;
    if (result) return <SfIconCheckCircle className="text-green-600" size="lg" />;
    if (progress?.phase === 'error') return <SfIconError className="text-red-600" size="lg" />;
    return null;
  };

  const getPhaseColor = () => {
    if (error || progress?.phase === 'error') return 'danger';
    if (result || progress?.phase === 'completed') return 'success';
    return 'primary';
  };

  const getPhaseLabel = () => {
    if (error) return 'Upload Failed';
    if (result) return 'Upload Complete';
    if (progress?.phase === 'parsing') return 'Parsing CSV...';
    if (progress?.phase === 'processing') return 'Processing Items...';
    if (progress?.phase === 'error') return 'Error Occurred';
    return 'Initializing...';
  };

  return (
    <div className="space-y-6">
      {/* Main status */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {getPhaseIcon()}
        </div>
        <h3 className="text-lg font-semibold mb-2">{getPhaseLabel()}</h3>
        {progress?.message && (
          <p className="text-sm text-neutral-600">{progress.message}</p>
        )}
      </div>

      {/* Progress bar */}
      {progress && !result && !error && (
        <div className="space-y-2">
          <SfProgressLinear
            value={progress.percentage}
            size="lg"
            className="h-2"
            ariaLabel="Upload progress"
          />
          <div className="flex justify-between text-sm text-neutral-600">
            <span>{progress.percentage}%</span>
            {progress.totalItems && (
              <span>
                {progress.processedItems || 0} / {progress.totalItems} items
              </span>
            )}
          </div>
        </div>
      )}

      {/* Batch progress */}
      {progress?.totalBatches && progress.totalBatches > 1 && (
        <div className="text-center text-sm text-neutral-600">
          Batch {progress.currentBatch} of {progress.totalBatches}
        </div>
      )}

      {/* Item-level status */}
      {progress?.totalItems && progress.totalItems > 0 && (
        <div className="space-y-2">
          <div className="flex gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Success: {progress.successfulItems || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Failed: {progress.failedItems || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Processing: {
                (progress.totalItems - (progress.processedItems || 0))
              }</span>
            </div>
          </div>
        </div>
      )}

      {/* Results summary */}
      {result && (
        <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Processed:</span>
              <span className="ml-2">{result.totalProcessed}</span>
            </div>
            <div>
              <span className="font-medium">Successfully Added:</span>
              <span className="ml-2 text-green-600">{result.totalAdded}</span>
            </div>
            <div>
              <span className="font-medium">Failed:</span>
              <span className="ml-2 text-red-600">{result.totalFailed}</span>
            </div>
            <div>
              <span className="font-medium">Total Value:</span>
              <span className="ml-2">${(result.totalValue / 100).toFixed(2)}</span>
            </div>
          </div>
          
          {result.hasAlternatives && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-2">
                <SfIconWarning className="inline mr-1 text-amber-600" />
                Some items have suggested alternatives
              </p>
              <SfChip size="sm" className="bg-amber-100 text-amber-800">
                {result.alternatives.length} items with alternatives
              </SfChip>
            </div>
          )}

          {result.processingTime && (
            <div className="text-xs text-neutral-500 text-center pt-2">
              Processing time: {(result.processingTime / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      )}

      {/* Error details */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!result && !error && (
          <SfButton
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel Upload
          </SfButton>
        )}
        
        {(result || error) && (
          <SfButton
            variant="primary"
            onClick={onComplete}
            className="flex-1"
          >
            Close
          </SfButton>
        )}
      </div>

      {/* Failed items details (expandable) */}
      {itemStatuses.size > 0 && Array.from(itemStatuses.entries()).some(([_, status]) => status.status === 'failed') && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-red-600 hover:underline">
            View failed items ({
              Array.from(itemStatuses.values()).filter(s => s.status === 'failed').length
            })
          </summary>
          <div className="mt-2 max-h-40 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 sticky top-0">
                <tr>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(itemStatuses.entries())
                  .filter(([_, status]) => status.status === 'failed')
                  .map(([sku, status]) => (
                    <tr key={sku} className="border-b">
                      <td className="p-2 font-mono">{sku}</td>
                      <td className="p-2 text-red-600">
                        {status.error || 'Unknown error'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}