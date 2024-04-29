import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config();

const pagePath =
  process.env.CI == "true"
    ? `file://${process.cwd()}/dist-web/index.html`
    : `http://localhost:5173`;

console.log("Current test page to host: ", pagePath);

test("has title", async ({ page }) => {
  await page.goto(pagePath);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Editor/);

  // Expect a title "to be" exactly a string.
  await expect(page).toHaveTitle("Editor");
});
