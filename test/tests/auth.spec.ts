import { test, expect } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true,
});

test('register and login', async ({ page }) => {
  const uid = Date.now();
  const username = `user${uid}`;
  const email = `user${uid}@pwnthemall.com`;
  const password = 'TestPassword123';

  //  Register
  await page.goto('https://pwnthemall.local/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: 'Register' }).click();

  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByRole('heading', { name: 'Success' })).toBeVisible();

  // Login
  await page.goto('https://pwnthemall.local/');
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.locator('[id="__next"]')).toContainText(username);
});
