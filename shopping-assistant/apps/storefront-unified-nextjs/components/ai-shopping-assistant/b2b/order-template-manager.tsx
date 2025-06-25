'use client';

import { useState, useEffect } from 'react';
import {
  SfButton,
  SfIconSave,
  SfIconUpload,
  SfIconTrash,
  SfIconEdit,
  SfIconShare,
  SfInput,
  SfChip,
} from '@storefront-ui/react';
import { useNotification } from '@/hooks/use-notification';
import { useBulkOperations } from '@/hooks/use-bulk-operations';

export interface OrderTemplate {
  id: string;
  name: string;
  description?: string;
  items: Array<{
    sku: string;
    quantity: number;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  shared: boolean;
  tags?: string[];
  totalItems: number;
  estimatedValue?: number;
}

interface OrderTemplateManagerProps {
  currentItems?: Array<{ sku: string; quantity: number; notes?: string }>;
  onLoadTemplate: (template: OrderTemplate) => void;
  className?: string;
}

export default function OrderTemplateManager({
  currentItems,
  onLoadTemplate,
  className,
}: OrderTemplateManagerProps) {
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OrderTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { showNotification } = useNotification();
  const { downloadTemplate } = useBulkOperations();

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-assistant/bulk-operations/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to load templates',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!newTemplateName.trim() || !currentItems || currentItems.length === 0) {
      showNotification({
        type: 'warning',
        message: 'Template name and items are required',
      });
      return;
    }

    try {
      const template = {
        name: newTemplateName,
        description: newTemplateDescription,
        items: currentItems,
        tags: [], // Could be enhanced with tag selection
      };

      const response = await fetch('/api/ai-assistant/bulk-operations/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        showNotification({
          type: 'success',
          message: 'Template saved successfully',
        });
        setShowCreateDialog(false);
        setNewTemplateName('');
        setNewTemplateDescription('');
        await loadTemplates();
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to save template',
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ai-assistant/bulk-operations/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showNotification({
          type: 'success',
          message: 'Template deleted',
        });
        await loadTemplates();
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to delete template',
      });
    }
  };

  const shareTemplate = async (templateId: string, shared: boolean) => {
    try {
      const response = await fetch(`/api/ai-assistant/bulk-operations/templates/${templateId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shared }),
      });

      if (response.ok) {
        showNotification({
          type: 'success',
          message: shared ? 'Template shared with team' : 'Template unshared',
        });
        await loadTemplates();
      }
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to update sharing',
      });
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => template.tags?.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(templates.flatMap(t => t.tags || [])));

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Order Templates</h3>
          {currentItems && currentItems.length > 0 && (
            <SfButton
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2"
            >
              <SfIconSave size="sm" />
              Save Current as Template
            </SfButton>
          )}
        </div>

        {/* Search and filters */}
        <div className="space-y-3">
          <SfInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full"
          />
          
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <SfChip
                  key={tag}
                  size="sm"
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  className={
                    selectedTags.includes(tag)
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-neutral-100'
                  }
                >
                  {tag}
                </SfChip>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Templates list */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          {searchQuery || selectedTags.length > 0
            ? 'No templates match your filters'
            : 'No templates saved yet'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium flex items-center gap-2">
                    {template.name}
                    {template.shared && (
                      <SfChip size="sm" className="bg-blue-100 text-blue-800">
                        Shared
                      </SfChip>
                    )}
                  </h4>
                  {template.description && (
                    <p className="text-sm text-neutral-600 mt-1">
                      {template.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <SfButton
                    variant="tertiary"
                    size="sm"
                    onClick={() => onLoadTemplate(template)}
                    title="Load template"
                  >
                    <SfIconUpload size="sm" />
                  </SfButton>
                  <SfButton
                    variant="tertiary"
                    size="sm"
                    onClick={() => downloadTemplate(template.name, template.items)}
                    title="Download as CSV"
                  >
                    <SfIconSave size="sm" />
                  </SfButton>
                  <SfButton
                    variant="tertiary"
                    size="sm"
                    onClick={() => shareTemplate(template.id, !template.shared)}
                    title={template.shared ? 'Unshare' : 'Share with team'}
                  >
                    <SfIconShare size="sm" className={template.shared ? 'text-blue-600' : ''} />
                  </SfButton>
                  <SfButton
                    variant="tertiary"
                    size="sm"
                    onClick={() => deleteTemplate(template.id)}
                    title="Delete template"
                  >
                    <SfIconTrash size="sm" className="text-red-600" />
                  </SfButton>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span>{template.totalItems} items</span>
                {template.estimatedValue && (
                  <span>~${(template.estimatedValue / 100).toFixed(2)}</span>
                )}
                <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
              </div>
              
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.tags.map(tag => (
                    <SfChip key={tag} size="sm" className="bg-neutral-100">
                      {tag}
                    </SfChip>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create template dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save as Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Template Name *
                </label>
                <SfInput
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Monthly Office Supplies"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Add notes about this template..."
                  className="w-full p-2 border border-neutral-300 rounded-lg"
                  rows={3}
                />
              </div>
              
              <div className="text-sm text-neutral-600">
                This template will include {currentItems?.length || 0} items
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <SfButton
                variant="secondary"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewTemplateName('');
                  setNewTemplateDescription('');
                }}
                className="flex-1"
              >
                Cancel
              </SfButton>
              <SfButton
                variant="primary"
                onClick={saveTemplate}
                disabled={!newTemplateName.trim()}
                className="flex-1"
              >
                Save Template
              </SfButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}