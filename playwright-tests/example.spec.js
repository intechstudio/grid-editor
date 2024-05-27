import { test, expect } from "@playwright/test";
import { PAGE_PATH } from "./utility";

test("has title", async ({ page }) => {
  await page.goto(PAGE_PATH);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Editor/);

  // Expect a title "to be" exactly a string.
  await expect(page).toHaveTitle("Editor");
});
