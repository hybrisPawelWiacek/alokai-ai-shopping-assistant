export function getDefaultPaymentTypes() {
  return {
    paymentTypes: [
      {
        code: 'CARD',
        displayName: 'Card Payment',
      },
      {
        code: 'ACCOUNT',
        displayName: 'Account Payment',
      },
    ],
  };
}
