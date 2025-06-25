# Integration test suite

*Version: v1.0*  
*Last Updated: 25 June 2025*

This is an integration test suite made in Playwright for Storefront app.

## Running the test suite

If you're running the test suite for the first time, please install Playwright dependencies first:

```bash
yarn playwright install --with-deps
```

To run the test suite in the headless mode:

```bash
# in project root directory
yarn test:integration:pw
# or in playwright directory
yarn playwright test
```

If you want to run Playwright in the UI mode, navigate to the project directory and run:

```bash
yarn playwright test --ui
```

If you want to run Playwright using a framework development server, navigate to the project directory and run:

```bash
yarn test:integration:dev
```

## Project Directory Structure

This application manages your frontend's integration tests written in Playwright. Here's a breakdown of the key directories and their purposes:

```bash
.
├── CONTRIBUTING.md
├── README.md
├── lint-staged.config.mjs
├── mocks
│   ├── cms
│   ├── init.ts
│   ├── types.ts
│   ├── unified
│   └── utils
├── package.json
├── playwright.config.ts
├── setup
│   ├── db.ts
│   ├── fixtures
│   ├── frameworks
│   │   ├── config.ts
│   │   ├── [framework]
│   │       ├── config.ts
│   │       ├── server.ts
│   │       ├── server-dev.ts
│   │       ├── setup.ts
│   │       ├── shared.ts
│   │       └── teardown.ts
│   ├── test.ts
│   └── types.ts
├── tests
│   ├── homepage.test.ts
│   └── not-found.test.ts
└── tsconfig.json
```

- `tests`
  - **Core:** This directory is the heart of your testing suite. It houses all Playwright integration tests written in TypeScript files using the `.test.ts` extension.
