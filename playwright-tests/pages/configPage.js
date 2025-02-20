import { blocks } from "../data/actionBlockLocators";

export class ConfigPage {
  constructor(page) {
    this.page = page;

    // Common Locators
    this.selectAllCheckbox = page.getByTestId("select_all");
    this.addActionBlockButton = page.getByText("Add action block...");
    this.addActionLineFirst = page.locator("add-line").first();
    this.noActionAddActionButton = page.getByRole("button", { name: "Add +" });

    this.firstActionBlock = page.locator("#cfg-0");

    // Element Actions
    this.elementButtons = {
      copy: page.getByTestId("copy_all"),
      overwrite: page.getByTestId("paste_all"),
      discard: page.getByTestId("discard_changes"),
      clear: page.getByTestId("clear_element"),
    };

    // Action Buttons
    this.actionButtons = {
      copy: page.getByTestId("copy_action"),
      paste: page.getByTestId("paste_action"),
      cut: page.getByTestId("cut_action"),
      merge: page.getByTestId("merge_code"),
      remove: page.getByTestId("remove_action"),
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
    this.blockSearch = page.getByRole("textbox");

    // Code Block Elements
    this.addBlocktoLastSandwichButton = page
      .getByTestId("action-block")
      .filter({ hasText: "End" })
      .locator("action-placeholder div")
      .first();
    this.commitCodeButton = page.getByRole("button", { name: "Commit" });
    this.closeCodeButton = page.getByRole("button", { name: "Close" });
    this.codeblockInput = page.locator(".view-line").first();
    this.codeBlockCharacterLimitMessage = page.getByText(
      "Config limit reached."
    );
    this.characterCount = page.getByTestId("charCount");
    this.elementMaxResolution14Bit = page.getByRole("option", {
      name: "14 bit MIDI",
    });
  }

  async openAndAddActionBlock(category, blockName) {
    await this.addActionBlockButton.click();
    await this.blocks[category][blockName]["block"].click();
  }

  async openActionBlockList() {
    await this.addActionBlockButton.click();
  }

  async openActionsOnEmptyElement() {
    await this.noActionAddActionButton.click();
  }

  async addActionBlockToTop(category, blockName) {
    await this.addActionLineFirst.click();
    await this.blocks[category][blockName]["block"].click();
  }

  async addActionBlock(category, blockName) {
    await this.blocks[category][blockName]["block"].click();
  }

  async writeActionBlockField(category, blockName, field, input) {
    await this.blocks[category][blockName]["elements"][field].fill(input);
  }

  async clickActionBlockElement(category, blockName, field) {
    await this.blocks[category][blockName]["elements"][field].click();
  }

  async getActionBlockFieldValue(category, blockName, field) {
    return await this.blocks[category][blockName]["elements"][
      field
    ].inputValue();
  }

  async getActionBlockField(category, blockName, field) {
    return this.blocks[category][blockName]["elements"][field];
  }

  async getActionBlock(category, blockName) {
    return await this.blocks[category][blockName]["block"];
  }

  async clickActionBlockElement(category, blockName, field) {
    await this.blocks[category][blockName]["elements"][field].click();
  }

  async openLoopTimes() {
    await this.loopTimesSwitch.click();
  }

  async openAddBlockToLastSandwich() {
    await this.addBlocktoLastSandwichButton.click();
  }

  async openActionsInIf() {
    await this.noActionAddActionButton.click();
  }

  async openActionsInElseIf() {
    await this.page.getByRole("button", { name: "Add +" }).nth(1).click();
  }

  async openActionsInElse() {
    await this.page.getByRole("button", { name: "Add +" }).nth(2).click();
  }

  async clickCategoryCheckboxFields(blockName) {
    await this.clickCategoryMinMax();
    if (blockName === "Encoder Mode" || blockName === "Endless Mode") {
      await this.clickCategorySensitivity();
    }
  }

  async searchBlock(search) {
    this.blockSearch.fill(search);
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
    return await this.blocks["code"]["Comment Block"]["elements"][
      "input"
    ].inputValue();
  }

  async getTextFromCode() {
    return await this.blocks["code"]["Code Block"]["elements"]["input"];
  }

  async getTextFromName() {
    return await this.blocks["code"]["Element Name"]["elements"][
      "input"
    ].inputValue();
  }

  async clickActionBlock(index) {
    await this.page.locator(`#cfg-${index}`).click();
  }

  async getCharacterCount() {
    const text = await this.characterCount.innerText();
    const match = text.match(/^(\d+)/);
    return match[1];
  }
}
