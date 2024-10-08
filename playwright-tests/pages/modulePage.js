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
    };
    this.moduleElement = {
      0: page.locator(".normal-cell-underlay-container > .w-full").first(),
      1: page.locator(
        "cell:nth-child(2) > .normal-cell-underlay-container > .w-full"
      ),
      2: page.locator(
        "cell:nth-child(3) > .normal-cell-underlay-container > .w-full"
      ),
      3: page.locator(
        "cell:nth-child(4) > .normal-cell-underlay-container > .w-full"
      ),
      4: page.locator(
        "cell:nth-child(5) > .normal-cell-underlay-container > .w-full"
      ),
      5: page.locator(
        "cell:nth-child(6) > .normal-cell-underlay-container > .w-full"
      ),
      6: page.locator(
        "cell:nth-child(7) > .normal-cell-underlay-container > .w-full"
      ),
      7: page.locator(
        "cell:nth-child(8) > .normal-cell-underlay-container > .w-full"
      ),
      8: page.locator(
        "cell:nth-child(9) > .normal-cell-underlay-container > .w-full"
      ),
      9: page.locator(
        "cell:nth-child(10) > .normal-cell-underlay-container > .w-full"
      ),
      10: page.locator(
        "cell:nth-child(11) > .normal-cell-underlay-container > .w-full"
      ),
      11: page.locator(
        "cell:nth-child(12) > .normal-cell-underlay-container > .w-full"
      ),
      12: page.locator(
        "cell:nth-child(13) > .normal-cell-underlay-container > .w-full"
      ),
      13: page.locator(
        "cell:nth-child(14) > .normal-cell-underlay-container > .w-full"
      ),
      14: page.locator(
        "cell:nth-child(15) > .normal-cell-underlay-container > .w-full"
      ),
      15: page.locator(
        "cell:nth-child(16) > .normal-cell-underlay-container > .w-full"
      ),
    };
    this.firstModuleSidesAddButton = {
      right: page.locator(
        '[id="grid-device-dx\\:0\\;dy\\:0"] > div:nth-child(2) > .flex'
      ),
      top: page.locator("div:nth-child(4) > .flex").first(),
      left: page.locator(".absolute > .flex").first(),
      bottom: page.locator(
        '[id="grid-device-dx\\:0\\;dy\\:0"] > div:nth-child(3) > .flex'
      ),
    };
    this.modulesFromTheFirstModule = {
      right: page.locator('[id="grid-device-dx\\:1\\;dy\\:0"]'),
      bottom: page.locator('[id="grid-device-dx\\:0\\;dy\\:-1"]'),
      left: page.locator('[id="grid-device-dx\\:-1\\;dy\\:0"]'),
      top: page.locator('[id="grid-device-dx\\:0\\;dy\\:1"]'),
    };
    this.eventCopiedToast = page.getByRole("button", {
      name: "✔️ Events are copied! (Click",
    });

    this.characterLimitPasteToast = page.getByText("Modifications can not");
    this.characterLimitAddToast = page.getByText("Modifications can not");
    this.storeButton = page.getByRole("button", { name: "Store" });
  }

  async storeConfig() {
    await this.storeButton.click();
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
  async openAddModuleToSide(side) {
    const sideLocator = this.firstModuleSidesAddButton[side];
    if (sideLocator) {
      await sideLocator.click();
    } else {
      throw new Error(`Module ${module} not found`);
    }
  }
  async selectModuleElement(number) {
    await this.moduleElement[number].click();
  }
  async rightClickModuleElement(number) {
    await this.moduleElement[number].click({ button: "right" });
  }

  async copyElement() {
    await this.page.getByRole("button", { name: "Copy Element" }).click();
  }
  async overwriteElement() {
    await this.page.getByRole("button", { name: "Overwrite Element" }).click();
  }

  async discardElement() {
    await this.page
      .getByRole("button", { name: "Discard Element Changes" })
      .click();
  }
  async clearElement() {
    await this.page.getByRole("button", { name: "Clear Element" }).click();
  }
}
