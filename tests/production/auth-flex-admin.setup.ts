import { test as setup } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { USERS } from './test-data/form-data';

const authFile = 'playwright/.auth/flex-admin.json';

setup('authenticate as Flex_Admin', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.login(
    USERS.Flex_Admin.username,
    USERS.Flex_Admin.password
  );

  await loginPage.verifyLoginSuccess();

  // Save authenticated state
  await page.context().storageState({ path: authFile });

  console.log(`✅ Flex_Admin authenticated and state saved to ${authFile}`);
});
