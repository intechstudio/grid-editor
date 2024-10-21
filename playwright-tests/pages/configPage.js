import { blocks } from "../data/actionBlockLocators";

export class ConfigPage {
  constructor(page) {
    this.page = page;

    // Common Locators
    this.addActionBlockButton = page.getByText("Add action block...");
    this.selectAllCheckbox = page.locator(".w-fit > .border-white");
    this.noActionAddActionButton = page.getByRole("button", { name: "Add +" });

    this.firstActionBlock = page.locator("#cfg-0");

    // Element Actions
    this.elementButtons = {
      copy: page.locator(".toolbar-button").first(),
      overwrite: page
        .locator("div:nth-child(2) > div > button:nth-child(2)")
        .first(),
      discard: page
        .locator("div:nth-child(2) > div > button:nth-child(3)")
        .first(),
      clear: page
        .locator("div:nth-child(2) > div > button:nth-child(4)")
        .first(),
    };

    // Action Buttons
    this.actionButtons = {
      copy: page
        .locator("div:nth-child(2) > div:nth-child(2) > button")
        .first(),
      paste: page.locator("div:nth-child(2) > button:nth-child(2)"),
      cut: page.locator(
        "div:nth-child(2) > div:nth-child(2) > button:nth-child(3)"
      ),
      merge: page.locator("div:nth-child(2) > button:nth-child(4)"),
      remove: page.locator(
        "div:nth-child(2) > div:nth-child(2) > button:nth-child(5)"
      ),
    };

    this.elementEvent = {
      Setup: page.getByLabel("Setup"),
      Timer: page.getByLabel("Timer"),
      Utility: page.getByLabel("Utility"),
      "Midi rx": page.getByLabel("Midi rx"),
      Button: page.getByLabel("Button"),
      Endless: page.getByLabel("Endless"),
      Potmeter: page.getByLabel("Potmeter"),
      Encoder: page.getByLabel("Encoder"),
    };

    // Blocks Data
    this.blocks = blocks(page);
    this.loopTimesSwitch =
      this.blocks["loop"]["Repeater Loop"]["elements"]["times"];
    this.elementMinMaxButton = page.getByLabel("Enable Min");
    this.elementSensitivity = page.getByLabel("Enable Sensitivity");

    // Code Block Elements
    this.addBlocktoLastSandwichButton = page
      .locator("anim-block")
      .filter({ hasText: "End" })
      .locator("action-placeholder div")
      .first();
    this.commitCodeButton = page.getByRole("button", { name: "Commit" });
    this.closeCodeButton = page.getByRole("button", { name: "Close" });
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

  async writeActionBlockField(category, blockName, field, input) {
    await this.blocks[category][blockName]["elements"][field].fill(input);
  }

  async getActionBlockFieldValue(category, blockName, field) {
    return await this.blocks[category][blockName]["elements"][
      field
    ].inputValue();
  }

  async openLoopTimes() {
    await this.loopTimesSwitch.click();
  }

  async openAddBlockToLastSandwich() {
    await this.addBlocktoLastSandwichButton.click();
  }

  async openActionsInIf() {
    await this.page
      .getByRole("button", { name: "Actions here are triggered" })
      .click();
  }

  async openActionsInElseIf() {
    await this.page
      .getByRole("button", {
        name: "Actions here are triggered when the event runs, the expression above is true,",
      })
      .click();
  }

  async openActionsInElse() {
    await this.page
      .getByRole("button", {
        name: "Actions here are triggered when the event runs, and no others conditions were",
      })
      .click();
  }

  async clickCategoryCheckboxFields(blockName) {
    await this.clickCategoryMinMax();
    if (blockName === "Encoder Mode" || blockName === "Endless Mode") {
      await this.clickCategorySensitivity();
    }
  }

  async clickCategoryMinMax() {
    await this.elementMinMaxButton.click();
  }

  async clickCategorySensitivity() {
    await this.elementSensitivity.click();
  }

  // Element and Action Operations

  async selectAllActions() {
    await this.selectAllCheckbox.click();
  }

  async copyElement() {
    await this.elementButtons.copy.click();
  }

  async overwriteElement() {
    await this.elementButtons.overwrite.click();
  }

  async discardElement() {
    await this.elementButtons.discard.click();
  }

  async clearElement() {
    await this.elementButtons.clear.click();
  }

  async copyAction() {
    await this.actionButtons.copy.click();
  }

  async pasteAction() {
    await this.actionButtons.paste.click();
  }

  async cutAction() {
    await this.actionButtons.cut.click();
  }

  async mergeAction() {
    await this.actionButtons.merge.click();
  }

  async removeAction() {
    await this.actionButtons.remove.click();
  }

  async removeAllActions() {
    await this.selectAllCheckbox.click();
    await this.actionButtons.remove.click();
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

  async addCodeBlock() {
    await this.addActionBlockButton.click();
    await this.blocks["code"]["Code Block"]["block"].click();
  }

  async addAndEditCodeBlock(code) {
    await this.addCodeBlock();
    await this.blocks["code"]["Code Block"]["elements"]["Edit Code"].click();
    await this.page.getByText("Synced with Grid!").click();
    await this.codeblockInput.click({ clickCount: 1 });

    const isMac = process.platform === "darwin";
    const selectAllShortcut = isMac ? "Meta+A" : "Control+A";

    await this.codeblockInput.press(selectAllShortcut);
    await this.page.waitForTimeout(400);
    await this.codeblockInput.type(code);
  }

  async commitCode() {
    await this.commitCodeButton.click();
  }

  async closeCode() {
    await this.closeCodeButton.click();
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
