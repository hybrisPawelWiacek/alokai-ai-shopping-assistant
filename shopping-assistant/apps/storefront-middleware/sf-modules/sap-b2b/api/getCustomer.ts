import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";
import {
  isAuthenticated,
  getNormalizers,
} from "@vsf-enterprise/unified-api-sapcc";

export const getCustomer = async (context: SapccIntegrationContext) => {
  if (!isAuthenticated(context)) {
    return {
      customer: null,
    };
  }
  try {
    const { data: user } = await context.api.getOrgUser({});
    const { normalizeCustomer } = getNormalizers(context);

    return {
      customer: normalizeCustomer(user),
    };
  } catch {
    return {
      customer: null,
    };
  }
};
