import { test, expect } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true,
});

// Utilitaire pour cliquer sur le bouton cookie si présent
async function acceptCookiesIfPresent(page) {
  const acceptBtn = page.locator('button.bg-primary');
  if (await acceptBtn.count() > 0) {
    await acceptBtn.first().click();
  }
}

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

test('Create admin user + check if the user is admin', async ({ page }) => {
  const uid = Date.now();
  const adminEmail = 'admin';
  const adminPassword = 'admin'; // À adapter selon le mot de passe admin réel
  const username = `user${uid}`;
  const email = `user${uid}@pwnthemall.com`;
  const password = 'TestPassword123';

  // Login as admin
  await page.goto('https://pwnthemall.local/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: /login/i }).click();
  await page.getByRole('textbox', { name: /email/i }).fill(adminEmail);
  await page.getByRole('textbox', { name: /password/i }).fill(adminPassword);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText('admin');

  // Déplier le menu Administration si besoin
  await page.getByRole('button', { name: /administration/i }).click();
  // Aller sur Users
  await page.getByRole('link', { name: /users/i }).click();

  // Créer un nouvel utilisateur
  await page.getByRole('button', { name: /new user/i }).click();
  await page.getByRole('textbox', { name: /username/i }).fill(username);
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  // Ouvrir le dropdown de rôle (robuste)
  await page.getByText('Select a role', { exact: true }).click();
  // Sélectionner le rôle voulu (admin) dans la liste déroulante
  await page.locator('[role="option"]', { hasText: /^Admin$/ }).click();
  await page.getByRole('button', { name: /create user/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText(username);

  // Logout (méthode fiable : appel direct à l'API)
  await page.request.post('https://pwnthemall.local/api/logout');
  await page.goto('https://pwnthemall.local/login');
  await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
  // Ancienne méthode UI (pour référence)
  // await page.locator('div.relative:has(img)').first().click();
  // await page.getByText('Logout', { exact: true }).click();
  // await page.locator('button.bg-primary').click();

  // Login as created user
  await page.getByRole('link', { name: /login/i }).click();
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText(username);

  // Vérifie que le nouvel utilisateur n'a PAS accès à l'admin
  const adminPages = [
    '/admin/dashboard',
    '/admin/users',
    '/admin/challenge-categories',
  ];
  for (const adminPage of adminPages) {
    await page.goto(`https://pwnthemall.local${adminPage}`);
    // Vérifie qu'on est redirigé ou qu'un message d'accès refusé s'affiche
    // (adapter selon le comportement réel de l'app)
    await expect(
      page.locator('body')
    ).not.toContainText(["admin zone", "users", "challenge categories"]);
    // Optionnel : vérifier la présence d'un message d'erreur ou d'une redirection
    // await expect(page).toHaveURL(/\/pwn|\/login/);
  }
});

test('Create, delete and check if its really deteted', async ({ page }) => {
  const uid = Date.now();
  const username = `user${uid}`;
  const email = `user${uid}@pwnthemall.com`;
  const password = 'TestPassword123';
  const adminEmail = 'admin';
  const adminPassword = 'admin';

  // Register new user
  await page.goto('https://pwnthemall.local/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: /register/i }).click();
  await page.getByRole('textbox', { name: /username/i }).fill(username);
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /register/i }).click();
  await expect(page.getByRole('heading', { name: /success/i })).toBeVisible();

  // Logout (API)
  await page.request.post('https://pwnthemall.local/api/logout');
  await page.goto('https://pwnthemall.local/login');

  // Login as new user
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText(username);

  // Logout (API)
  await page.request.post('https://pwnthemall.local/api/logout');
  await page.goto('https://pwnthemall.local/login');

  // Login as admin
  await page.getByRole('textbox', { name: /email/i }).fill(adminEmail);
  await page.getByRole('textbox', { name: /password/i }).fill(adminPassword);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText('admin');

  // Go to /admin/users
  // Déplier le menu Administration si besoin
  await page.getByRole('button', { name: /administration/i }).click();
  await page.getByRole('link', { name: /users/i }).click();
  // Trouver la ligne du nouvel utilisateur et cliquer sur le bouton delete
  const userRow = page.locator('tr', { hasText: username });
  await userRow.getByRole('button', { name: /delete/i }).click();
  // Confirmer la suppression si une modale apparaît
  const confirmDelete = page.getByRole('button', { name: /delete/i });
  if (await confirmDelete.isVisible()) {
    await confirmDelete.click();
  }
  // Vérifier que l'utilisateur n'est plus dans la liste
  await expect(page.getByText(username)).not.toBeVisible();

  // Logout (API)
  await page.request.post('https://pwnthemall.local/api/logout');
  await page.goto('https://pwnthemall.local/login');

  // Tenter de se reconnecter avec l'utilisateur supprimé
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  // Vérifier qu'un message d'erreur s'affiche ou qu'on reste sur la page de login
  await expect(page.getByText(/invalid credentials/i)).toBeVisible();
});

test('Member to admin upgrade', async ({ page }) => {
  const uid = Date.now();
  const username = `user${uid}`;
  const email = `user${uid}@pwnthemall.com`;
  const password = 'TestPassword123';
  const adminEmail = 'admin';
  const adminPassword = 'admin';

  // new user
  await page.goto('https://pwnthemall.local/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: /register/i }).click();
  await page.getByRole('textbox', { name: /username/i }).fill(username);
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /register/i }).click();
  await expect(page.getByRole('heading', { name: /success/i })).toBeVisible();

  // Logout
  await page.request.post('https://pwnthemall.local/api/logout');
  await page.goto('https://pwnthemall.local/login');

  // Login as new user
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText(username);

  // Vérifie l'absence du menu Administration dans la sidebar
  await expect(page.getByText(/administration/i)).not.toBeVisible();

  // Logout 
  await page.request.post('https://pwnthemall.local/api/logout');
  await page.goto('https://pwnthemall.local/login');

  // Login as admin
  await page.getByRole('textbox', { name: /email/i }).fill(adminEmail);
  await page.getByRole('textbox', { name: /password/i }).fill(adminPassword);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText('admin');

  // /admin/users
  await page.getByRole('button', { name: /administration/i }).click();
  await page.getByRole('link', { name: /users/i }).click();
  // Trouver la ligne du nouvel utilisateur et cliquer sur Edit
  const userRow = page.locator('tr', { hasText: username });
  await userRow.getByRole('button', { name: /edit/i }).click();
  // Dans le formulaire d'édition, changer le rôle en admin
  await page.getByLabel('Role').click();
  await page.locator('[role="option"]', { hasText: /^Admin$/ }).click();
  await page.getByRole('button', { name: /update user/i }).click();
  // Vérifier que le rôle est bien passé à admin dans la liste
  await expect(userRow).toContainText('admin');

  // Logout
  await page.request.post('https://pwnthemall.local/api/logout');
  await page.goto('https://pwnthemall.local/login');

  // Login as the user (devenu admin)
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText(username);

  // Vérifie la présence du menu Administration dans la sidebar
  await expect(page.getByText(/administration/i)).toBeVisible();

  // Vérifie l'accès aux pages admin
  const adminPageChecks = [
    { url: '/admin/dashboard', text: /dashboard/i },
    { url: '/admin/users', text: /users/i },
    { url: '/admin/challenge-categories', text: /challenge categories/i },
  ];
  for (const { url, text } of adminPageChecks) {
    await page.goto(`https://pwnthemall.local${url}`);
    await expect(page.locator('body')).toContainText(text);
  }
});

test('Change password and relog using the new password', async ({ page }) => {
  const uid = Date.now();
  const username = `user${uid}`;
  const email = `user${uid}@pwnthemall.com`;
  const oldPassword = 'TestPassword123!';
  const newPassword = 'NewPassword456!';

  // Register new user
  await page.goto('https://pwnthemall.local/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: /register/i }).click();
  await page.getByRole('textbox', { name: /username/i }).fill(username);
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(oldPassword);
  await page.getByRole('button', { name: /register/i }).click();
  await expect(page.getByRole('heading', { name: /success/i })).toBeVisible();

  // Logout (API)
  await page.request.post('https://pwnthemall.local/api/logout');
  await page.goto('https://pwnthemall.local/login');

  // Login as new user
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(oldPassword);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText(username);

  // Aller dans le profil (navigation directe)
  await page.goto('https://pwnthemall.local/profile');
  // Cliquer sur le bouton 'Security'
  await page.getByRole('button', { name: /security/i }).click();
  // Remplir le formulaire de changement de mot de passe
  await page.getByLabel(/current password|current/i).fill(oldPassword);
  await page.getByLabel(/new password|new/i).fill(newPassword);
  // Cliquer sur le bouton 'Change Password' avant 'Confirm'
  await page.getByRole('button', { name: /change password/i }).click();
  // Cliquer sur le bouton 'Confirm' après avoir changé le mot de passe
  await page.getByRole('button', { name: /confirm/i }).click();
  // Vérifier le succès
  await expect(page.locator('body')).toContainText(/password updated|success/i);

  // Logout (API)
  await page.request.post('https://pwnthemall.local/api/logout');
  await page.goto('https://pwnthemall.local/login');

  // Login avec le nouveau mot de passe
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(newPassword);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText(username);
});

test('Deleting your own account', async ({ page }) => {
  const uid = Date.now();
  const username = `user${uid}`;
  const email = `user${uid}@pwnthemall.com`;
  const password = 'TestPassword123!';

  // Register new user
  await page.goto('https://pwnthemall.local/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: /register/i }).click();
  await page.getByRole('textbox', { name: /username/i }).fill(username);
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /register/i }).click();
  await expect(page.getByRole('heading', { name: /success/i })).toBeVisible();

  // Login as new user
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('[id="__next"]')).toContainText(username);

  // Aller dans le profil (navigation directe)
  await page.goto('https://pwnthemall.local/profile');
  // Cliquer sur le bouton 'Delete Account'
  await page.getByRole('button', { name: /delete account/i }).click();
  // Confirmer la suppression avec le bouton 'Delete'
  await page.getByRole('button', { name: /^delete$/i }).click();
  // Vérifier qu'on est redirigé ou qu'un message de succès s'affiche (optionnel)
  await expect(page).toHaveURL(/login/);

  // Tenter de se reconnecter avec ce compte (doit échouer)
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.getByText(/invalid credentials/i)).toBeVisible();
});
