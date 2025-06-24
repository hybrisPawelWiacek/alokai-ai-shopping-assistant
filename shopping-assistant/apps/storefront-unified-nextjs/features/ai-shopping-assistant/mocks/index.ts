/**
 * Mock implementations following Alokai UDL patterns
 * These mocks provide a consistent development experience while backend integration is pending
 * 
 * Usage:
 * 1. Import createMockSdk instead of getSdk() during development
 * 2. Replace mock calls with real SDK calls when backend is ready
 * 3. Use type definitions from mock-responses.ts to ensure compatibility
 */

export { createMockSdk, type MockSdk, type MockUnified } from './mock-sdk-factory';
export { mockCustomExtension } from './custom-extension-mock';
export * from '../types/mock-responses';