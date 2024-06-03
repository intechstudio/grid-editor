const { expect } = require("@playwright/test");

export class ModulePage {
  constructor(page) {
    this.page = page;
    this.changeModuleButton = page.getByRole("button", {
      name: "Change Module",
    });
    this.removeModuleButton = page.getByRole("button", {
      name: "Remove Module",
    });
    this.oneModule = page.locator('[id="grid-device-dx\\:0\\;dy\\:0"]');
    this.modules = {
      BU16: page.getByTestId("BU16_dx:0;dy:0"),
      EF44: page.getByTestId("EF44_dx:0;dy:0"),
      EN16: page.getByTestId("EN16_dx:0;dy:0"),
      PBF4: page.getByTestId("PBF4_dx:0;dy:0"),
      PO16: page.getByTestId("PO16_dx:0;dy:0"),
      TEK2: page.getByTestId("TEK2_dx:0;dy:0"),
    };
  }

  async changeModule() {
    await this.changeModuleButton.click();
  }
  async removeModule() {
    await this.removeModuleButton.click();
  }
  async assertModuleAdded(moduleName) {
    await expect(this.modules[moduleName]).toBeVisible();
  }
}
