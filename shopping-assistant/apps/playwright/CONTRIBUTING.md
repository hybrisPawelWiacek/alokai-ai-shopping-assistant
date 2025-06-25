# Integration test suite

*Version: v1.0*  
*Last Updated: 25 June 2025*

This is an integration test suite made in Playwright for Storefront apps (both written in Nuxt and Next.js meta-frameworks). This document brings you more technical details about creating new tests & mocked endpoints.

## Running tests for only one framework

To run tests only on Nuxt or Next.js there are two ways of doing it:

1. You can comment out the project in the `playwright.config.ts` - if you want to make it for a longer while
1. You can use the command switch `--project=<project_name>`
1. You can run Playwright in the UI mode, and the filter out the project in the toolbox in the left top corner

## Project Configuration:

The Playwright configuration defines several projects, allowing you to configure different test execution environments, with a key focus on enabling testing across your Next.js and Nuxt.js applications:

### Shared Test Suite:

A significant aspect of your test strategy involves running the same test suite against both your Next.js and Nuxt.js applications. This approach promotes code and behavior consistency across the frameworks. To achieve this, your tests likely rely on shared data-test IDs within the UI components of both applications. These data-test IDs allow Playwright to interact with specific elements consistently, regardless of the underlying framework.

### Framework-Specific Considerations:

While the core test suite is shared, there might be scenarios where tests need to be tailored for a specific framework. You have two main approaches to handle these situations:

- **Separate Test Files**: You can create separate test files with distinct names, using extensions like `.test.nextjs.ts` and `.test.nuxt.ts`. This approach keeps framework-specific tests organized and easy to identify.
- **Fixture**: Alternatively, you can utilize a test fixture named `framework` that holds a string value representing the current framework (e.g., `nextjs` or `nuxt`). Your tests can then access this fixture value and conditionally execute framework-specific logic based on the framework under test. This approach offers more flexibility within a single test file.

**Example:**

```ts
test('Login functionality', async ({ page, framework }) => {
  const usernameInput = await page.locator(`[data-testid="username-input"]`);
  const passwordInput = await page.locator(`[data-testid="password-input"]`);
  const submitButton = await page.locator(`[data-testid="submit-button"]`);

  // Fill in login credentials (potentially with framework-specific logic based on the value of `framework`)
  if (framework === 'nuxt') {
    await usernameInput.fill('test_user');
    await passwordInput.fill('secret_password');
  } else if (framework === 'nextjs') {
    await usernameInput.fill('another_user');
    await passwordInput.fill('another_password');
  } else {
    // We do this to stop the test when framework somehow is out-of-the-scope
    expect(false).toBe(true);
  }

  await submitButton.click();
});
```

In this example, the core login functionality test leverages shared data-test IDs and adapts logic based on the value of the framework fixture for potential framework-specific actions.

This project configuration empowers you to execute a unified test suite across your Next.js and Nuxt.js applications while providing flexibility to handle framework-specific test needs.

## Fixtures

