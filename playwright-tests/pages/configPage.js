import { blocks } from "../data/actionBlockLocators";
import KeyboardActions from "../keyboardActions";

export class ConfigPage {
  constructor(page) {
    this.page = page;

    this.keyboardActions = new KeyboardActions(page);

    this.configFocus = page.locator(
      "#app > div.flex.flex-col.w-full.h-full.s-d5Zigoma649a > div > div > div:nth-child(5) > div > div.h-full > div > div > configs > div.flex.flex-row.h-full.w-full.max-h-full.overflow-auto",
    );

    this.eventPanel = page.getByTestId("event-panel");

    // Common Locators
    this.selectAllCheckbox = page.getByTestId("select_all");
    this.addActionBlockButton = page.getByText("Add action block...");
    this.addActionLineFirst = page.locator("add-line").first();
    this.noActionAddActionButton = page.getByRole("button", {
      name: "Add Action",
      exact: true,
    });
    this.minimalistCheckbox = page
      .locator("configs")
      .getByTestId("minimalist_toggle");

    this.firstActionBlock = page.locator("#cfg-0");

    this.actionBlock = page.getByTestId("action-block");

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
      Setup: this.eventPanel.getByLabel("Setup"),
      Timer: this.eventPanel.getByLabel("Timer"),
      Utility: this.eventPanel.getByLabel("Utility"),
      Button: this.eventPanel.getByLabel("Button"),
      Endless: this.eventPanel.getByLabel("Endless"),
      Potmeter: this.eventPanel.getByLabel("Potmeter"),
      Encoder: this.eventPanel.getByLabel("Encoder"),
    };

    // Blocks Data
    this.blocks = blocks(page);
    this.loopTimesSwitch =
      this.blocks["loop"]["Repeater Loop"]["elements"]["times"];
    this.elementMinMaxButton = page.getByLabel("Enable Min");
    this.elementSensitivity = page.getByLabel("Enable Sensitivity");
    this.blockSearch = page.getByRole("textbox");

    // Code Block Elements
    this.codeBlockModalDiscardButton = page.getByRole("button", {
      name: "Discard Changes & Close",
    });
    this.codeBlockModalCancelButton = page.getByRole("button", {
      name: "Cancel",
    });
    this.addBlocktoLastSandwichButton = page
      .getByTestId("action-block")
      .filter({ hasText: "End" })
      .locator("action-placeholder div")
      .first();
    // The code block now has an inline editor with its own Commit button, so
    // scope these to the full-screen editor modal (#monaco-container and its
    // parent, which holds the modal's Commit/Close buttons).
    this.commitCodeButton = page
      .locator("#monaco-container")
      .locator("xpath=..")
      .getByRole("button", { name: "Commit" });
    this.closeCodeButton = page
      .locator("#monaco-container")
      .locator("xpath=..")
      .getByRole("button", { name: "Close" });
    this.codeblockInput = page.locator("#monaco-container .view-line").first();
    this.codeBlockCharacterLimitMessage = page.getByText(
      "Config limit reached.",
    );
    this.characterCount = page.getByTestId("charCount");
    this.elementMaxResolution14Bit = page.getByRole("option", {
      name: "14 bit MIDI",
    });
    this.elementNametextbox = page
      .getByTestId("element-name-input-field")
      .getByRole("textbox");
  }

  async turnOffMinimalistMode() {
    await this.minimalistCheckbox.uncheck();
  }

  async turnOnMinimalistMode() {
    await this.minimalistCheckbox.check();
  }

  async openAndAddActionBlock(category, blockName) {
    await this.resetTransientUi();
    await this.addActionBlockButton.click();
    await this.blocks[category][blockName]["block"].click();
  }

  async openActionBlockList() {
    await this.resetTransientUi();
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

  async getActionBlockFieldValue(category, blockName, field) {
    return await this.blocks[category][blockName]["elements"][
      field
    ].inputValue();
  }

  async getActionBlockField(category, blockName, field) {
    return this.blocks[category][blockName]["elements"][field];
  }

  async getActionBlockMonacoFieldTextContetnt(category, blockName, field) {
    return await this.blocks[category][blockName]["elements"][
      field
    ].textContent();
  }

  async getActionBlock(category, blockName) {
    return await this.blocks[category][blockName]["block"];
  }

  async clickActionBlockElement(category, blockName, field) {
    await this.blocks[category][blockName]["elements"][field].click();
  }

  async openAddBlockToLastSandwich() {
    await this.addBlocktoLastSandwichButton.click();
  }

  async openActionsInIf() {
    await this.noActionAddActionButton.click();
  }

  async openActionsInElseIf() {
    await this.page
      .getByRole("button", { name: "Add Action", exact: true })
      .nth(1)
      .click();
  }

  async openActionsInElse() {
    await this.page
      .getByRole("button", { name: "Add Action", exact: true })
      .nth(2)
      .click();
  }

  async searchBlock(search) {
    this.blockSearch.fill(search);
  }

  // Element and Action Operations

  async selectAllActions() {
    // Focus the config panel itself rather than clicking into the area (which
    // can land in an inline code editor that captures Ctrl+A as select-text),
    // so the select-all-actions shortcut actually fires.
    await this.page.locator(".configpanel").first().focus();
    await this.keyboardActions.selectAll();
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
    // Clearing raises a transient progress toast ("Clearing element
    // configuration..." → "...was reset to default!") that overlays the UI and
    // can intercept the next click — including in a following test, since the
    // page is shared across the spec. Reset it so it can't bleed across.
    await this.resetTransientUi();
  }

  // Reset transient, page-level UI that bleeds across tests on the shared page:
  // notification toasts (which otherwise linger ~5s) via the web build's test
  // hook, and any leftover-open action menu / popover (Escape). Both can
  // overlay and intercept a later click.
  async resetTransientUi() {
    await this.page
      .evaluate(() => window.__gridTest?.resetLogStream?.())
      .catch(() => {});
    // Close any leftover-open action menu. Its search input is auto-focused and
    // swallows Escape, so blur first to let the key reach the menu's
    // document-level Escape handler.
    await this.page.evaluate(() => document.activeElement?.blur());
    await this.page.keyboard.press("Escape");
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
    await this.selectAllActions();
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
        comment,
      );
    }
  }

  async addCodeBlock() {
    await this.addActionBlockButton.click();
    await this.blocks["code"]["Code Block"]["block"].click();
  }

  async addAndEditCodeBlock(code) {
    await this.addCodeBlock();
    await this.blocks["code"]["Code Block"]["elements"]["Open Editor"].click();
    // Both the inline block and the modal show this status, so target one.
    await this.page.getByText("Synced with Grid!").first().click();
    await this.codeblockInput.click({ clickCount: 1 });

    await this.keyboardActions.selectAll();

    await this.codeblockInput.type(code);
  }

  async commitCode() {
    await this.commitCodeButton.click();
  }

  async closeCode() {
    await this.closeCodeButton.click();
  }

  async codeBlockModalDiscard() {
    await this.codeBlockModalDiscardButton.click();
  }

  async codeBlockModalCancel() {
    await this.codeBlockModalCancelButton.click();
  }

  async getTextFromComment() {
    return await this.blocks["code"]["Comment Block"]["elements"][
      "input"
    ].inputValue();
  }

  async getTextFromCode() {
    return await this.blocks["code"]["Code Block"]["elements"][
      "input"
    ].textContent();
  }

  async getTextFromNameBlock() {
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

  async fillElementName(name) {
    await this.elementNametextbox.fill(name);
  }

  async getElementNameFromMainTextbox() {
    return await this.elementNametextbox.inputValue();
  }
}
