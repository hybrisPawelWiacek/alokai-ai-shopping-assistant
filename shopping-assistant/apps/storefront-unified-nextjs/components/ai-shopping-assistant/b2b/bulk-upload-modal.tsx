'use client';

import { useState, useRef } from 'react';
import { SfButton, SfIconUpload, SfModal, SfIconClose } from '@storefront-ui/react';
import { useNotification } from '@/hooks/use-notification';
import Modal from '@/components/ui/modal';
import type { BulkOrderItem } from '../types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (items: BulkOrderItem[]) => void;
}

export default function BulkUploadModal({ isOpen, onClose, onUpload }: BulkUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<BulkOrderItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addError } = useNotification();

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      addError('Please upload a CSV file');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const items = parseCSV(text);
        setPreviewData(items);
      } catch (error) {
        addError('Failed to parse CSV file');
        console.error('CSV parsing error:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      addError('Failed to read file');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const parseCSV = (text: string): BulkOrderItem[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const skuIndex = headers.findIndex(h => h === 'sku' || h === 'product_sku');
    const quantityIndex = headers.findIndex(h => h === 'quantity' || h === 'qty');
    const notesIndex = headers.findIndex(h => h === 'notes' || h === 'comments');

    if (skuIndex === -1 || quantityIndex === -1) {
      throw new Error('CSV must contain SKU and Quantity columns');
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      
      if (!values[skuIndex] || !values[quantityIndex]) {
        throw new Error(`Invalid data on line ${index + 2}`);
      }

      return {
        sku: values[skuIndex],
        quantity: parseInt(values[quantityIndex], 10),
        notes: notesIndex !== -1 ? values[notesIndex] : undefined,
      };
    }).filter(item => item.quantity > 0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = () => {
    if (previewData.length > 0) {
      onUpload(previewData);
      setPreviewData([]);
      onClose();
    }
  };

  const handleClose = () => {
    setPreviewData([]);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      className="max-w-2xl"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Bulk Order Upload</h2>
          <SfButton
            variant="tertiary"
            square
            onClick={handleClose}
            aria-label="Close modal"
          >
            <SfIconClose />
          </SfButton>
        </div>

        {previewData.length === 0 ? (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <SfIconUpload size="2xl" className="mx-auto mb-4 text-neutral-400" />
              
              <p className="text-lg font-medium mb-2">
                Drop your CSV file here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-700 hover:underline"
                  disabled={isProcessing}
                >
                  browse
                </button>
              </p>
              
              <p className="text-sm text-neutral-500 mb-4">
                File must be in CSV format with SKU and Quantity columns
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
              <h3 className="font-medium mb-2">CSV Format Example:</h3>
              <pre className="text-xs font-mono overflow-x-auto">
{`SKU,Quantity,Notes
ABC123,10,Rush order
DEF456,25,
GHI789,5,Customer request`}
              </pre>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="font-medium mb-2">Preview ({previewData.length} items)</h3>
              <div className="max-h-64 overflow-y-auto border border-neutral-200 rounded">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 border-b">SKU</th>
                      <th className="text-right p-2 border-b">Quantity</th>
                      <th className="text-left p-2 border-b">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.sku}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-neutral-500">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <SfButton
                variant="secondary"
                onClick={() => setPreviewData([])}
                className="flex-1"
              >
                Cancel
              </SfButton>
              <SfButton
                variant="primary"
                onClick={handleSubmit}
                className="flex-1"
              >
                Process {previewData.length} Items
              </SfButton>
            </div>
          </>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
          </div>
        )}
      </div>
    </Modal>
  );
}