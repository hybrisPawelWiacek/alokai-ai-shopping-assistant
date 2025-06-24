import { getCartId, getNormalizers } from "@vsf-enterprise/unified-api-sapcc";
import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";
import type { RequiredPaymentDetailsProps } from "@vsf-enterprise/sapcc-types";
import getCreditCardType from "credit-card-type";
import type { AddPaymentDetailsArgs, CreateOrderArgs } from "./types";
import { placeOrgOrder } from "./placeOrgOrder";

export async function createOrder(
  context: SapccIntegrationContext,
  args: CreateOrderArgs,
) {
  const { paymentDetails } = args;

  if (paymentDetails) {
    await addPaymentDetails(context, paymentDetails);
  }

  return await placeOrgOrder(context, args);
}

async function addPaymentDetails(
  context: SapccIntegrationContext,
  args: AddPaymentDetailsArgs,
) {
  const { billingAddress, payload } = args;

  const { unnormalizeAddress } = getNormalizers(context);
  const creditCardType = getCreditCardType(payload.number)[0];
  const accountHolderName = [
    billingAddress.firstName,
    billingAddress.lastName,
  ].join(" ");
  const cartId = getCartId(context);

  await context.api.createCartPaymentDetails({
    cartId,
    paymentDetails: {
      billingAddress: unnormalizeAddress(
        billingAddress,
      ) as RequiredPaymentDetailsProps["billingAddress"],
      accountHolderName,
      cardNumber: payload.number,
      cardType: {
        code: creditCardType.type,
        name: creditCardType.niceType,
      },
      expiryMonth: payload.expiryMonth,
      expiryYear: payload.expiryYear,
    },
  });
}