- `setup` - This directory provides the foundation for your testing environment:
  - `fixtures`: This subdirectory stores functions used in [Playwright fixtures](https://playwright.dev/docs/test-fixtures).
  - `frameworks`: This subdirectory contains configurations for different frontend frameworks, such as Nuxt.js and Next.js.
    - `config.ts`: This file defines the configuration options for the specific frontend framework.
    - `[framework]`: This directory contains the specific configuration for the frontend framework you're testing.
      - `config.ts`: This file defines the configuration options for the specific frontend framework.
      - `server.ts`: This file holds the code responsible for launching separate Storefront servers within each Playwright worker. Playwright allows running tests in parallel, and this setup ensures each worker has its own server instance.
      - `server-dev.ts`: This file holds the code responsible for launching separate Storefront development servers within each Playwright worker.
      - `setup.ts`: This file contains special test cases that build the frontend.
      - `shared.ts`: This file defines the shared utility functions used across framework-specific configurations.
      - `teardown.ts`: This file contains special test cases that perform teardown run after all dependent test cases have finished.
  - `test.ts`: This is a key file, that contains all the fixtures. It exports a `test()` function used to defining test scenarios.
  - `db.ts`: This file contains a in-memory database, a crucial tool used by fake middleware, to setup responses.
- `mocks` - This directory houses mocks for the specific middleware integrations your frontend applications use to make API calls. It employs a structured approach for each mocked integration:
  - **Subdirectories**: Each middleware integration you're mocking has its own subdirectory within mocks. Currently, you have subdirectories for:
    - Contentful CMS
    - Unified API for E-commerce
  - **Data directory**: Inside each middleware subdirectory, the data directory stores functions for:
    - **Setting mock endpoint state**: These functions allow you to define the desired state (responses) for the mocked endpoints within an in-memory database.
    - **Retrieving mock responses**: These functions enable fetching the pre-defined responses from the in-memory database, which are then used by the mock endpoints.
  - **Endpoints directory**: This directory contains very simple mock endpoints that:
    - **Fetch data**: These endpoints retrieve the data from the in-memory database defined in the data directory.
    - **Send responses**: Based on the fetched data, the endpoints construct and send appropriate responses to your tests.

## Playwright Configuration

This section details how Playwright is configured for running your integration tests. The configuration leverages the `@playwright/test` library and benefits from environment variables for customization.

### General Configuration:

- **Parallel execution**: Tests are run in fully parallel mode for faster execution times.
- **Only tests**: The `forbidOnly` option is enabled when running in CI environments to ensure all tests are executed and failures are identified.
- **Retries**: The configuration retries failing tests two times in CI environments, offering additional chances for flaky tests to pass.
- **Test Timeouts**: A global timeout of 60 seconds is set to prevent tests from hanging indefinitely.

### Playwright Configuration Options:

- **Color Scheme**: Playwright uses the color scheme (`colorScheme`) specified by the `PW_COLOR_SCHEME` environment variable, defaulting to `light` if not set. This option influences the visual appearance of browser windows during tests.
- **Locale**: The locale option is set based on the `PW_LOCALE` environment variable, `en-US` (US English) if not defined. This determines the language used in the browser during tests.
- **Tracing**: Playwright records trace information (trace: `on-first-retry`) only on the first retry of a failing test to avoid excessive logging.
- **Videos**: Video recordings of tests (`video`) are captured:
  - In CI environments: Only on the first retry of a failing test.
  - In local environments: Videos are recorded for all tests.
- **Debugging**: Debugging mode (`debug`) is enabled by default in local environments for easier inspection during test development. Additionally, enabling debug mode provides valuable insights into the requests sent to your mocked middleware layer. Playwright will log these requests in the console, aiding in debugging middleware interactions within your tests.

## Fixtures

[Fixtures](https://playwright.dev/docs/test-fixtures) provide essential data and functionalities for your Playwright tests. They are typically defined in separate files within the `fixtures` directory and injected into your tests using the `test.extend` method. This approach promotes modularity and reusability of test setup logic.

Here's a breakdown of the key fixtures available in your configuration:

1. **frontendUrl:** This fixture provides a string representing the URL of your frontend server running on the current Playwright worker.
1. **db**: This fixture grants access to the in-memory database used to define responses for your mocked middleware endpoints.
1. **debug**: This fixture acts as a configuration option that enables additional logging on fake middleware for debugging purposes.
1. **framework**: This fixture functions as a configuration option that defines the frontend framework used in your Playwright projects.
1. **middleware**: This fixture is responsible for starting an instance of your fake middleware on the current worker.
1. **utils**: This fixture provides a collection of utility functions for your tests.
1. **dataFactory**: This fixture offers a straightforward way to access all functions defined within the `mocks/data` directory.

## Endpoints mocking

This section dives into endpoint mocking, a crucial aspect of your Playwright integration tests. It allows you to simulate backend responses using a local server, isolating your frontend application and focusing on its core functionality without relying on an external API.

### How it Works:

1. Fake Middleware Server:

- The core of this mocking approach is a fake middleware server built with the [h3](https://h3.unjs.io/) HTTP server framework.
- This server runs on each [Playwright worker process](https://playwright.dev/docs/test-parallel), providing a dedicated environment for handling mocked requests.

2. Mock Endpoints:

- You define mock endpoints within your test project. These endpoints represent the APIs your frontend application interacts with.
- Each mock endpoint is a function that takes a context object and uses the `defineEventHandler` function to define how it handles requests:
  - The context object provides access to the [h3](https://h3.unjs.io/) server router for registering endpoints.
  - You can import data access functions to retrieve data from the in-memory database (setup in `setup/db.ts`) for constructing responses.
  - The function retrieves data using the data access function and returns it as the response body.

3. Arrange (Setting Up Data):

- In your test setup (arrange) phase, you typically populate the in-memory database with the desired data for your mock responses.
- Utilize the methods exposed by db (`setup/db.ts`) to manipulate the data.

4. Mock Endpoint Receiving Data:

- The mock endpoint function retrieves data from the in-memory database using the data access function.
- This ensures the response data is consistent with the data you set up in the arrange phase.
- The data access function interacts with the db object to fetch the relevant data based on the request.

### Understanding the flow:

- Explore `mocks/init.ts` for details on custom integration registration and mock endpoint initialization.
- Analyze `setup/fixtures/middleware.ts` to see how the fake middleware server is set up on each worker, including the registration of mock endpoints and where to add the `onAfterResponse` hook to enable optional debug logging.

By effectively using endpoint mocking with Playwright and the [h3](https://h3.unjs.io/) server acting as fake middleware, you can achieve greater control over your integration test environment, enabling you to test your frontend application in isolation with predictable and controllable responses based on the data you set up in your tests.

## Debugging

While Playwright offers various debugging tools, here's how to leverage logging within your mocked endpoints and tests for better troubleshooting:

### Enabling Request Logging (Debug Flag):

The `debug` option that is enabled by default, turns on the request logging for the fake middleware server.
This logs details of each incoming request to the console, helping you verify requests sent to your mocked endpoints.

### Playwright Debugging Mode:

For in-depth information on debugging Playwright tests, refer to the official documentation: [https://playwright.dev/docs/debug](https://playwright.dev/docs/debug)
