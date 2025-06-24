import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";
import { getNormalizers } from "@vsf-enterprise/unified-api-sapcc";
import type { GetCostCenterAddressesArgs } from "./types";

export const getCostCenterAddresses = async (
  context: SapccIntegrationContext,
  args: GetCostCenterAddressesArgs,
) => {
  const { costCenterCode } = args;

  if (!costCenterCode) {
    throw new Error(
      "Bad Request: missing required argument: `costCenterCode`. It is required to fetch cost center addresses.",
    );
  }
  const { normalizeCustomerAddress } = getNormalizers(context);
  const { data: costCenter } = await context.api.getCostCenter({
    costCenterCode,
  });

  return costCenter?.unit?.addresses?.map((address) =>
    normalizeCustomerAddress(address),
  );
};
