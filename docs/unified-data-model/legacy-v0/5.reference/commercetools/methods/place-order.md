# `PlaceOrder`
Implements `PlaceOrder` Unified Method.
        
## Source

```ts
import { InternalContext, defineApi, getCartVersion, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { placeOrderMutation } from "@/commons/customQueries/gqlDefs";
import { Token, isUserSession } from "@vsf-enterprise/commercetools-api";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import gql from "graphql-tag";

function removeTokenForGuestSession(context: InternalContext): void {
  /*
   * Prevents from transfering current guest's order history to the authenticated user
   * https://docs.commercetools.com/tutorials/anonymous-session#ending-an-anonymous-session-by-assigning-it-to-a-customer
   */
  let token: Token | undefined;
  try {
    token = JSON.parse(context.req.cookies["vsf-commercetools-token"]) as Token;
  } catch {
    token = undefined;
  }
  if (!isUserSession(token)) {
    context.res.clearCookie("vsf-customer-group");
    context.res.clearCookie("vsf-commercetools-token");
  }
}

export const placeOrder = defineApi.placeOrder(async (context) => {
  const { normalizeOrder } = getNormalizers(context);
  const draft = await getCartVersion(context);
  const { locale, acceptLanguage, currency, mergeGuestOrders } = context.config;
  const defaultVariables = {
    locale,
    acceptLanguage,
    currency,
    draft,
  };
  const response = await context.client.mutate({
    mutation: gql`
      ${placeOrderMutation}
    `,
    variables: defaultVariables,
    fetchPolicy: "no-cache",
    context: {
      req: context.req,
      res: context.res,
    },
  });

  if (!mergeGuestOrders) {
    removeTokenForGuestSession(context);
  }

  return normalizeOrder(response.data.order, getNormalizerContext(context));
});

```
