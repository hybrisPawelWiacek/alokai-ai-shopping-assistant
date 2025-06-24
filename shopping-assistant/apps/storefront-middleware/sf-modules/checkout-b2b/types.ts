import { b2bCheckoutExtensionFactory } from "./extensionFactory";
import { type WithoutContext } from "@vue-storefront/middleware";

export type B2BCheckoutExtension = ReturnType<
  typeof b2bCheckoutExtensionFactory
>;
export type B2BCheckoutEndpoints = WithoutContext<
  B2BCheckoutExtension["extendApiMethods"]
>;
