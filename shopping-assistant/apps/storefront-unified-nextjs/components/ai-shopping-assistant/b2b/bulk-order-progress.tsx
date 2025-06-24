'use client';

import { SfProgressLinear, SfIconCheck, SfIconClose } from '@storefront-ui/react';
import type { BulkUploadProgress } from '../types';

interface BulkOrderProgressProps {
  progress: BulkUploadProgress;
}

export default function BulkOrderProgress({ progress }: BulkOrderProgressProps) {
  const percentage = progress.totalItems > 0
    ? Math.round((progress.processedItems / progress.totalItems) * 100)
    : 0;

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-positive-500';
      case 'failed':
        return 'bg-negative-500';
      case 'processing':
        return 'bg-primary-500';
      default:
        return 'bg-neutral-500';
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return `Processing item ${progress.processedItems} of ${progress.totalItems}`;
      case 'completed':
        return 'Processing complete';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="mt-4 p-4 bg-white rounded-lg border border-neutral-200">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-sm">Bulk Order Progress</h4>
          <span className="text-sm text-neutral-500">{percentage}%</span>
        </div>
        
        <SfProgressLinear
          value={percentage}
          className={`h-2 ${getStatusColor()}`}
          aria-label="Processing progress"
        />
        
        <p className="text-xs text-neutral-600 mt-1">{getStatusText()}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-lg font-semibold">{progress.totalItems}</div>
          <div className="text-xs text-neutral-500">Total Items</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-positive-700">{progress.successfulItems}</div>
          <div className="text-xs text-neutral-500">Successful</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-negative-700">{progress.failedItems}</div>
          <div className="text-xs text-neutral-500">Failed</div>
        </div>
      </div>

      {/* Error Details */}
      {progress.errors.length > 0 && (
        <div className="border-t border-neutral-200 pt-3">
          <h5 className="text-sm font-medium mb-2 text-negative-700">Errors:</h5>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {progress.errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <SfIconClose size="xs" className="text-negative-500 mt-0.5 flex-shrink-0" />
                <span>
                  Row {error.row}: {error.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {progress.status === 'completed' && progress.failedItems === 0 && (
        <div className="flex items-center gap-2 text-positive-700 mt-3">
          <SfIconCheck size="sm" />
          <span className="text-sm font-medium">
            All items processed successfully!
          </span>
        </div>
      )}
    </div>
  );
}