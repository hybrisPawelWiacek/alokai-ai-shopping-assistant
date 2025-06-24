import { B2BCheckoutEndpoints } from 'storefront-middleware/types';

export type InferSdk<TName extends keyof B2BCheckoutEndpoints> = Awaited<ReturnType<B2BCheckoutEndpoints[TName]>>;

export type InferSdkArgs<TName extends keyof B2BCheckoutEndpoints> = Parameters<B2BCheckoutEndpoints[TName]>[0];