[Fixtures](https://playwright.dev/docs/test-fixtures) provide essential data and functionalities for your Playwright tests. They are typically defined in separate files within the `fixtures` directory and injected into your tests using the `test.extend` method. This approach promotes modularity and reusability of test setup logic.

Here's a breakdown of the key fixtures available in your configuration:

1. **frontendUrl:**

- **Description**: This fixture provides a string representing the URL of your frontend server running on the current Playwright worker.
- **Functionality**: It orchestrates the following:
  - Starts the frontend server within the worker.
  - Passes the address of the mocked middleware running on this worker to the frontend server.
  - Performs an initial test fetch request to the frontend server.
- **Timeout**: Due to the complexity of setting up the frontend server, this fixture has a longer timeout (`FRONTEND_BUILD_TIMEOUT`) compared to other fixtures.
- **Scope**: Worker-scoped, meaning a fresh frontend server is launched for each worker.

2. **db**:

- **Description**: This fixture grants access to the in-memory database used to define responses for your mocked middleware endpoints.
- **Functionality**: It sets up this in-memory database, ensuring a clean state for each test.
- **Scope**: Test-scoped, guaranteeing isolation of test data between individual tests within the same worker.

3. **debug**:

- **Description**: This fixture acts as a configuration option that enables additional logging on fake middleware for debugging purposes.
- **Functionality**: When enabled (`true`), it provides:
  - Logging of requests made to the mocked middleware.
  - Detailed error logging related to the mocked middleware.
- **Scope**: Worker-scoped, ensuring debug logs are specific to each worker.

4. **framework**:

- **Description**: This fixture functions as a configuration option that defines the frontend framework used in your Playwright projects.
- **Functionality**: It allows you to specify the framework (e.g., `nextjs` or `nuxt`) within your tests.
- **Scope**: Worker-scoped, enabling different frameworks to be tested within separate workers.

5. **middleware**:

- **Description**: This fixture is responsible for starting an instance of your fake middleware on the current worker.
- **Functionality**: It starts the mocked middleware using the [h3](https://h3.unjs.io/) server framework and returns an object containing:
  - The port on which the middleware is running.
  - An instance of the middleware application itself.
- **Scope**: Worker-scoped, ensuring a dedicated instance of the mocked middleware runs on each worker.

6. **utils**:

- **Description**: This fixture provides a collection of utility functions for your tests.
- **Current Functions**:
  - `waitForScrollEnd`: This function waits for the `scrollend` event listener to be triggered and adds a 250ms delay for frame animations to complete, particularly helpful on slower machines.
  - `waitForHydration`: This function waits for a Nuxt flag indicating hydration completion or waits for the network to finish data transfer on Next.js, ensuring the frontend is fully loaded before test interactions.
- **Scope**: Test-scoped, making the utility functions available within each worker's tests.

7. **dataFactory**:

- **Description**: This fixture offers a straightforward way to access all functions defined within the `mocks/data` directory.
- **Functionality**: It simplifies the process of using functions for setting up mock data within your tests.
- **Scope**: Test-scoped, ensuring a clean slate of mock data for each test run.

By understanding these fixtures and their roles, you can create more focused and efficient tests.

## How to create a new mocked endpoint?

Creating a New Mocked Endpoint with Playwright and [h3](https://h3.unjs.io/) Server
This guide walks you through creating a new mocked endpoint for your Playwright integration tests using a fake middleware server built with the [h3](https://h3.unjs.io/) framework.

**Prerequisites**:

- Basic understanding of Playwright and testing concepts.
- Familiarity with JavaScript and HTTP requests/responses.

### Steps:

1. Identify the Endpoint:

- Determine the URL or pattern of the API endpoint you want to mock.
- Example: `/getCart` endpoint that retrieves shopping cart items.

2. Define the Mock Response:

- Decide on the data or content you want to return for this endpoint. This could be static data, dynamic data retrieved from a database, or an error response.

3. Prepare the In-Memory Database:

- If your mock response requires data, you'll likely use an in-memory database for storing test data. Here's an example using the [unstorage](https://unstorage.unjs.io/) library:

Example in Unified API:

```ts
// setup/db.ts
//...

// Create a space for your response, with empty object as default
unified.setItem('cart', {});
```

1. Create the Mock Function:

- Location: Create a new file within the `mocks/<integration-name>/endpoints/` directory (replace `<integration-name>` with your integration name).
- Filename: Name the file descriptively based on the endpoint (e.g., `getCart.ts`).
- Function Structure: Define a function that takes a single argument: `MockFactoryContext`. This context object provides access to the [h3](https://h3.unjs.io/) server router for registering endpoints.

```ts
import type { MockFactoryContext } from '@mocks/types'; // Import type definition
import { defineEventHandler } from 'h3'; // Import h3 function

export default async function ({ router }: MockFactoryContext) {
  // Function body for defining the mock endpoint behavior
}
```

2. Define the Mock Endpoint Handler:

- Inside the function, use the [`defineEventHandler`](https://h3.unjs.io/guide/event-handler) function from `h3` package to define how the endpoint handles requests:
  - Method: Specify the HTTP method (GET, POST, PUT, etc.) this endpoint responds to (e.g., GET).
  - Path: Define the partial URL path for the endpoint (e.g., `/getCart`).
  - Handler Function: Provide a function that handles incoming requests to this endpoint.

```ts
router.get(
  '/getCart', // Define endpoint path
  defineEventHandler(async () => {
    // Code to retrieve and return mock response data
  }),
);
```

3. Retrieve Mock Response Data:

- Data Access Function: Use a data access function to retrieve data from your in-memory database (setup in `setup/db.ts`).
- Import the data access function (e.g., `getCartItems`) from the `mocks/<integration-name>/data/` directory (create this directory if needed).
- The data access function should interact with the `db` object (provided by your in-memory database setup) to fetch the desired data.

```ts
import { db } from '@setup/db';

export async function getCart() {
  return db.unified.getItem('cart') ?? {};
}
```

4. Return the Mock Response:

- Within the handler function of [`defineEventHandler`](https://h3.unjs.io/guide/event-handler), return the data you want to send back as the mock response.

```ts
import { getCartItems } from '../data'; // Import data access function

router.get(
  '/getCart',
  defineEventHandler(async () => {
    const cartItems = await getCartItems(); // Retrieve data from database
    return cartItems; // Return data as response body
  }),
);
```

5. (Optional) Include Additional Logic:

- The handler function can include more complex logic for manipulating request data or simulating specific scenarios during testing.

6. Register the Mock Function:

- In `mocks/<integration-name>/endpoints/index.ts`, export the created mock function (e.g., `getCart`).
- Import this function in `mocks/server.ts` and add it to the `serverFactory` array to register it with the fake middleware server.

```ts
// mocks/myIntegration/server.ts
import type { MockFactoryContext } from '@mocks/types';
import { getCart, getCategories, getCurrencies, getCustomer, getProductDetails, searchProduct } from './endpoints';

export const serverFactory = [
  (ctx: MockFactoryContext) => getCustomer(ctx),
  (ctx: MockFactoryContext) => getCart(ctx),
  (ctx: MockFactoryContext) => getCurrencies(ctx),
  (ctx: MockFactoryContext) => getCategories(ctx),
  (ctx: MockFactoryContext) => getProductDetails(ctx),
  (ctx: MockFactoryContext) => searchProduct(ctx),
];
```

7. Create a mock setter function:

- In `mocks/<integration-name>/data/getCart` (in our example) create an additional function that will be used by Arrange section of the test to set up data in in-memory database.
- Such function could read from the file, generate the object using `faker` or even making the API requests.
- This function will be available via `dataFactory` fixture.

```ts
import { db } from '@setup/db';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function setEmptyCart() {
  const cart = await readFile(resolve(fileURLToPath(import.meta.url), '../dumps/', 'empty-cart.json'), 'utf8');
  db.unified.setItem('cart', JSON.parse(cart));
}

// This function we created earlier
export async function getCart() {
  return db.unified.getItem('cart') ?? {};
}
```

**Remember:**

- Adjust the code examples based on your specific API endpoint and desired mock response behavior.
- Ensure your in-memory database setup aligns with the data you want to use in your mock responses.
- By following these steps, you can effectively create new mocked endpoints for your Playwright integration tests, allowing you to isolate your frontend application and test its functionality with predictable and controllable responses.

## Debugging

While Playwright offers various debugging tools, here's how to leverage logging within your mocked endpoints and tests for better troubleshooting:

### Enabling Request Logging (Debug Flag):

The `debug` option that is enabled by default, turns on the request logging for the fake middleware server.
This logs details of each incoming request to the console, helping you verify requests sent to your mocked endpoints.

### Debugging with console.log (Test Fixture):

While request logging provides insight, sometimes adding `console.log` statements within your test is helpful. When you want to keep this `console.log` to be visible only in debug mode - use the `debug` fixture in the test:

```ts
test('should display empty cart', async ({ page, dataFactory, debug }) => {
  // Arrange
  await dataFactory.setEmptyCart();

  // Act
  await page.goto('http://localhost');
  debug && console.log('Navigated to page');

  // Assert
  // ...
});
```

### Logging Responses (`onAfterResponse` Hook):

To log response details from your mocked endpoints, utilize the [h3 `onAfterResponse`](https://h3.unjs.io/guide/app#setting-global-hooks) hook within your mock server setup (`setup/fixtures/middleware.ts`):

```ts
export async function middlewareFixture(
  use: (middlewareServer: MiddlewareServer) => Promise<void>,
  { workerInfo, debug }: Context,
) {
  const app = createApp({
    onRequest(event) {
      debug &&
        console.log(`[WORKER ${workerInfo.workerIndex}] >>> MIDDLEWARE Request: [${event.method}] - ${event.path}`);

      const origin = getRequestHeader(event, 'origin') || '*';
      handleCors(event, { origin: [origin], methods: '*', credentials: true });
    },
    // Add this hook
    onAfterResponse(event, response) {
      debug &&
        console.log(
          `[WORKER ${workerInfo.workerIndex}] >>> MIDDLEWARE Response: [${event.method}] - ${event.path} - ${response?.body}`,
        );
    },
    onError(error) {
      debug && console.log(`[WORKER ${workerInfo.workerIndex}] >>> MIDDLEWARE Error:`, error);
    },
  });
```

This logs the HTTP method, URL, and response body after handling each request.

### Playwright Debugging Mode:

For in-depth information on debugging Playwright tests, refer to the official documentation: [https://playwright.dev/docs/debug](https://playwright.dev/docs/debug)

## Fetching Original Request to True Middleware

While mocking endpoints offers benefits, sometimes interacting with the actual backend during testing might be necessary. Here's how to utilize the fake middleware server to capture and forward a request to the true middleware:

1. Capturing Request Details:

- Leverage the [h3 library functions](https://h3.unjs.io/utils/request) within your mocked endpoint handler to access the original request details:
  - [`getRequestHeaders`](https://h3.unjs.io/utils/request#getrequestheadersevent): Retrieves all request headers as an object.
  - [`getQuery`](https://h3.unjs.io/utils/request#getqueryevent): Retrieves all query parameters as an object.
  - [`getRequestURL`](https://h3.unjs.io/utils/request#getrequesturlevent-opts-xforwardedhost-xforwardedproto): Generates the full incoming request URL considering forwarded headers like `X-Forwarded-Proto` and `X-Forwarded-Host`.
  - [`readBody`](https://h3.unjs.io/utils/request#readbodyevent-options-strict): Reads the request body as a string (useful for POST/PUT requests).

```ts
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (req) => {
  const headers = h3.getRequestHeaders(req);
  const queryParams = h3.getQuery(req);
  const url = h3.getRequestURL(req); // Use getRequestURL for full URL

  // Access request body (if applicable)
  const body = await h3.readBody(req);

  // ... further processing or forwarding logic
});
```

2. Forwarding Request to True Middleware:

- Use the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) to create a new request object with the captured details:

```ts
const makeURL = (url, query) => {
  const trueMiddlewareUrl = 'http://<your-true-middleware-domain>'; // Replace with actual URL
  const requestURL = new URL(url, trueMiddlewareUrl);
  const qp = new URLSearchParams(query);
  requestURL.search = qp.toString();

  return requestURL;
};

const forwardRequest = async (url, method, headers, body) => {
  const response = await fetch(url, {
    method,
    headers,
    body, // Add body if applicable
  });
  return response.json(); // Parse JSON response
};
```

3. Saving Response as JSON:

- Convert the response to JSON using [`response.json()`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json_static) and write it to a file using [`node:fs/promises.writeFile`](https://nodejs.org/docs/latest-v18.x/api/fs.html#fspromiseswritefilefile-data-options):

```ts
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const saveResponse = async (data, filename) => {
  const filePath = resolve(fileURLtoPath(import.meta.url), `../data/dumps/${filename}.json`);
  await writeFile(filePath, JSON.stringify(data, null, 2)); // Pretty-print JSON
};
```

4. Integration in Mock Endpoint Handler:

- Combine these steps within your mock endpoint handler:

```ts
import { getRequestHeaders, getQuery, getRequestURL, readBody } from 'h3';

export default defineEventHandler(async (event) => {
  const headers = getRequestHeaders(event);
  const queryParams = getQuery(event);
  const url = getRequestURL(event); // Use getRequestURL for full URL
  // Access request body (if applicable)
  const body = await readBody(event);
  const requestURL = makeURL(url, query);

  const trueMiddlewareResponse = await forwardRequest(requestURL, event.method, headers, body); // Forward request

  await saveResponse(trueMiddlewareResponse, 'my-request-response'); // Save response as JSON

  return trueMiddlewareResponse;
});
```

**Remember:**

- Replace placeholders like `<your-true-middleware-domain>` with your actual middleware URL.
- Adjust error handling and response processing as needed in your specific scenario.
- By incorporating [`getRequestURL`](https://h3.unjs.io/utils/request#getrequesturlevent-opts-xforwardedhost-xforwardedproto) and [`readBody`](https://h3.unjs.io/utils/request#readbodyevent-options-strict), you can capture the complete request information (URL, headers, body) from the original request and forward it to the true middleware during your tests. This provides a more comprehensive approach for interacting with the real backend occasionally for specific testing needs.

## Creating a new test

This section guides you through creating new Playwright tests that interact with your frontend application using mocked endpoints.

### Customizations:

- Remember that some tests might require adjustments based on your specific frontend frameworks (Next.js, Nuxt).
- You can leverage the `framework` fixture to detect the currently running frontend framework and write framework-specific assertions.
- To target tests for a particular framework, use the `.test.nextjs.ts` or `.test.nuxt.ts` file extensions.

### Utils Fixture:

- The `utils` fixture often provides common helper functions for your tests, such as waiting for application hydration.

### Example Test with Database and Data Factory:

This example demonstrates a test for a "Not Found" page using mocked endpoints, data setup functions, and the utils fixture:

```ts
import { expect } from '@playwright/test';
import { test } from '@setup/test';

test.describe('Not Found', () => {
  test('has empty state', async ({ page, frontendUrl, db, dataFactory, utils }) => {
    // Arrange (Set up test data)
    await dataFactory.cms.setupCmsEmptyPage(db, 'en', '/'); // Simulate empty CMS data

    // Act (Navigate to page and interact)
    await page.goto(`${frontendUrl}/`); // Assuming mocked endpoint handles "/"
    await utils.waitForHydration(); // Wait for application to be ready

    // Assert (Verify expected elements are visible)
    await expect(page.getByTestId('navbar-top')).toBeVisible(); // Navbar
    await expect(page.getByTestId('input')).toBeVisible(); // Input field (optional)
    await expect(page.getByTestId('account-action')).toBeVisible(); // Account actions
    await expect(page.getByTestId('footer')).toBeVisible(); // Footer
    await expect(page.getByTestId('section-middle')).toBeVisible(); // Content section
  });
});
```

#### Explanation:

1. The test starts by importing necessary functions like expect for assertions and test from your test setup (`@setup/test`).
2. Inside `test.describe('Not Found')`, we [define a group of tests](https://playwright.dev/docs/api/class-test#test-describe) for the "Not Found" scenario.
3. The individual test `test('has empty state')` utilizes several fixtures:

- `page`: The [Playwright page object](https://playwright.dev/docs/api/class-page) for interacting with the browser.
- `frontendUrl`: A fixture providing the base URL of your frontend application (might be different for Next.js and Nuxt versions).
- `db`: The in-memory database instance.
- `dataFactory`: A fixture containing functions to set up data in the in-memory database (e.g., `setupCmsEmptyPage`).
- `utils`: A fixture with common utility functions (e.g., `waitForHydration`).

4. Arrange (Set up test data):

- The `dataFactory.cms.setupCmsEmptyPage` function simulates an empty CMS response for the given path (assuming your mocked endpoint handles "/"). This ensures the test verifies the behavior for a non-existent page.

5. Act (Navigate to page and interact):

- The test navigates to the desired URL using the frontendUrl fixture and the / path.
- `utils.waitForHydration()` waits for the application to be fully loaded and interactive.

6. Assert (Verify expected elements are visible):

- The test asserts the visibility of various UI elements using [Playwright's expect](https://playwright.dev/docs/test-assertions) and `getByTestId` selector methods. These elements should be present even for a non-existent page.

**Remember:**

- Adapt this example to your specific testing needs, including data setup, expected behavior, and UI element selectors.
- Refer to the Playwright documentation for detailed information on writing effective tests: [https://playwright.dev/](https://playwright.dev/)

## Testing locally

To run your Playwright tests locally using app dev server, run the following command in your terminal:

```bash
yarn test:integration:dev
```

This command starts the Playwright test runner with the development server for your frontend application. It allows you to test your application locally with mocked endpoints and verify its behavior quickly.

**Remember:**

- Test runner will compile the application in the development mode, make sure you don't have your regular app running at the same time.
- Due to higher resources consumption required to run and handle real time compilation in development servers, it is recommended to reduce active workers to a minimum.