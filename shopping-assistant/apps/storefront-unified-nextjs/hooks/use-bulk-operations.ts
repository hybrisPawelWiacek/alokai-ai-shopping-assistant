'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNotification } from '@/hooks/use-notification';

export interface BulkOperationProgress {
  phase: 'parsing' | 'processing' | 'completed' | 'error';
  percentage: number;
  message: string;
  totalItems?: number;
  processedItems?: number;
  successfulItems?: number;
  failedItems?: number;
  currentBatch?: number;
  totalBatches?: number;
  currentItem?: {
    sku: string;
    status: 'processing' | 'success' | 'failed';
    error?: string;
  };
}

export interface BulkOperationResult {
  success: boolean;
  totalProcessed: number;
  totalAdded: number;
  totalFailed: number;
  totalValue: number;
  processingTime: number;
  hasAlternatives: boolean;
  alternatives: Array<[string, any[]]>;
  operationId?: string;
}

export interface BulkOperationHistoryItem {
  id: string;
  createdAt: string;
  completedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rolled_back';
  userId: string;
  accountId: string;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  filename?: string;
  notes?: string;
  rollbackEligible?: boolean;
  rollbackDeadline?: string;
}

export function useBulkOperations() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<BulkOperationProgress | null>(null);
  const [result, setResult] = useState<BulkOperationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<BulkOperationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { showNotification } = useNotification();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const uploadBulkOrder = useCallback(async (
    file: File,
    options: {
      enableAlternatives?: boolean;
      priority?: 'normal' | 'high';
      notes?: string;
    } = {}
  ) => {
    // Reset state
    setIsUploading(true);
    setProgress(null);
    setResult(null);
    setError(null);

    // Close any existing event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('enableAlternatives', String(options.enableAlternatives ?? true));
      formData.append('priority', options.priority || 'normal');
      if (options.notes) {
        formData.append('notes', options.notes);
      }

      // Create abort controller
      abortControllerRef.current = new AbortController();

      // Make the upload request
      const response = await fetch('/api/ai-assistant/bulk-upload/secure', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      // Get operation ID from headers
      const operationId = response.headers.get('X-Operation-Id') || undefined;

      // Set up SSE for progress tracking
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete events in buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('event:')) {
              const eventType = line.slice(6).trim();
              const nextLine = lines[lines.indexOf(line) + 1];
              
              if (nextLine?.startsWith('data:')) {
                const data = JSON.parse(nextLine.slice(5));
                
                switch (eventType) {
                  case 'progress':
                    setProgress(data);
                    break;
                    
                  case 'completed':
                    setResult({ ...data, operationId });
                    setIsUploading(false);
                    showNotification({
                      type: 'success',
                      message: `Bulk order completed: ${data.totalAdded} items added successfully`,
                    });
                    break;
                    
                  case 'error':
                    throw new Error(data.error || 'Processing failed');
                }
              }
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setIsUploading(false);
      
      if (!abortControllerRef.current?.signal.aborted) {
        showNotification({
          type: 'error',
          message: errorMessage,
        });
      }
    }
  }, [showNotification]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsUploading(false);
    setProgress(null);
  }, []);

  const fetchHistory = useCallback(async (filters?: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }) => {
    setIsLoadingHistory(true);
    
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await fetch(`/api/ai-assistant/bulk-operations/history?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistory(data.operations || []);
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to load operation history',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [showNotification]);

  const rollbackOperation = useCallback(async (operationId: string, reason: string) => {
    try {
      const response = await fetch(`/api/ai-assistant/bulk-operations/${operationId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rollback failed');
      }

      const result = await response.json();
      
      showNotification({
        type: 'success',
        message: `Successfully rolled back ${result.reversedItems} items`,
      });

      // Refresh history
      await fetchHistory();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Rollback failed';
      showNotification({
        type: 'error',
        message: errorMessage,
      });
      throw err;
    }
  }, [showNotification, fetchHistory]);

  const downloadTemplate = useCallback((name: string, items: any[]) => {
    const csv = 'SKU,Quantity,Notes\n' + 
      items.map(item => `${item.sku},${item.quantity},"${item.notes || ''}"`).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '_')}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    // Upload state
    isUploading,
    progress,
    result,
    error,
    
    // Actions
    uploadBulkOrder,
    cancelUpload,
    
    // History
    history,
    isLoadingHistory,
    fetchHistory,
    rollbackOperation,
    
    // Utils
    downloadTemplate,
  };
}