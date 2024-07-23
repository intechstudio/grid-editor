import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://grid-editor-web.web.app/');
  await page.getByRole('button', { name: 'Add Virtual Module' }).click();
  await page.locator('div:nth-child(2) > div > .border').first().click();
  await page.getByRole('button', { name: 'Add Module' }).click();
  await page.locator('.w-fit > .border-white').click();
  await page.locator('div:nth-child(2) > div:nth-child(2) > button:nth-child(5)').click();
  await page.getByText('Add action block...').click();
  await page.getByText('Comment Block').click();
});