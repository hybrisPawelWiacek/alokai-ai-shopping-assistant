'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  SfButton,
  SfInput,
  SfIconSearch,
  SfIconDownload,
  SfIconHistory,
  SfIconError,
  SfIconCheckCircle,
  SfIconClock,
  SfChip,
  SfSelect,
} from '@storefront-ui/react';
import { useBulkOperations } from '@/hooks/use-bulk-operations';
import type { BulkOperationHistoryItem } from '@/hooks/use-bulk-operations';

interface BulkOrderHistoryProps {
  className?: string;
  onViewDetails?: (operation: BulkOperationHistoryItem) => void;
}

export default function BulkOrderHistory({ 
  className,
  onViewDetails 
}: BulkOrderHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [showRollbackDialog, setShowRollbackDialog] = useState<string | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');

  const { 
    history, 
    isLoadingHistory, 
    fetchHistory, 
    rollbackOperation 
  } = useBulkOperations();

  // Calculate date filters
  const getDateFilters = useCallback(() => {
    const now = new Date();
    const filters: { dateFrom?: Date; dateTo?: Date } = {};

    switch (dateRange) {
      case 'today':
        filters.dateFrom = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        filters.dateFrom = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        filters.dateFrom = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    return filters;
  }, [dateRange]);

  // Fetch history on mount and when filters change
  useEffect(() => {
    const filters = {
      ...getDateFilters(),
      status: statusFilter !== 'all' ? statusFilter : undefined,
    };
    
    fetchHistory(filters);
  }, [fetchHistory, statusFilter, dateRange, getDateFilters]);

  const handleRollback = useCallback(async (operationId: string) => {
    if (!rollbackReason.trim()) {
      alert('Please provide a reason for rollback');
      return;
    }

    try {
      await rollbackOperation(operationId, rollbackReason);
      setShowRollbackDialog(null);
      setRollbackReason('');
    } catch (error) {
      // Error handled in hook
    }
  }, [rollbackOperation, rollbackReason]);

  const getStatusIcon = (status: BulkOperationHistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return <SfIconCheckCircle className="text-green-600" size="sm" />;
      case 'failed':
        return <SfIconError className="text-red-600" size="sm" />;
      case 'processing':
        return <SfIconClock className="text-blue-600 animate-spin" size="sm" />;
      case 'rolled_back':
        return <SfIconHistory className="text-amber-600" size="sm" />;
      default:
        return <SfIconClock className="text-neutral-400" size="sm" />;
    }
  };

  const getStatusLabel = (status: BulkOperationHistoryItem['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const filteredHistory = history.filter(operation => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        operation.id.toLowerCase().includes(query) ||
        operation.filename?.toLowerCase().includes(query) ||
        operation.notes?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const exportHistory = useCallback(() => {
    const csv = [
      'ID,Date,Status,Items,Successful,Failed,Filename,Notes',
      ...filteredHistory.map(op => [
        op.id,
        op.createdAt,
        op.status,
        op.totalItems,
        op.successfulItems,
        op.failedItems,
        op.filename || '',
        op.notes || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk_order_history_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredHistory]);

  return (
    <div className={className}>
      {/* Header and filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Bulk Order History</h2>
          <SfButton
            variant="tertiary"
            size="sm"
            onClick={exportHistory}
            className="inline-flex items-center gap-2"
          >
            <SfIconDownload size="sm" />
            Export
          </SfButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <SfIconSearch 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" 
              size="sm"
            />
            <SfInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, filename, or notes..."
              className="pl-10"
            />
          </div>

          <SfSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="rolled_back">Rolled Back</option>
          </SfSelect>

          <SfSelect
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="all">All time</option>
          </SfSelect>
        </div>
      </div>

      {/* Results summary */}
      <div className="mb-4 text-sm text-neutral-600">
        Showing {filteredHistory.length} of {history.length} operations
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-neutral-50">
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Items</th>
              <th className="text-left p-3">Success Rate</th>
              <th className="text-left p-3">Details</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingHistory ? (
              <tr>
                <td colSpan={6} className="text-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto"></div>
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-neutral-500">
                  No bulk orders found
                </td>
              </tr>
            ) : (
              filteredHistory.map((operation) => (
                <tr key={operation.id} className="border-b hover:bg-neutral-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(operation.status)}
                      <span className="text-sm font-medium">
                        {getStatusLabel(operation.status)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      <div>{formatDate(operation.createdAt)}</div>
                      {operation.completedAt && operation.status === 'completed' && (
                        <div className="text-xs text-neutral-500">
                          Duration: {
                            Math.round(
                              (new Date(operation.completedAt).getTime() - 
                               new Date(operation.createdAt).getTime()) / 1000
                            )
                          }s
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      <div className="font-medium">{operation.totalItems} items</div>
                      {operation.filename && (
                        <div className="text-xs text-neutral-500">
                          {operation.filename}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">
                          {operation.successfulItems}
                        </span>
                        {operation.failedItems > 0 && (
                          <span className="text-red-600 ml-2">
                            / {operation.failedItems} failed
                          </span>
                        )}
                      </div>
                      {operation.processedItems > 0 && (
                        <div className="text-xs text-neutral-500">
                          ({Math.round((operation.successfulItems / operation.processedItems) * 100)}%)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {operation.notes && (
                      <div className="text-sm text-neutral-600 max-w-xs truncate">
                        {operation.notes}
                      </div>
                    )}
                    {operation.rollbackEligible && (
                      <SfChip size="sm" className="bg-amber-100 text-amber-800 mt-1">
                        Rollback available
                      </SfChip>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <SfButton
                        variant="tertiary"
                        size="sm"
                        onClick={() => onViewDetails?.(operation)}
                      >
                        View
                      </SfButton>
                      {operation.rollbackEligible && (
                        <SfButton
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowRollbackDialog(operation.id)}
                        >
                          Rollback
                        </SfButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rollback dialog */}
      {showRollbackDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Rollback</h3>
            <p className="text-sm text-neutral-600 mb-4">
              This will cancel all orders from this bulk operation. This action cannot be undone.
            </p>
            <textarea
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="Please provide a reason for the rollback..."
              className="w-full p-3 border border-neutral-300 rounded-lg mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <SfButton
                variant="secondary"
                onClick={() => {
                  setShowRollbackDialog(null);
                  setRollbackReason('');
                }}
                className="flex-1"
              >
                Cancel
              </SfButton>
              <SfButton
                variant="primary"
                onClick={() => handleRollback(showRollbackDialog)}
                disabled={!rollbackReason.trim()}
                className="flex-1"
              >
                Confirm Rollback
              </SfButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}