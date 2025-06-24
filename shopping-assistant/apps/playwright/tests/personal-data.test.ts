import { test } from '@setup/test';

test.describe('Personal Data Page', () => {
  test('should present my account details', async ({ personalDataPage }) => {
    await personalDataPage.goto('/my-account/personal-data');

    await personalDataPage.hasProperLayout();
    await personalDataPage.hasUserDetails();
  });

  test('should allow me to update my first & last name', async ({ personalDataPage }) => {
    await personalDataPage.goto('/my-account/personal-data');

    const updatedNames = { firstName: 'Jane', lastName: 'Rather' };
    await personalDataPage.updateUserName(updatedNames);

    await personalDataPage.hasUserDetailsUpdated(updatedNames);
  });

  test('should allow me to update my email', async ({ personalDataPage }) => {
    await personalDataPage.goto('/my-account/personal-data');

    const updatedEmail = 'jane@rather.net';
    await personalDataPage.updateUserEmail(updatedEmail);

    await personalDataPage.hasUserDetails({ email: updatedEmail });
  });

  test('should allow me to update my password', async ({ personalDataPage }) => {
    await personalDataPage.goto('/my-account/personal-data');

    const updatedPassword = 'Rather123';
    const checkPasswordChangeRequest = personalDataPage.hasSentPasswordChangeRequest(updatedPassword);
    await personalDataPage.updateUserPassword(updatedPassword);

    await checkPasswordChangeRequest;
  });

  test('should show error alert when password change fails', async ({ personalDataPage }) => {
    await personalDataPage.goto('/my-account/personal-data');

    const updatedPassword = 'Rather123';
    await personalDataPage.mockChangePasswordErrorResponse();
    await personalDataPage.updateUserPassword(updatedPassword);

    await personalDataPage.hasErrorMessageInPasswordChangeModal();
  });
});
