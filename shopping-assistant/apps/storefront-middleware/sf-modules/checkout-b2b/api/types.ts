import type { SfCreateAddressBody } from "@vsf-enterprise/unified-api-sapcc";

export type ReplaceOrgCartPaymentTypeArgs = {
  paymentType: string;
  cartId?: string;
};

export type ReplaceOrgCartCostCenterArgs = {
  costCenterId: string;
  cartId?: string;
};

export type GetCostCenterAddressesArgs = {
  costCenterCode: string;
};

export type PlaceOrgOrderArgs = {
  termsChecked: boolean;
};

export type CreateOrderArgs = PlaceOrgOrderArgs & {
  paymentDetails?: AddPaymentDetailsArgs;
};

export type AddPaymentDetailsArgs = {
  billingAddress: SfCreateAddressBody;
  payload: {
    number: string;
    expiryMonth: string;
    expiryYear: string;
  };
};
