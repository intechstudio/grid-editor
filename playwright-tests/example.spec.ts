import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config();

const pagePath =
  process.env.CI == "true"
    ? `file://${process.cwd()}/dist-web/index.html`
    : `http://localhost:5173`;

test("has title", async ({ page }) => {
  console.log("Current working directory: ", process.cwd());

  console.log("CI: ", pagePath);

  await page.goto(pagePath);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle("Editor");
  // should fail
  await expect(page).toHaveTitle("Editorrrrr");
});
