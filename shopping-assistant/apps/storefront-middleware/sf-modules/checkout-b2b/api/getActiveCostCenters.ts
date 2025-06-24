import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";

export const getActiveCostCenters = async (
  context: SapccIntegrationContext
) => {
  const { data: activeCostCenters } = await context.api.getActiveCostCenters(
    {}
  );

  return activeCostCenters;
};
