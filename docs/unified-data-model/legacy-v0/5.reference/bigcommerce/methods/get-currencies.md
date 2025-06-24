# `GetCurrencies`
Implements `GetCurrencies` Unified Method.
        
## Source

```ts
import { defineApi } from "@vsf-enterprise/unified-api-bigcommerce";

export const getCurrencies = defineApi.getCurrencies(async (context) => {
  const { config, req, res } = context;

  const { currencies, defaultCurrency } = config;
  const availableCurrencies = Array.isArray(currencies) ? currencies : [defaultCurrency];

  let currentCurrency = req.cookies["vsf-currency"];

  if (!currentCurrency || !availableCurrencies.includes(currentCurrency)) {
    currentCurrency = defaultCurrency;
  }

  res.cookie("vsf-currency", currentCurrency, { sameSite: "strict", secure: true });

  return {
    currencies: availableCurrencies,
    defaultCurrency,
    currentCurrency,
  };
});

```
