import { test, expect } from "@playwright/test";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";
import { PAGE_PATH } from "../utility";

test.describe("Modules", () => {
  let connectModulePage;
  let modulePage;

  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    await page.goto(PAGE_PATH);
  });

  test.afterEach(async () => {
    await modulePage.removeModule();
  });

  const moduleNames = ["BU16", "EF44", "EN16", "PBF4", "PO16", "TEK2"];
  for (const moduleName of moduleNames) {
    test(`should add a ${moduleName}`, async () => {
      await connectModulePage.openVirtualModules();
      await connectModulePage.addModule(moduleName);
      await expect(modulePage.modules[moduleName]).toBeVisible();
    });
  }
});

test.describe("Module Operations", () => {
  let connectModulePage;
  let modulePage;

  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    await page.goto(PAGE_PATH);
  });

  test("should change module", async () => {
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("BU16");
    await modulePage.changeModule();
    await connectModulePage.addModule("TEK2");
    await expect(modulePage.modules["TEK2"]).toBeVisible();
  });

  test("should remove module", async ({ page }) => {
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("BU16");
    await modulePage.removeModule();
    await expect(modulePage.modules["BU16"]).toBeHidden();
  });
});
