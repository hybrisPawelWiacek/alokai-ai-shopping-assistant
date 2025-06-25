'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  SfButton, 
  SfIconUpload, 
  SfIconClose,
  SfIconCheckCircle,
  SfIconWarning,
  SfIconDownload,
  SfInput,
  SfTextarea,
} from '@storefront-ui/react';
import { useBulkOperations } from '@/hooks/use-bulk-operations';
import { useNotification } from '@/hooks/use-notification';
import Modal from '@/components/ui/modal';
import BulkProgressTracker from './bulk-progress-tracker';

interface BulkUploadEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function BulkUploadEnhanced({ 
  isOpen, 
  onClose,
  onComplete
}: BulkUploadEnhancedProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [enableAlternatives, setEnableAlternatives] = useState(true);
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();
  const { 
    uploadBulkOrder, 
    cancelUpload,
    isUploading, 
    progress, 
    result, 
    error,
    downloadTemplate
  } = useBulkOperations();

  const handleFileSelect = useCallback((file: File) => {
    // Validate file
    if (!file.name.endsWith('.csv')) {
      showNotification({
        type: 'error',
        message: 'Please upload a CSV file',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification({
        type: 'error',
        message: 'File size must be less than 5MB',
      });
      return;
    }

    setSelectedFile(file);
  }, [showNotification]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    await uploadBulkOrder(selectedFile, {
      enableAlternatives,
      priority,
      notes,
    });
  }, [selectedFile, uploadBulkOrder, enableAlternatives, priority, notes]);

  const handleClose = useCallback(() => {
    if (isUploading) {
      if (confirm('Are you sure you want to cancel the upload?')) {
        cancelUpload();
      } else {
        return;
      }
    }
    
    setSelectedFile(null);
    setNotes('');
    onClose();
  }, [isUploading, cancelUpload, onClose]);

  const handleDownloadTemplate = useCallback(() => {
    const sampleItems = [
      { sku: 'PROD-001', quantity: 10, notes: 'Rush delivery' },
      { sku: 'PROD-002', quantity: 25, notes: '' },
      { sku: 'PROD-003', quantity: 5, notes: 'Gift wrap required' },
    ];
    downloadTemplate('bulk_order_template', sampleItems);
  }, [downloadTemplate]);

  const handleComplete = useCallback(() => {
    setSelectedFile(null);
    setNotes('');
    onComplete?.();
    onClose();
  }, [onComplete, onClose]);

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      className="max-w-4xl"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Bulk Order Upload</h2>
          <SfButton
            variant="tertiary"
            square
            onClick={handleClose}
            aria-label="Close modal"
            disabled={isUploading}
          >
            <SfIconClose />
          </SfButton>
        </div>

        {/* Show progress tracker if uploading */}
        {(isUploading || progress || result) ? (
          <BulkProgressTracker
            progress={progress}
            result={result}
            error={error}
            onCancel={cancelUpload}
            onComplete={handleComplete}
          />
        ) : (
          <>
            {/* File upload area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging 
                  ? 'border-primary-500 bg-primary-50' 
                  : selectedFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-neutral-300 hover:border-neutral-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {selectedFile ? (
                <>
                  <SfIconCheckCircle size="2xl" className="mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-medium mb-2">{selectedFile.name}</p>
                  <p className="text-sm text-neutral-600 mb-4">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                  <SfButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove File
                  </SfButton>
                </>
              ) : (
                <>
                  <SfIconUpload size="2xl" className="mx-auto mb-4 text-neutral-400" />
                  <p className="text-lg font-medium mb-2">
                    Drop your CSV file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-700 hover:underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-neutral-500 mb-4">
                    Maximum file size: 5MB • Format: CSV
                  </p>
                  <SfButton
                    variant="tertiary"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-2"
                  >
                    <SfIconDownload />
                    Download Template
                  </SfButton>
                </>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {/* Upload options */}
            {selectedFile && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Order Notes (Optional)
                  </label>
                  <SfTextarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any special instructions for this bulk order..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enableAlternatives}
                      onChange={(e) => setEnableAlternatives(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm">
                      Suggest alternatives for out-of-stock items
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Priority:</span>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'normal' | 'high')}
                      className="text-sm border border-neutral-300 rounded px-2 py-1"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <SfButton
                    variant="secondary"
                    onClick={() => setSelectedFile(null)}
                    className="flex-1"
                  >
                    Cancel
                  </SfButton>
                  <SfButton
                    variant="primary"
                    onClick={handleUpload}
                    className="flex-1"
                  >
                    Upload & Process
                  </SfButton>
                </div>
              </div>
            )}

            {/* Format guide */}
            {!selectedFile && (
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <SfIconWarning className="text-amber-600" />
                  CSV Format Requirements
                </h3>
                <ul className="text-sm text-neutral-600 space-y-1 ml-6">
                  <li>• Required columns: SKU, Quantity</li>
                  <li>• Optional column: Notes</li>
                  <li>• First row must contain column headers</li>
                  <li>• Maximum 1000 items per upload</li>
                  <li>• Use comma (,) as delimiter</li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}