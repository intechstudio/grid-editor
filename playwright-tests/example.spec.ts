import { test, expect } from "@playwright/test";
import { dirname } from "path";
import dotenv from "dotenv";
dotenv.config();

test("has title", async ({ page }) => {
  console.log(process.env.CI, "whatever: ", process.env.WHATEVER);

  await page.goto(`file://${process.cwd()}/dist-web/index.html`);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Editor/);
});
