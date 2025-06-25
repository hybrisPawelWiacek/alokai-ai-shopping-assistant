/**
 * Configuration UI Mockup
 * A simple mockup showing how business users could manage AI assistant configurations
 * This is NOT a functional implementation - just a visual representation for PROMPT 14
 */

import React, { useState } from 'react';
import {
  SfButton,
  SfIconCheck,
  SfIconClose,
  SfIconEdit,
  SfIconAdd,
  SfIconDelete,
  SfBadge,
  SfAlert,
  SfTab,
  SfTabs,
  SfSwitch,
  SfInput,
  SfSelect
} from '@storefront-ui/react';

interface MockAction {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  b2cEnabled: boolean;
  b2bEnabled: boolean;
}

const mockActions: MockAction[] = [
  { id: 'search', name: 'Search Products', category: 'search', enabled: true, b2cEnabled: true, b2bEnabled: true },
  { id: 'add_to_cart', name: 'Add to Cart', category: 'cart', enabled: true, b2cEnabled: true, b2bEnabled: true },
  { id: 'checkout', name: 'Checkout', category: 'checkout', enabled: true, b2cEnabled: true, b2bEnabled: true },
  { id: 'request_bulk_pricing', name: 'Request Bulk Pricing', category: 'b2b', enabled: true, b2cEnabled: false, b2bEnabled: true },
  { id: 'track_order', name: 'Track Order', category: 'customer', enabled: true, b2cEnabled: true, b2bEnabled: true },
];

export function ConfigurationUIMockup() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [actions, setActions] = useState(mockActions);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const toggleActionEnabled = (actionId: string) => {
    setActions(actions.map(a => 
      a.id === actionId ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      search: 'text-blue-600',
      cart: 'text-green-600',
      checkout: 'text-purple-600',
      b2b: 'text-orange-600',
      customer: 'text-teal-600',
      support: 'text-gray-600'
    };
    return colors[category] || 'text-gray-600';
  };

  const handleSave = () => {
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AI Shopping Assistant Configuration
        </h1>
        <p className="text-gray-600">
          Manage actions, parameters, and behavior for your AI shopping assistant
        </p>
      </div>

      {/* Success Alert */}
      {showSuccessAlert && (
        <SfAlert className="mb-4" variant="positive">
          <strong>Configuration saved successfully!</strong> Changes will take effect immediately.
        </SfAlert>
      )}

      {/* Main Configuration Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <SfTabs value={selectedTab} onChange={setSelectedTab}>
          <SfTab label="Actions" />
          <SfTab label="Global Settings" />
          <SfTab label="Security" />
          <SfTab label="Performance" />
        </SfTabs>

        <div className="p-6">
          {selectedTab === 0 && (
            <div className="space-y-4">
              {/* Actions List */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Available Actions</h2>
                <SfButton size="sm" variant="secondary">
                  <SfIconAdd className="mr-2" />
                  Add Custom Action
                </SfButton>
              </div>

              <div className="space-y-3">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <SfSwitch
                          checked={action.enabled}
                          onChange={() => toggleActionEnabled(action.id)}
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{action.name}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`text-sm ${getCategoryColor(action.category)}`}>
                              {action.category}
                            </span>
                            <div className="flex space-x-2">
                              {action.b2cEnabled && (
                                <SfBadge variant="secondary" size="sm">B2C</SfBadge>
                              )}
                              {action.b2bEnabled && (
                                <SfBadge variant="secondary" size="sm">B2B</SfBadge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <SfButton size="sm" variant="tertiary">
                          <SfIconEdit />
                        </SfButton>
                        <SfButton size="sm" variant="tertiary">
                          <SfIconDelete />
                        </SfButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Global Settings</h2>
              
              {/* Environment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environment
                </label>
                <SfSelect value="development">
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </SfSelect>
              </div>

              {/* Default Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Timeout (ms)
                </label>
                <SfInput type="number" value="30000" />
              </div>

              {/* Cache TTL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cache TTL (seconds)
                </label>
                <SfInput type="number" value="300" />
              </div>
            </div>
          )}

          {selectedTab === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
              
              {/* Rate Limiting */}
              <div className="space-y-4">
                <h3 className="font-medium">Rate Limiting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requests per minute
                    </label>
                    <SfInput type="number" value="100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Window duration (ms)
                    </label>
                    <SfInput type="number" value="60000" />
                  </div>
                </div>
              </div>

              {/* Input Validation */}
              <div className="space-y-4">
                <h3 className="font-medium">Input Validation</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <SfSwitch checked={true} className="mr-2" />
                    Enable input validation
                  </label>
                  <label className="flex items-center">
                    <SfSwitch checked={true} className="mr-2" />
                    Enable output validation
                  </label>
                  <label className="flex items-center">
                    <SfSwitch checked={false} className="mr-2" />
                    Strict mode (reject unknown parameters)
                  </label>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Performance Settings</h2>
              
              {/* Response Time Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Time Target (ms)
                </label>
                <SfInput type="number" value="250" />
                <p className="text-sm text-gray-500 mt-1">
                  Target response time for all actions (200-250ms recommended)
                </p>
              </div>

              {/* Caching */}
              <div className="space-y-4">
                <h3 className="font-medium">Caching Strategy</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <SfSwitch checked={true} className="mr-2" />
                    Enable caching
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cache strategy
                    </label>
                    <SfSelect value="memory">
                      <option value="memory">In-Memory</option>
                      <option value="redis">Redis</option>
                      <option value="disk">Disk</option>
                    </SfSelect>
                  </div>
                </div>
              </div>

              {/* Concurrency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Concurrent Actions
                </label>
                <SfInput type="number" value="5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between">
          <div className="space-x-2">
            <SfButton variant="secondary">
              Export Configuration
            </SfButton>
            <SfButton variant="secondary">
              Import Configuration
            </SfButton>
          </div>
          <div className="space-x-2">
            <SfButton variant="tertiary">
              Cancel
            </SfButton>
            <SfButton onClick={handleSave}>
              Save Changes
            </SfButton>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Changes to configuration take effect immediately in development mode</li>
          <li>• Production changes require a deployment to take effect</li>
          <li>• Test configuration changes in staging before applying to production</li>
          <li>• Use the export/import feature to backup configurations</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Parameter Editor Mockup Component
 * Shows how individual action parameters could be edited
 */
export function ParameterEditorMockup() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Edit Action: Search Products</h2>
      
      <div className="space-y-4">
        {/* Parameter: query */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium">query</h3>
            <SfBadge variant="positive" size="sm">Required</SfBadge>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <SfSelect value="string">
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="array">Array</option>
                <option value="object">Object</option>
              </SfSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <SfInput value="Search query keywords" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Length
                </label>
                <SfInput type="number" value="2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Length
                </label>
                <SfInput type="number" value="100" />
              </div>
            </div>
          </div>
        </div>

        {/* Parameter: filters */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium">filters</h3>
            <SfBadge variant="secondary" size="sm">Optional</SfBadge>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <SfSelect value="object">
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="array">Array</option>
                <option value="object">Object</option>
              </SfSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <SfInput value="Filter criteria for search results" />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <SfButton variant="tertiary">Cancel</SfButton>
          <SfButton>Save Parameter</SfButton>
        </div>
      </div>
    </div>
  );
}