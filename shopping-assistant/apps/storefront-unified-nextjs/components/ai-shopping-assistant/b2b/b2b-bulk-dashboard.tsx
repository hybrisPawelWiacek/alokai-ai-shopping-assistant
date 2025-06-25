'use client';

import { useState } from 'react';
import { 
  SfButton, 
  SfIconUpload, 
  SfIconHistory,
  SfIconBookmark,
  SfTabs,
} from '@storefront-ui/react';
import BulkUploadEnhanced from './bulk-upload-enhanced';
import BulkOrderHistory from './bulk-order-history';
import OrderTemplateManager from './order-template-manager';
import AlternativeProductSelector from './alternative-product-selector';
import BulkErrorCorrection from './bulk-error-correction';
import type { OrderTemplate } from './order-template-manager';
import type { BulkErrorItem } from './bulk-error-correction';
import type { BulkOperationHistoryItem } from '@/hooks/use-bulk-operations';

interface B2BBulkDashboardProps {
  className?: string;
}

export default function B2BBulkDashboard({ className }: B2BBulkDashboardProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'templates'>('upload');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<OrderTemplate | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showErrorCorrection, setShowErrorCorrection] = useState(false);
  const [errors, setErrors] = useState<BulkErrorItem[]>([]);

  const handleTemplateLoad = (template: OrderTemplate) => {
    // In a real implementation, this would populate the upload form
    setSelectedTemplate(template);
    setActiveTab('upload');
    setShowUploadModal(true);
  };

  const handleViewOperationDetails = (operation: BulkOperationHistoryItem) => {
    // In a real implementation, this would show detailed view
    console.log('View details for operation:', operation);
  };

  const tabs = [
    {
      id: 'upload',
      label: 'New Upload',
      icon: <SfIconUpload size="sm" />,
    },
    {
      id: 'history',
      label: 'Order History',
      icon: <SfIconHistory size="sm" />,
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: <SfIconBookmark size="sm" />,
    },
  ];

  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold mb-2">Bulk Order Management</h2>
          <p className="text-neutral-600">
            Upload CSV files to create bulk orders, view order history, and manage templates.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-6 py-3 text-sm font-medium 
                  border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Quick actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-neutral-200 rounded-lg p-4 text-center">
                  <SfIconUpload size="xl" className="mx-auto mb-3 text-primary-600" />
                  <h3 className="font-medium mb-2">Upload CSV</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Import your bulk order from a CSV file
                  </p>
                  <SfButton
                    variant="primary"
                    size="sm"
                    onClick={() => setShowUploadModal(true)}
                    className="w-full"
                  >
                    Start Upload
                  </SfButton>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 text-center">
                  <SfIconBookmark size="xl" className="mx-auto mb-3 text-blue-600" />
                  <h3 className="font-medium mb-2">Use Template</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Load a saved order template
                  </p>
                  <SfButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab('templates')}
                    className="w-full"
                  >
                    Browse Templates
                  </SfButton>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 text-center">
                  <SfIconHistory size="xl" className="mx-auto mb-3 text-green-600" />
                  <h3 className="font-medium mb-2">Recent Orders</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    View and manage past bulk orders
                  </p>
                  <SfButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab('history')}
                    className="w-full"
                  >
                    View History
                  </SfButton>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Getting Started</h4>
                <ol className="text-sm space-y-1 ml-4">
                  <li>1. Prepare your CSV file with SKU and Quantity columns</li>
                  <li>2. Click "Start Upload" or drag & drop your file</li>
                  <li>3. Review and confirm your order</li>
                  <li>4. Track progress in real-time</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <BulkOrderHistory
              onViewDetails={handleViewOperationDetails}
            />
          )}

          {activeTab === 'templates' && (
            <OrderTemplateManager
              onLoadTemplate={handleTemplateLoad}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <BulkUploadEnhanced
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedTemplate(null);
        }}
        onComplete={() => {
          setShowUploadModal(false);
          setActiveTab('history');
        }}
      />

      {/* Error correction modal */}
      {showErrorCorrection && errors.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <BulkErrorCorrection
            errors={errors}
            onCorrect={(corrections) => {
              console.log('Apply corrections:', corrections);
              setShowErrorCorrection(false);
              setErrors([]);
            }}
            onSkip={(skippedSkus) => {
              console.log('Skip SKUs:', skippedSkus);
              setShowErrorCorrection(false);
              setErrors([]);
            }}
            onCancel={() => {
              setShowErrorCorrection(false);
              setErrors([]);
            }}
          />
        </div>
      )}

      {/* Alternative selection modal */}
      {showAlternatives && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AlternativeProductSelector
            originalSku="DEMO-SKU"
            requestedQuantity={10}
            alternatives={[]}
            onSelect={(product, quantity) => {
              console.log('Selected alternative:', product, quantity);
              setShowAlternatives(false);
            }}
            onSkip={() => {
              setShowAlternatives(false);
            }}
            onCancel={() => {
              setShowAlternatives(false);
            }}
          />
        </div>
      )}
    </div>
  );
}