import { blocks } from "../data/actionBlock";

export class ConfigPage {
  constructor(page) {
    this.page = page;
    this.addActionBlockButton = page.getByText("Add action block...");
    this.blocks = blocks(page);
  }

  async addActionBlock(category, blockName) {
    await this.addActionBlockButton.click();
    await this.blocks[category][blockName].click();
  }
  async openAddActionBlock() {
    await this.addActionBlockButton.click();
  }
}
