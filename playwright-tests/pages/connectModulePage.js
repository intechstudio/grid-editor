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
      TEK0: page.getByTestId("TEK0"),
      VSN1: page.getByTestId("VSN1"),
      VSN1R: page.getByTestId("VSN1R"),
      VSN2: page.getByTestId("VSN2"),
    };
  }

  async openVirtualModules() {
    await this.virtualModuleButton.click();
  }

  async selectModule(module) {
    const moduleLocator = this.modules[module];
    if (moduleLocator) {
      await moduleLocator.click();
    } else {
      throw new Error(`Module ${module} not found`);
    }
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
}
