import { expect, test } from '@playwright/test';

test('sin sesión, la raíz lleva al login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('h1')).toContainText('Mis Finanzas');
});
