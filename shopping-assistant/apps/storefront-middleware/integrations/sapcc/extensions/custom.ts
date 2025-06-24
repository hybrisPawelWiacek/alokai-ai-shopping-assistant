import { type ApiClientExtension } from "@vue-storefront/middleware";
import * as methods from "../../../api/custom-methods/custom";

/**
 * @description
 * Boilerplate custom extension for sapcc integration.
 *
 * More information can be found at {@link https://docs.alokai.com/unified-data-layer/integration-and-setup/creating-new-api-methods}
 */
export const customExtension = {
  name: "custom",
  isNamespaced: true,
  extendApiMethods: {
    ...methods,
  },
} satisfies ApiClientExtension;
