export class VirtualModulePage {
  constructor(page) {
    this.page = page;
    this.virtual_module_button = page.getByRole("button", {
      name: "Add Virtual Module",
    });
    this.bu16 = page.locator(".border").first();
    this.add_module_button = page.getByRole("button", { name: "Add Module" });
  }

  async openVirtualModules() {
    await this.virtual_module_button.waitFor({ state: "visible" });
    await this.virtual_module_button.click();
  }
  async selectModule(module) {
    if ((module = "BU16")) {
      await this.bu16.click();
    }
    await this.add_module_button.click();
  }
}
