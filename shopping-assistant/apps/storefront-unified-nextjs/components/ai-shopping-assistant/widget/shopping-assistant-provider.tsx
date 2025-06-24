'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ShoppingMode } from '../types';

interface ShoppingAssistantContextValue {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  defaultMode: ShoppingMode;
  setDefaultMode: (mode: ShoppingMode) => void;
  apiEndpoint: string;
  setApiEndpoint: (endpoint: string) => void;
}

const ShoppingAssistantContext = createContext<ShoppingAssistantContextValue | undefined>(undefined);

interface ShoppingAssistantProviderProps {
  children: ReactNode;
  defaultEnabled?: boolean;
  defaultMode?: ShoppingMode;
  apiEndpoint?: string;
}

export function ShoppingAssistantProvider({
  children,
  defaultEnabled = true,
  defaultMode: initialDefaultMode = 'b2c',
  apiEndpoint: initialApiEndpoint = '/api/ai-shopping-assistant',
}: ShoppingAssistantProviderProps) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);
  const [defaultMode, setDefaultMode] = useState<ShoppingMode>(initialDefaultMode);
  const [apiEndpoint, setApiEndpoint] = useState(initialApiEndpoint);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('ai-assistant-preferences');
      if (savedPreferences) {
        try {
          const prefs = JSON.parse(savedPreferences);
          if (prefs.isEnabled !== undefined) setIsEnabled(prefs.isEnabled);
          if (prefs.defaultMode) setDefaultMode(prefs.defaultMode);
          if (prefs.apiEndpoint) setApiEndpoint(prefs.apiEndpoint);
        } catch (error) {
          console.error('Failed to load AI assistant preferences:', error);
        }
      }
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preferences = {
        isEnabled,
        defaultMode,
        apiEndpoint,
      };
      localStorage.setItem('ai-assistant-preferences', JSON.stringify(preferences));
    }
  }, [isEnabled, defaultMode, apiEndpoint]);

  const value: ShoppingAssistantContextValue = {
    isEnabled,
    setIsEnabled,
    defaultMode,
    setDefaultMode,
    apiEndpoint,
    setApiEndpoint,
  };

  return (
    <ShoppingAssistantContext.Provider value={value}>
      {children}
    </ShoppingAssistantContext.Provider>
  );
}

export function useShoppingAssistantContext() {
  const context = useContext(ShoppingAssistantContext);
  if (!context) {
    throw new Error(
      'useShoppingAssistantContext must be used within a ShoppingAssistantProvider'
    );
  }
  return context;
}