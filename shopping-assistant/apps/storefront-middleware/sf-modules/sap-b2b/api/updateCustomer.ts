import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";
import {
  assertAuthorized,
  type SfCustomer,
  type UpdateCustomerArgs,
} from "@vsf-enterprise/unified-api-sapcc";
import { getCustomer } from "./getCustomer";

export const updateCustomer = async (
  context: SapccIntegrationContext,
  args: UpdateCustomerArgs
) => {
  assertAuthorized(context);

  const { email, firstName, lastName } = args;

  await context.api.updateUser({
    user: {
      firstName,
      lastName,
      uid: email,
    },
  });

  return getCustomer(context) as unknown as { customer: SfCustomer };
};
