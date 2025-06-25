
# Alokai Storefront

*Version: v1.0*  
*Last Updated: 25 June 2025*
Every time you choose to apply a rule(s), explicitly state the rule(s) in the output. You can abbreviate the rule description to a single word or phrase.

## Project Context
Storefront coded using Alokai (formerly Vue Storefront).

## Code Style and Structure
- Write concise, technical TypeScript code with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
- Structure repository files as follows:

### Frontend structure

NextJS related work
```
apps/
├── playwright/                     # Playwright testing framework directory
│   ├── CONTRIBUTING.md             # Contribution guidelines
│   ├── README.md                   # Documentation for the Playwright setup
│   ├── cart.test.ts                # Test for cart functionality
│   ├── eslint.config.mjs           # ESLint configuration
│   ├── homepage.test.ts            # Test for homepage functionality
│   ├── lint-staged.config.mjs      # Lint-staged configuration
│   ├── mocks/                      # Mock data for tests
│   ├── package.json                # Project dependencies and scripts
│   ├── playwright.config.ts        # Playwright configuration
│   ├── product-details.test.ts     # Test for product details functionality
│   ├── setup/                      # Test setup and configuration
│   ├── tests/                      # General tests and utilities
│   └── tsconfig.json               # TypeScript configuration for tests
└── storefront-unified-nextjs/      # Main Next.js application
    ├── app/                        # App router
    ├── components/                 # Reusable UI components
    ├── config/                     # Configuration files
    ├── coverage/                   # Coverage reports
    ├── helpers/                    # Utility/helper functions
    ├── hooks/                      # Custom React hooks
    ├── lang/                       # Language-specific resources
    ├── public/                     # Public assets
    ├── sdk/                        # Software Development Kit (API interactions, etc.)
    ├── stores/                     # State management stores
    ├── types/                      # TypeScript types and interfaces
    ├── README.md                   # Documentation for the project
    ├── eslint.config.mjs           # ESLint configuration
    ├── global.d.ts                 # Global TypeScript declarations
    ├── i18n.ts                     # Internationalization setup
    ├── lint-staged.config.mjs      # Lint-staged configuration
    ├── middleware.ts               # Middleware setup
    ├── next-env.d.ts               # Next.js environment types
    ├── next.config.mjs             # Next.js configuration
    ├── package.json                # Project dependencies and scripts
    ├── postcss.config.mjs          # PostCSS configuration
    ├── tailwind.config.ts          # Tailwind CSS configuration
    ├── tsconfig.json               # TypeScript configuration
    └── yarn-error.log              # Error log for Yarn
```

### Middleware structure
```
apps/
└── storefront-middleware/           # Middleware layer for the storefront
    ├── eslint.config.mjs            # ESLint configuration
    ├── integrations/                # Third-party service integrations
    ├── lib/                         # Core library utilities
    ├── middleware.config.ts         # Middleware configuration file
    ├── multistore/                  # Multi-store implementation files
    ├── multistore.config.ts         # Multi-store configuration file
    ├── package.json                 # Project dependencies and scripts
    ├── src/                         # Source code for middleware
    ├── tsconfig.json                # TypeScript configuration
    └── types.ts                     # TypeScript types and interfaces
```

#### Available integrations

- SAP Commerce Cloud, available under `/apps/storefront-middleware/integrations/sapcc`

## Documentation

- Don't include comments unless it's for complex logic

## Tech Stack
- TypeScript
- Tailwind CSS
- Storefront UI
- Alokai
- The project is a monorepo facilitated by turborepo
- NextJS
- Zustand
- next-intl

## Naming Conventions
- Favor named exports for components and utilities

## TypeScript Usage
- Use TypeScript for all code; prefer interfaces over types
- Avoid enums; use const objects with 'as const' assertion
- Avoid try/catch blocks unless there's good reason to translate or handle error in that abstraction
- Use explicit return types for all functions
- Use functional components with TypeScript interfaces

## State Management

- Use Zustand provided on the context for global state when needed
- Implement proper cleanup in useEffect hooks

## Syntax and Formatting
- Use curly braces in conditionals
- Implement proper TypeScript discriminated unions for message types
- Use declarative JSX

## UI and Styling
- Use Storefront UI for components
- Implement Tailwind CSS for styling
- Consider extension-specific constraints (popup dimensions, permissions)

## Error Handling
- Implement proper error boundaries
- Log errors appropriately for debugging
- Provide user-friendly error messages
- Handle network failures gracefully

## Testing
- Write unit tests for utilities and components
- Implement E2E tests for critical flows

## Security
- Sanitize user inputs
- Handle sensitive data properly

## Git Usage
Commit Message Prefixes:
- "fix:" for bug fixes
- "feat:" for new features
- "perf:" for performance improvements
- "docs:" for documentation changes
- "style:" for formatting changes
- "refactor:" for code refactoring
- "test:" for adding missing tests
- "chore:" for maintenance tasks
Rules:
- Use lowercase for commit messages
- Keep the summary line concise
- Include description for non-obvious changes
- Reference issue numbers when applicable

## Development Workflow
- Use proper version control
- Implement proper code review process
- Test in multiple environments
- Follow semantic versioning for releases
- Maintain changelog

### Adding new method
`apps/storefront-middleware/api/custom-methods` directory contains all the custom methods that aren't part of integrations. New file should be created there, like this:
```ts
import { type IntegrationContext } from "../../types";
/**
 * @description
 * Boilerplate custom method to be replaced
 *
 * More information can be found at {@link https://docs.alokai.com/unified-data-layer/integration-and-setup/creating-new-api-methods}
 */
export async function exampleCustomMethod(
  context: IntegrationContext,
  args: MyArgs,
): Promise<MyResponse> {
  // your implementation
  return {};
}
```
And then it should be re-exported in `apps/storefront-middleware/api/custom-methods/index.ts`.

### Utility endpoints
Utility endpoints can be added as an extension:
`apps/storefront-middleware/integrations/<integration-name>/extensions`