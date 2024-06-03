export class ConnectModulePage {
  constructor(page) {
    this.page = page;
    this.virtualModuleButton = page.getByRole("button", {
      name: "Add Virtual Module",
    });
    this.addModuleButton = page.getByRole("button", { name: "Add Module" });
    this.modules = {
      BU16: page.getByTestId("BU16"),
      EF44: page.getByTestId("EF44"),
      EN16: page.getByTestId("EN16"),
      PBF4: page.getByTestId("PBF4"),
      PO16: page.getByTestId("PO16"),
      TEK2: page.getByTestId("TEK2"),
    };
  }

  async openVirtualModules() {
    await this.virtualModuleButton.click();
  }

  async addModule(module) {
    const moduleLocator = this.modules[module];
    if (moduleLocator) {
      await moduleLocator.click();
      await this.addModuleButton.click();
    } else {
      throw new Error(`Module ${module} not found`);
    }
  }

  // constructor(page) {
  //   this.page = page;
  //   this.addModuleButton = page.locator("button#add-module"); // Adjust the selector
  //   this.moduleNameInput = page.locator("input#module-name"); // Adjust the selector
  //   this.saveModuleButton = page.locator("button#save-module"); // Adjust the selector
  //   this.moduleList = page.locator("div.module-list"); // Adjust the selector
  //   this.virtualModulesButton = page.locator("button#virtual-modules"); // Adjust the selector
  //   this.moduleSelect = page.locator("select#module-select"); // Adjust the selector
  // }

  // async openVirtualModules() {
  //   await this.virtualModulesButton.click();
  // }

  // async selectModule(moduleName) {
  //   await this.moduleSelect.selectOption({ label: moduleName });
  // }

  // async addVirtualModule(moduleName) {
  //   await this.addModuleButton.click();
  //   await this.moduleNameInput.fill(moduleName);
  //   await this.saveModuleButton.click();
  // }

  // async assertModuleAdded(moduleName) {
  //   await expect(this.moduleList).toContainText(moduleName);
  // }
}
