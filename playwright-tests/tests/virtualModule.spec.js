import { test, expect } from "@playwright/test";
import { VirtualModulePage } from "../pages/virtualModulePage";
import { PAGE_PATH } from "../utility";

test.beforeEach(({ page }) => {
  // mocks navigator.serial, so headless UI tests can run!
  page.addInitScript("Object.defineProperty(navigator,'serial',{set: () => undefined, get: () => undefined})")
})

test("add bu", async ({ page }) => {
  const VirtualModule = new VirtualModulePage(page);
  console.log("PAGE_PATH", PAGE_PATH);
  await page.goto(PAGE_PATH);
  // await page.goto("https://www.google.com");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshotDIRECT.png", fullPage: true });
  // page.on("console", (msg) => console.log(msg.text()));
  // await expect(page.getByText("Connect your modules!")).toBeVisible();

  // await page.goto("https://grid-editor-web.web.app/");
  await expect(page.getByText("active changes")).toBeVisible();
  await expect(page.getByText("Connect your modules!")).toBeVisible();
  await VirtualModule.openVirtualModules();
  await VirtualModule.selectModule("BU16");
  // await page.pause();
});
