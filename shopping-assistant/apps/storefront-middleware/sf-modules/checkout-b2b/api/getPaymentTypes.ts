import { isAuthenticated } from "@vsf-enterprise/unified-api-sapcc";
import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";

export const getPaymentTypes = async (context: SapccIntegrationContext) => {
  if (!isAuthenticated(context)) {
    throw new Error(
      "Bad Request: customer is not authenticated. It is required to fetch payment types."
    );
  }
  const { data: paymentTypes } = await context.api.getPaymentTypes({});

  return paymentTypes;
};
