import { defineAddCustomFields } from "@vsf-enterprise/unified-api-sapcc";

export const normalizerCustomFields = defineAddCustomFields({
  normalizeCart(_context, input) {
    return {
      paymentType: input.paymentType,
      costCenter: input.costCenter,
    };
  },
  normalizeOrder(_context, input) {
    return {
      costCenter: input.costCenter,
    };
  },
});
