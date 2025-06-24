const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Setup options
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/$1',
    '^@features/(.*)$': '<rootDir>/features/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@sdk/(.*)$': '<rootDir>/sdk/$1',
  },
  
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    // Include all TypeScript files
    '**/*.{ts,tsx}',
    // Include AI Shopping Assistant feature
    'features/ai-shopping-assistant/**/*.{ts,tsx}',
    // Exclude test files
    '!**/__tests__/**',
    '!**/*.test.{ts,tsx}',
    '!**/testing/**',
    // Exclude configuration files
    '!**/*.config.{ts,js}',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    // Exclude type definition files
    '!**/*.d.ts',
    // Exclude mocks (they're test utilities)
    '!**/mocks/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Specific thresholds for AI Shopping Assistant
    './features/ai-shopping-assistant/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Transform options
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/'
  ],
  
  // Performance settings
  maxWorkers: '50%',
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Global setup/teardown
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);