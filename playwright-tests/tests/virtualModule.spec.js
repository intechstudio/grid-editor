import { test, expect } from "@playwright/test";
import { VirtualModulePage } from "../pages/virtualModulePage";
import { PAGE_PATH } from "../utility";

test("add bu", async ({ page }) => {
  const VirtualModule = new VirtualModulePage(page);

  await page.goto(PAGE_PATH);

  await VirtualModule.openVirtualModules();
  await VirtualModule.selectModule("BU16");
  await page.pause();
});
