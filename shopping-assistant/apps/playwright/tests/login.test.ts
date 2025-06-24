import { test } from '@setup/test';

test.describe('LoginPage', () => {
  test('should render form', async ({ loginPage }) => {
    await loginPage.goto('/login');
    await loginPage.hasProperLayout();
  });

  test('should login user with remember me check', async ({ loginPage }) => {
    await loginPage.goto('/login');
    const credentials = await loginPage.getLoginCredentials();

    await loginPage.fillForm(credentials);
    await loginPage.checkRememberMe();
    await loginPage.submitForm();

    await loginPage.hasURLChangedTo('/my-account/**');
  });

  test('should login user without remember me check', async ({ loginPage }) => {
    await loginPage.goto('/login');

    const credentials = await loginPage.getLoginCredentials();

    await loginPage.fillForm(credentials);
    await loginPage.submitForm();

    await loginPage.hasURLChangedTo('/my-account/**');
  });

  test('should redirect to register page on create account link', async ({ loginPage }) => {
    await loginPage.goto('/login');

    await loginPage.clickRegisterLink();

    await loginPage.hasURLChangedTo('/register');
  });

  test('should show an alert error when log-in with invalid credentials', async ({ loginPage }) => {
    await loginPage.goto('/login');

    await loginPage.fillForm({ email: 'invalid@test.com', password: 'invalidPassword123!' });
    await loginPage.submitForm();

    await loginPage.hasErrorAlert();
  });
});
