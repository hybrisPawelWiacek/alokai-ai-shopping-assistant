import { test } from '@setup/test';

test.describe('Shipping Details Page', () => {
  test('should present my account details', async ({ shippingDetailsPage }) => {
    await shippingDetailsPage.goto('/my-account/shipping-details');

    await shippingDetailsPage.hasProperLayout();
    await shippingDetailsPage.hasShippingAddresses();
  });

  test('should present empty state', async ({ shippingDetailsPage }) => {
    await shippingDetailsPage.mockEmptyResponse();
    await shippingDetailsPage.goto('/my-account/shipping-details');

    await shippingDetailsPage.hasEmptyState();
  });

  test('should allow me to add a new address', async ({ shippingDetailsPage }) => {
    await shippingDetailsPage.goto('/my-account/shipping-details');

    const address = shippingDetailsPage.exampleAddress;

    await shippingDetailsPage.addNewAddress();
    await shippingDetailsPage.fillAddressForm(address);

    await shippingDetailsPage.hasShippingAddressOnList(address);
  });

  test('should allow me to delete an address', async ({ shippingDetailsPage }) => {
    await shippingDetailsPage.goto('/my-account/shipping-details');

    const firstAddress = await shippingDetailsPage.getFirstAddressFromList();
    await shippingDetailsPage.deleteFirstAddressFromList();

    await shippingDetailsPage.hasAddressDeleted(firstAddress!);
  });

  test('should allow me to edit an address', async ({ shippingDetailsPage }) => {
    await shippingDetailsPage.goto('/my-account/shipping-details');

    const updatedAddress = {
      ...shippingDetailsPage.exampleAddress,
      city: 'Los Angeles',
      postalCode: '90001',
    };

    await shippingDetailsPage.editFirstAddressFromList();
    await shippingDetailsPage.fillAddressForm(updatedAddress);

    await shippingDetailsPage.hasFirstAddressUpdated(updatedAddress);
  });
});
