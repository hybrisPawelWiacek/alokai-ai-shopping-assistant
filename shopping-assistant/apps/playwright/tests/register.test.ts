import { test } from '@setup/test';

test.describe('RegisterPage', () => {
  test('should render form', async ({ isB2B, registerPage }) => {
    test.skip(isB2B);

    await registerPage.goto('/register');
    await registerPage.hasProperLayout();
  });

  test('should register user without newsletter check', async ({ isB2B, registerPage }) => {
    test.skip(isB2B);

    await registerPage.goto('/register');

    await registerPage.fillRegisterForm();
    await registerPage.submitForm();

    await registerPage.hasModalOpened();

    await registerPage.clickModalButton();

    await registerPage.hasURLChangedTo('/');
  });

  test('should register user with newsletter check', async ({ isB2B, registerPage }) => {
    test.skip(isB2B);

    await registerPage.goto('/register');

    await registerPage.fillRegisterForm();
    await registerPage.fillNewsletterCheckbox();
    await registerPage.submitForm();

    await registerPage.hasModalOpened();

    await registerPage.clickModalButton();

    await registerPage.hasURLChangedTo('/');
  });
});
