import { type IntegrationContext } from "../../types";
import type { CustomMethodArgs, CustomMethodResponse } from "./types";

/**
 * @description
 * Boilerplate custom method to be replaced
 *
 * More information can be found at {@link https://docs.alokai.com/unified-data-layer/integration-and-setup/creating-new-api-methods}
 */
export async function exampleCustomMethod(
  context: IntegrationContext,
  args: CustomMethodArgs,
): Promise<CustomMethodResponse> {
  // your implementation
  return {};
}

// Export product similarity method
export { findSimilarProducts } from "./product-similarity";
