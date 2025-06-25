# `SetCustomerEmail`
Implements `SetCustomerEmail` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext, getCartVersion } from "@vsf-enterprise/unified-api-commercetools";
import { cartActions } from "@vsf-enterprise/commercetools-api";
import type { Cart } from "@vsf-enterprise/commercetools-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";

// Commercetools does not validate the email, so for the consistency with other integrations, we do it by ourserveles
// Regex taken from: https://emailregex.com/
const EMAIL_REGEX =
  /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/;

export const setCustomerEmail = defineApi.setCustomerEmail(async (context, args) => {
  const version = await getCartVersion(context);
  const { email } = args;

  if (!EMAIL_REGEX.test(email)) {
    throw { message: "Email does not match the RFC 5322 specification.", statusCode: 400 };
  }

  const setCustomerEmailAction = cartActions.setCustomerEmail(email);

  const updatedCart = await context.api.updateCart({
    ...version,
    actions: [setCustomerEmailAction],
  });

  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(updatedCart.data?.cart as Cart, getNormalizerContext(context));
});

```
