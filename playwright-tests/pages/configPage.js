import { blocks } from "../data/actionBlock";

export class ConfigPage {
  constructor(page) {
    this.page = page;
    this.addActionBlockButton = page.getByText("Add action block...");
    this.selectAllCheckbox = page.locator(".w-fit > .border-white");
    this.noActionAddActionButton = page.getByRole("button", {
      name: "Add Action",
    });

    this.firstActionBlock = page.locator("#cfg-0");
    //Element Actions
    this.copyElementButton = page.locator(".toolbar-button").first();
    this.overwriteElementButton = page
      .locator("div:nth-child(2) > div > button:nth-child(2)")
      .first();
    this.discradElementButton = page
      .locator("div:nth-child(2) > div > button:nth-child(3)")
      .first();
    this.clearElementButton = page
      .locator("div:nth-child(2) > div > button:nth-child(4)")
      .first();
    // Actions
    this.copyActionButton = page
      .locator("div:nth-child(2) > div:nth-child(2) > button")
      .first();
    this.paseActionButton = page.locator(
      "div:nth-child(2) > button:nth-child(2)"
    );
    this.cutActionButton = page.locator(
      "div:nth-child(2) > div:nth-child(2) > button:nth-child(3)"
    );
    this.mergeActionButton = page.locator(
      "div:nth-child(2) > button:nth-child(4)"
    );
    this.removeActionButton = page.locator(
      "div:nth-child(2) > div:nth-child(2) > button:nth-child(5)"
    );

    this.elementEvent = {
      Init: page.getByLabel("Init"),
      Timer: page.getByLabel("Timer"),
      Utility: page.getByLabel("Utility"),
      "Midi rx": page.getByLabel("Midi rx"),
      Button: page.getByLabel("Button"),
      Endless: page.getByLabel("Endless"),
      Potmeter: page.getByLabel("Potmeter"),
      Encoder: page.getByLabel("Encoder"),
    };

    this.elementInitButton = page.getByLabel("Init");
    this.elementButtonButton = page.getByLabel("Button");
    this.elementEndlessButton = page.getByLabel("Endless");
    this.elementTimerButton = page.getByLabel("Timer");
    // blocks DATA
    this.blocks = blocks(page);
    this.loopTimesSwtich =
      this.blocks["loop"]["Repeater Loop"]["elements"]["times"];
    this.addBlocktoLastSandwitchButton = page
      .locator("anim-block")
      .filter({ hasText: "End" })
      .locator("action-placeholder div")
      .first();
    this.commitCodeButton = page.getByRole("button", { name: "Commit" });
    this.codeblockInput = page.locator(".view-line").first();
    this.codeBlockCharacterLimitMessage = page.getByText(
      "Config limit reached."
    );
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

  async openLoopTimes() {
    await this.loopTimesSwtich.click();
  }

  async opendAddBlocktoLastSandwitch() {
    await this.addBlocktoLastSandwitchButton.click();
  }

  // Element and Action Operations

  async selectAllActions() {
    await this.selectAllCheckbox.click();
  }

  async copyElement() {
    await this.copyElementButton.click();
  }
  async overwriteElement() {
    await this.overwriteElementButton.click();
  }
  async discardElement() {
    await this.discradElementButton.click();
  }
  async clearElement() {
    await this.clearElementButton.click();
  }

  async copyAction() {
    await this.copyActionButton.click();
  }
  async pasteAction() {
    await this.paseActionButton.click();
  }
  async cutAction() {
    await this.cutActionButton.click();
  }
  async mergeAction() {
    await this.mergeActionButton.click();
  }

  async removeAction() {
    await this.removeActionButton.click();
  }

  async removeAllActions() {
    await this.selectAllCheckbox.click();
    await this.removeActionButton.click();
  }

  async selectElementEvent(event) {
    await this.elementEvent[event].click();
  }

  async addCommentBlock(comment) {
    await this.addActionBlockButton.click();
    await this.blocks["code"]["Comment Block"]["block"].click();
    if (comment) {
      await this.blocks["code"]["Comment Block"]["elements"]["input"].fill(
        comment
      );
    }
  }

  async addAndEditCodeBlock(code) {
    await this.addActionBlockButton.click();
    await await this.blocks["code"]["Code Block"]["block"].click();
    await this.blocks["code"]["Code Block"]["elements"]["Edit Code"].click();
    await this.page.getByText("Synced with Grid!").click();
    await this.codeblockInput.click({ clickCount: 1 });

    const isMac = process.platform === "darwin";

    if (isMac) {
      await this.codeblockInput.press("Meta+A");
    } else {
      await this.codeblockInput.press("Control+A");
    }

    await this.page.waitForTimeout(400);
    // await this.page.locator(".view-line").first().press("Backspace");
    await this.codeblockInput.type(code);
  }

  async commitCode() {
    await this.commitCodeButton.click();
  }
  async getTextFromComment() {
    return await this.blocks["code"]["Comment Block"]["elements"]["input"];
  }

  async getTextFromCode() {
    return await this.blocks["code"]["Code Block"]["elements"]["input"];
  }

  async openFirstActionBlock() {
    await this.firstActionBlock.click();
  }
}
