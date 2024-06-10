import { blocks } from "../data/actionBlock";

export class ConfigPage {
  constructor(page) {
    this.page = page;
    this.addActionBlockButton = page.getByText("Add action block...");
    this.selectAllCheckbox = page.locator(".w-fit > .border-white");
    this.noActionAddActionButton = page.getByRole("button", {
      name: "Add Action",
    });
    this.removeButton = page.locator(
      "div:nth-child(2) > div:nth-child(2) > button:nth-child(5)"
    );
    this.blocks = blocks(page);
    this.loopTimesSwtich =
      this.blocks["loop"]["Repeater Loop"]["elements"]["times"];
    this.addBlocktoLastSandwitchButton = page
      .locator("anim-block")
      .filter({ hasText: "End" })
      .locator("action-placeholder div")
      .first();
  }

  async openAndAddActionBlock(category, blockName) {
    await this.addActionBlockButton.click();
    await this.blocks[category][blockName]["block"].click();
  }
  async openActionBlockList() {
    await this.addActionBlockButton.click();
  }
  async addActionBlock(category, blockName) {
    await this.blocks[category][blockName]["block"].click();
  }

  async removeAllActions() {
    await this.selectAllCheckbox.click();
    await this.removeButton.click();
  }

  async openLoopTimes() {
    await this.loopTimesSwtich.click();
  }

  async opendAddBlocktoLastSandwitch() {
    await this.addBlocktoLastSandwitchButton.click();
  }
}
