'use client';

import { useState, useCallback } from 'react';
import {
  SfButton,
  SfInput,
  SfIconWarning,
  SfIconCheckCircle,
  SfIconEdit,
  SfChip,
} from '@storefront-ui/react';
import { useNotification } from '@/hooks/use-notification';

export interface BulkErrorItem {
  sku: string;
  originalQuantity: number;
  error: string;
  errorType: 'invalid_sku' | 'insufficient_stock' | 'price_limit' | 'other';
  suggestion?: {
    correctSku?: string;
    availableQuantity?: number;
    maxAllowedPrice?: number;
  };
}

interface BulkErrorCorrectionProps {
  errors: BulkErrorItem[];
  onCorrect: (corrections: Array<{ sku: string; quantity: number }>) => void;
  onSkip: (skippedSkus: string[]) => void;
  onCancel: () => void;
}

export default function BulkErrorCorrection({
  errors,
  onCorrect,
  onSkip,
  onCancel,
}: BulkErrorCorrectionProps) {
  const [corrections, setCorrections] = useState<Map<string, { sku: string; quantity: number }>>(
    new Map(errors.map(err => [err.sku, { sku: err.sku, quantity: err.originalQuantity }]))
  );
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { showNotification } = useNotification();

  const handleCorrection = useCallback((originalSku: string, newSku: string, newQuantity: number) => {
    setCorrections(prev => {
      const updated = new Map(prev);
      updated.set(originalSku, { sku: newSku, quantity: newQuantity });
      return updated;
    });
    setEditingItem(null);
  }, []);

  const handleToggleSelection = useCallback((sku: string) => {
    setSelectedItems(prev => {
      const updated = new Set(prev);
      if (updated.has(sku)) {
        updated.delete(sku);
      } else {
        updated.add(sku);
      }
      return updated;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === errors.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(errors.map(e => e.sku)));
    }
  }, [selectedItems, errors]);

  const handleSubmitCorrections = useCallback(() => {
    const selectedCorrections = Array.from(corrections.entries())
      .filter(([sku]) => !selectedItems.has(sku))
      .map(([_, correction]) => correction);

    if (selectedCorrections.length === 0) {
      showNotification({
        type: 'warning',
        message: 'No items selected for correction',
      });
      return;
    }

    onCorrect(selectedCorrections);
  }, [corrections, selectedItems, onCorrect, showNotification]);

  const handleSkipSelected = useCallback(() => {
    if (selectedItems.size === 0) {
      showNotification({
        type: 'warning',
        message: 'No items selected to skip',
      });
      return;
    }

    onSkip(Array.from(selectedItems));
  }, [selectedItems, onSkip, showNotification]);

  const getErrorIcon = (errorType: BulkErrorItem['errorType']) => {
    switch (errorType) {
      case 'invalid_sku':
        return '❌';
      case 'insufficient_stock':
        return '📦';
      case 'price_limit':
        return '💰';
      default:
        return '⚠️';
    }
  };

  const getErrorColor = (errorType: BulkErrorItem['errorType']) => {
    switch (errorType) {
      case 'invalid_sku':
        return 'text-red-600';
      case 'insufficient_stock':
        return 'text-amber-600';
      case 'price_limit':
        return 'text-purple-600';
      default:
        return 'text-neutral-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <SfIconWarning className="text-amber-600" />
          Error Correction Required
        </h3>
        <p className="text-sm text-neutral-600">
          {errors.length} items need correction. Fix the errors below or skip problematic items.
        </p>
      </div>

      {/* Bulk actions */}
      <div className="mb-4 flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedItems.size === errors.length}
            onChange={handleSelectAll}
            className="w-4 h-4 text-primary-600 rounded"
          />
          <span className="text-sm">Select all</span>
        </label>
        
        <div className="flex gap-2">
          <SfButton
            variant="secondary"
            size="sm"
            onClick={handleSkipSelected}
            disabled={selectedItems.size === 0}
          >
            Skip Selected ({selectedItems.size})
          </SfButton>
        </div>
      </div>

      {/* Error list */}
      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {errors.map((error) => {
          const correction = corrections.get(error.sku);
          const isEditing = editingItem === error.sku;
          const isSelected = selectedItems.has(error.sku);

          return (
            <div
              key={error.sku}
              className={`border rounded-lg p-4 transition-all ${
                isSelected ? 'border-neutral-300 bg-neutral-50' : 'border-neutral-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleSelection(error.sku)}
                  className="mt-1 w-4 h-4 text-primary-600 rounded"
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getErrorIcon(error.errorType)}</span>
                    <span className={`font-medium ${getErrorColor(error.errorType)}`}>
                      {error.error}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">SKU</label>
                          <SfInput
                            value={correction?.sku || ''}
                            onChange={(e) => setCorrections(prev => {
                              const updated = new Map(prev);
                              const current = updated.get(error.sku) || { sku: '', quantity: 0 };
                              updated.set(error.sku, { ...current, sku: e.target.value });
                              return updated;
                            })}
                            placeholder="Enter correct SKU"
                            size="sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Quantity</label>
                          <SfInput
                            type="number"
                            value={correction?.quantity || 0}
                            onChange={(e) => setCorrections(prev => {
                              const updated = new Map(prev);
                              const current = updated.get(error.sku) || { sku: '', quantity: 0 };
                              updated.set(error.sku, { 
                                ...current, 
                                quantity: parseInt(e.target.value) || 0 
                              });
                              return updated;
                            })}
                            placeholder="Enter quantity"
                            size="sm"
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <SfButton
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            if (correction?.sku && correction.quantity > 0) {
                              handleCorrection(error.sku, correction.sku, correction.quantity);
                            }
                          }}
                        >
                          Save
                        </SfButton>
                        <SfButton
                          variant="tertiary"
                          size="sm"
                          onClick={() => setEditingItem(null)}
                        >
                          Cancel
                        </SfButton>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">SKU:</span> {correction?.sku}
                          {correction?.sku !== error.sku && (
                            <SfChip size="sm" className="ml-2 bg-green-100 text-green-800">
                              Corrected
                            </SfChip>
                          )}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Quantity:</span> {correction?.quantity}
                          {correction?.quantity !== error.originalQuantity && (
                            <span className="text-xs text-neutral-500 ml-1">
                              (was {error.originalQuantity})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <SfButton
                        variant="tertiary"
                        size="sm"
                        onClick={() => setEditingItem(error.sku)}
                        disabled={isSelected}
                      >
                        <SfIconEdit size="sm" />
                      </SfButton>
                    </div>
                  )}

                  {/* Suggestions */}
                  {error.suggestion && !isEditing && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <p className="font-medium text-blue-800 mb-1">Suggestion:</p>
                      {error.suggestion.correctSku && (
                        <p>Try SKU: <code className="bg-white px-1 rounded">{error.suggestion.correctSku}</code></p>
                      )}
                      {error.suggestion.availableQuantity !== undefined && (
                        <p>Available quantity: {error.suggestion.availableQuantity}</p>
                      )}
                      {error.suggestion.maxAllowedPrice !== undefined && (
                        <p>Max allowed price: ${error.suggestion.maxAllowedPrice}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {errors.length - selectedItems.size}
            </div>
            <div className="text-neutral-600">To Process</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-amber-600">
              {selectedItems.size}
            </div>
            <div className="text-neutral-600">To Skip</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {Array.from(corrections.values()).filter(c => 
                c.sku !== errors.find(e => e.sku === c.sku)?.sku ||
                c.quantity !== errors.find(e => e.sku === c.sku)?.originalQuantity
              ).length}
            </div>
            <div className="text-neutral-600">Corrected</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <SfButton
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </SfButton>
        <SfButton
          variant="primary"
          onClick={handleSubmitCorrections}
          disabled={errors.length - selectedItems.size === 0}
          className="flex-1"
        >
          <SfIconCheckCircle size="sm" className="mr-2" />
          Process {errors.length - selectedItems.size} Items
        </SfButton>
      </div>
    </div>
  );
}