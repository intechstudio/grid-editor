import { test, expect } from "@playwright/test";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";
import { PAGE_PATH } from "../utility";

test.describe("Module Operations", () => {
  let connectModulePage;
  let modulePage;

  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    await page.goto(PAGE_PATH);
  });

  test.afterEach(async ({ page }) => {
    // await page.close();
  });

  test("should add a virtual modules", async () => {
    const moduleNames = ["BU16", "EF44", "EN16", "PBF4", "PO16", "TEK2"];

    for (const moduleName of moduleNames) {
      await connectModulePage.addModule(moduleName);
      await modulePage.assertModuleAdded(moduleName);
    }
  });

  test("should change module", async () => {
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("BU16");
    await modulePage.changeModuleConfiguration("BU16", {
      setting: "new value",
    });
    await modulePage.assertModuleConfiguration("BU16", {
      setting: "new value",
    });
  });

  test("should remove module", async ({ page }) => {
    await connectModulePage.openVirtualModules();
    // await connectModulePage.addModule("BU16");
    // await modulePage.removeModule();
    // await expect(modulePage.module["BU16"]).toBeVisible();
  });
});
