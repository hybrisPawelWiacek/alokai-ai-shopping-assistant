# @vsf-enterprise/unified-sdk

## 1.6.0

### Minor Changes

- adc5bf9: Added new option - errorHandler - that allows to define custom error handling for all reqests. This option also allows to use createRefreshTokenAndRetryHandler() from @vsf-enterprise/sapcc-sdk to refreshing expired user token.

## 1.5.1

### Patch Changes

- 1f52ffa: Update dependencies

## 1.5.0

### Minor Changes

- 5aa28292: Infer sdk method type helpers

## 1.4.0

### Minor Changes

- Added utils types for error handling:

  - `isCausedBySdkError`
  - `isSpecificSdkError`
  - `isSdkRequestError`
  - `isSdkUnauthorizedError`

## 1.3.0

### Minor Changes

- Added extra configration option - headers - that takes function which is resolved on every request and that result is spread to the request's headers

## 1.2.1

### Patch Changes

- Publish `src` directory

## 1.2.0

### Minor Changes

- sdk now tries to parse all responses as JSON and fallbacks to text in case of unsuccessful attempt

## 1.1.1

### Patch Changes

- Export `SDKError`, fix response `statusCode`

## 1.1.0

### Minor Changes

- Improved error messages - now Unifed SDK module, uses the SDKError class that contains a message, statusCode & cause of the error

### Patch Changes

- Fix problem with handling empty responses from Middleware in Unifed SDK module

## 1.0.0

### Major Changes

- The package has been rewritten into an SDK module, compatible with other integrations.

## 0.3.0

### Minor Changes

- Update packages for SI demo preparation

## 0.2.0

### Minor Changes

- Update packages for SI demo preparation

## 0.1.1

### Patch Changes

- Update release pipeline

## 0.1.0

### Minor Changes

- Update packages in order to prepare unified storefront demo

- Update packages for demo purposes
