import {
  createOrder,
  getActiveCostCenters,
  getCostCenterAddresses,
  getPaymentTypes,
  placeOrgOrder,
  replaceOrgCartCostCenter,
  replaceOrgCartPaymentType,
} from "./api";

type ExtensionOptions = {
  isNamespaced?: boolean;
};

export const b2bCheckoutExtensionFactory = (opt?: ExtensionOptions) => ({
  name: "b2b-checkout",
  isNamespaced: opt?.isNamespaced ?? true,
  extendApiMethods: {
    createOrder,
    getActiveCostCenters,
    getCostCenterAddresses,
    getPaymentTypes,
    placeOrgOrder,
    replaceOrgCartCostCenter,
    replaceOrgCartPaymentType,
  },
});
