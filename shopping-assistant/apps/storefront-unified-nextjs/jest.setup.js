// Jest setup file for global test configuration
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_ALOKAI_MIDDLEWARE_URL = 'http://localhost:4000';
process.env.NEXT_PUBLIC_ALOKAI_MULTISTORE_ENABLED = 'false';
process.env.NEXT_PUBLIC_DEFAULT_CURRENCY = 'USD';
process.env.NEXT_PUBLIC_DEFAULT_LOCALE = 'en-US';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
  useLocale: () => 'en-US',
}));

// Global test utilities
global.createMockResponse = (data) => ({
  ok: true,
  status: 200,
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers(),
});

global.createMockError = (message, status = 500) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
  text: async () => message,
  headers: new Headers(),
});

// Performance monitoring for tests
global.performanceMarks = new Map();

global.markPerformance = (label) => {
  global.performanceMarks.set(label, Date.now());
};

global.measurePerformance = (label) => {
  const start = global.performanceMarks.get(label);
  if (!start) return null;
  return Date.now() - start;
};

// Custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toContainObject(received, expected) {
    const pass = received.some(item => 
      Object.keys(expected).every(key => item[key] === expected[key])
    );
    
    if (pass) {
      return {
        message: () => `expected array not to contain object matching ${JSON.stringify(expected)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected array to contain object matching ${JSON.stringify(expected)}`,
        pass: false,
      };
    }
  },
  
  toBeValidUDLResponse(received) {
    const hasValidStructure = 
      received !== null &&
      typeof received === 'object' &&
      !Array.isArray(received);
    
    const pass = hasValidStructure;
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid UDL response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid UDL response`,
        pass: false,
      };
    }
  }
});

// Clean up after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
  global.performanceMarks.clear();
});

// Suppress console errors in tests unless explicitly testing error handling
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});