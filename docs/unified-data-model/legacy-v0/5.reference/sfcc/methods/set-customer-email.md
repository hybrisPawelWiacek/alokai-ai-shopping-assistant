# `SetCustomerEmail`
Implements `SetCustomerEmail` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizedCart } from "@vsf-enterprise/unified-api-sfcc";
import "./extended.d";

// SFCC does not validate the email, so for the consistency with other integrations, we do it by ourserveles
// Regex taken from: https://emailregex.com/
const EMAIL_REGEX =
  /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/;

export const setCustomerEmail = defineApi.setCustomerEmail(async (context, args) => {
  const { email } = args;

  if (!EMAIL_REGEX.test(email)) {
    throw { message: "Email does not match the RFC 5322 specification.", statusCode: 400 };
  }

  const cart = await context.api.setBasketCustomerInfo({
    email,
  });

  return await getNormalizedCart(context, cart);
});

```
