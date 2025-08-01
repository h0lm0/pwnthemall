import { test, expect } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true,
});

test('Docker instance management', async ({ page }) => {
  const uid = Date.now();
  const username = `user${uid}`;
  const email = `user${uid}@pwnthemall.com`;
  const password = 'TestPassword123';
  const teamName = `Team-${uid}`;

  // Register new user
  await page.goto('https://pwnthemall.local/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: 'Register' }).click();

  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Register' }).click();

  // Wait for registration success toast
  await expect(page.getByText(/registration successful/i)).toBeVisible();

  // Login
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for login and check we're logged in
  await expect(page.locator('[id="__next"]')).toContainText(username);

  // Create team
  await page.getByRole('button', { name: /create a team/i }).click();
  await page.getByRole('textbox', { name: /team name/i }).fill(teamName);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /create/i }).click();

  // Wait for team creation success
  await expect(page.getByText(/team created successfully/i)).toBeVisible();

  // Navigate to challenges
  await page.getByRole('link', { name: /pwn/i }).click();

  // Look for a Docker challenge
  const dockerChallenge = page.locator('.card', { hasText: /docker/i }).first();
  
  if (await dockerChallenge.count() > 0) {
    // Click on the Docker challenge
    await dockerChallenge.click();

    // Check if the instance tab is visible
    await expect(page.getByRole('tab', { name: /docker instance/i })).toBeVisible();

    // Click on the instance tab
    await page.getByRole('tab', { name: /docker instance/i }).click();

    // Check that the instance status shows as stopped initially
    await expect(page.getByText(/stopped/i)).toBeVisible();

    // Click start instance button
    const startButton = page.getByRole('button', { name: /start instance/i });
    if (await startButton.isVisible()) {
      await startButton.click();

      // Wait for the instance to start (should show building then running)
      await expect(page.getByText(/building/i)).toBeVisible();
      
      // Wait for running status (this might take some time)
      await expect(page.getByText(/running/i)).toBeVisible({ timeout: 60000 });

      // Check that stop button is now visible
      await expect(page.getByRole('button', { name: /stop instance/i })).toBeVisible();

      // Stop the instance
      await page.getByRole('button', { name: /stop instance/i }).click();

      // Wait for the instance to stop
      await expect(page.getByText(/stopped/i)).toBeVisible({ timeout: 30000 });
    } else {
      console.log('Start instance button not visible - may already have an instance running');
    }
  } else {
    console.log('No Docker challenges found in the current category');
    
    // Try to find Docker challenges in other categories
    const categories = page.locator('a[href*="/pwn/"]');
    for (let i = 0; i < await categories.count(); i++) {
      const category = categories.nth(i);
      const categoryName = await category.textContent();
      
      if (categoryName && !categoryName.toLowerCase().includes('docker')) {
        await category.click();
        
        const dockerChallenge = page.locator('.card', { hasText: /docker/i }).first();
        if (await dockerChallenge.count() > 0) {
          console.log(`Found Docker challenge in category: ${categoryName}`);
          break;
        }
      }
    }
  }
});

test('Docker instance limits', async ({ page }) => {
  const uid = Date.now();
  const username = `user${uid}`;
  const email = `user${uid}@pwnthemall.com`;
  const password = 'TestPassword123';
  const teamName = `Team-${uid}`;

  // Register and login
  await page.goto('https://pwnthemall.local/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: 'Register' }).click();

  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByText(/registration successful/i)).toBeVisible();

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.locator('[id="__next"]')).toContainText(username);

  // Create team
  await page.getByRole('button', { name: /create a team/i }).click();
  await page.getByRole('textbox', { name: /team name/i }).fill(teamName);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /create/i }).click();

  await expect(page.getByText(/team created successfully/i)).toBeVisible();

  // Navigate to challenges
  await page.getByRole('link', { name: /pwn/i }).click();

  // Find Docker challenges
  const dockerChallenges = page.locator('.card', { hasText: /docker/i });
  
  if (await dockerChallenges.count() >= 2) {
    // Try to start multiple instances
    for (let i = 0; i < Math.min(await dockerChallenges.count(), 3); i++) {
      const challenge = dockerChallenges.nth(i);
      await challenge.click();

      // Check if instance tab is available
      const instanceTab = page.getByRole('tab', { name: /docker instance/i });
      if (await instanceTab.isVisible()) {
        await instanceTab.click();

        const startButton = page.getByRole('button', { name: /start instance/i });
        if (await startButton.isVisible()) {
          await startButton.click();
          
          // Wait a bit for the request to process
          await page.waitForTimeout(2000);
          
          // Check if we get an error about instance limits
          const errorToast = page.locator('.toast', { hasText: /max.*instances/i });
          if (await errorToast.isVisible()) {
            console.log('Instance limit reached as expected');
            break;
          }
        }
      }
      
      // Go back to challenges list
      await page.getByRole('link', { name: /pwn/i }).click();
    }
  }
}); 