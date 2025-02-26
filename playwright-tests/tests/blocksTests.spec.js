import { test, expect } from "@playwright/test";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";
import { PAGE_PATH, mockNavigatorSerial, getRandomInt } from "../utility";
import { ConfigPage } from "../pages/configPage";
import KeyboardActions from "../keyboardActions";

let connectModulePage;
let modulePage;
let configPage;
let keyboardActions;

test.beforeEach(async ({ page }) => {
  await mockNavigatorSerial(page);
});

test.describe("Issues", () => {
  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    configPage = new ConfigPage(page);
    await page.goto(PAGE_PATH);
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("BU16");
  });

  // https://github.com/intechstudio/grid-editor/issues/751
  test("code jump back ", async ({ page }) => {
    const text = "print('deleted block')";
    const expectedText = "hello";
    await configPage.removeAllActions();
    await configPage.addAndEditCodeBlock(text);
    await configPage.commitCode();
    await configPage.closeCode();
    await configPage.selectElementEvent("Setup");
    await configPage.addCodeBlock();
    await configPage.selectAllActions();
    await page
      .getByTestId("action-block")
      .filter({ hasText: 'Code preview: print("hello")' })
      .getByRole("button")
      .nth(2)
      .click(); //uncheck codeblock
    await configPage.removeAction();

    const preText = await page.locator("#cfg-0").getByText(expectedText); // should find codeblock with hello
    await expect(preText).toBeVisible();

    //TODO refactor, with contains(), it slow now
  });
  test("MIDI NRPN showes the converted value after switch element", async ({
    page,
  }) => {
    const expectedValue = (await getRandomInt(127)).toString();
    await configPage.removeAllActions();
    await configPage.openAndAddActionBlock("midi", "MIDI NRPN");
    await configPage.writeActionBlockField(
      "midi",
      "MIDI NRPN",
      "NRPN CC",
      expectedValue
    );
    await configPage.selectElementEvent("Timer");
    await configPage.selectElementEvent("Button");
    const actualValue = await configPage.getActionBlockFieldValue(
      "midi",
      "MIDI NRPN",
      "NRPN CC"
    );
    await expect(actualValue).toBe(expectedValue);
  });

  test("Element name freezes Editor", async () => {
    await configPage.removeAllActions();
    await configPage.openAndAddActionBlock("code", "Element Name");
    await configPage.writeActionBlockField(
      "code",
      "Element Name",
      "input",
      "testwrite"
    );
    await modulePage.selectModuleElement(2);
    await modulePage.selectModuleElement(0);

    const actualValue = await configPage.getTextFromName();
    await expect(actualValue).toBe("testwrite");
  });

  test("Nested action block should not prevent opening other actions", async () => {
    await configPage.addActionBlockToTop("condition", "If");
    await configPage.clickActionBlock(3);
    const element = configPage.blocks["midi"]["MIDI"]["elements"]["Channel"];
    await expect(element).toBeVisible();
  });
});

test.describe("NRPN converting", () => {
  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    configPage = new ConfigPage(page);
    await page.goto(PAGE_PATH);
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("BU16");
  });

  test("MIDI NRPN convert Bits to CC", async () => {
    const expectedValue = "(1+2)*128+3";
    await configPage.removeAllActions();
    await configPage.openAndAddActionBlock("midi", "MIDI NRPN");
    await configPage.writeActionBlockField("midi", "MIDI NRPN", "MSB", "1+2");
    await configPage.writeActionBlockField("midi", "MIDI NRPN", "LSB", "3");
    await configPage.writeActionBlockField("midi", "MIDI NRPN", "LSB", "3");
    await configPage.selectElementEvent("Button");
    const actualValue = await configPage.getActionBlockFieldValue(
      "midi",
      "MIDI NRPN",
      "NRPN CC"
    );
    await expect(actualValue).toBe(expectedValue);
  });

  test("MIDI NRPN convert CC to Bits", async () => {
    const expectedMSB = "(223)//128";
    const expectedLSB = "(223)%128";
    await configPage.removeAllActions();
    await configPage.openAndAddActionBlock("midi", "MIDI NRPN");
    await configPage.writeActionBlockField(
      "midi",
      "MIDI NRPN",
      "NRPN CC",
      "223"
    );
    await configPage.selectElementEvent("Button");
    const actualMSB = await configPage.getActionBlockFieldValue(
      "midi",
      "MIDI NRPN",
      "MSB"
    );
    await expect(actualMSB).toBe(expectedMSB);
    const actualLSB = await configPage.getActionBlockFieldValue(
      "midi",
      "MIDI NRPN",
      "LSB"
    );
    await expect(actualLSB).toBe(expectedLSB);
  });

  test("MIDI NRPN convert Bits variable to single CC variable", async () => {
    const expectedValue = "x";
    await configPage.removeAllActions();
    await configPage.openAndAddActionBlock("midi", "MIDI NRPN");
    await configPage.writeActionBlockField(
      "midi",
      "MIDI NRPN",
      "MSB",
      "x//128"
    );
    await configPage.writeActionBlockField(
      "midi",
      "MIDI NRPN",
      "LSB",
      "x//128"
    );
    await configPage.writeActionBlockField("midi", "MIDI NRPN", "LSB", "x%128");
    await configPage.selectElementEvent("Button");
    const actualValue = await configPage.getActionBlockFieldValue(
      "midi",
      "MIDI NRPN",
      "NRPN CC"
    );
    await expect(actualValue).toBe(expectedValue);
  });
});

test.describe("Element Mode MAX value", () => {
  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    configPage = new ConfigPage(page);
    await page.goto(PAGE_PATH);
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("EF44");
    await configPage.removeAllActions();
  });

  test("Potmeter", async () => {
    const category = "element";
    const blockName = "Potmeter Mode";
    await configPage.openAndAddActionBlock(category, blockName);
    await configPage.clickActionBlockElement(
      category,
      blockName,
      "Enable Min/Max Value"
    );
    await configPage.clickActionBlockElement(category, blockName, "Max");
    await expect(configPage.elementMaxResolution14Bit).toBeVisible();
  });

  /*
  test("Encoder", async () => {
    const category = "element";
    const blockName = "Encoder Mode";
    await configPage.openAndAddActionBlock(category, blockName);
    await configPage.clickActionBlockElement(
      category,
      blockName,
      "Enable Min/Max Value"
    );
    await configPage.clickActionBlockElement(category, blockName, "Max");
    await expect(configPage.elementMaxResolution14Bit).toBeVisible();
  });

  test("Endless", async () => {
    const category = "element";
    const blockName = "Endless Mode";
    await configPage.openAndAddActionBlock(category, blockName);
    await configPage.clickActionBlockElement(
      category,
      blockName,
      "Enable Min/Max Value"
    );
    await configPage.clickActionBlockElement(category, blockName, "Max");
    await expect(configPage.elementMaxResolution14Bit).toBeVisible();
  });

  test("Button", async () => {
    const category = "element";
    const blockName = "Button Mode";
    await configPage.openAndAddActionBlock(category, blockName);
    await configPage.clickActionBlockElement(
      category,
      blockName,
      "Enable Min/Max Value"
    );
    await configPage.clickActionBlockElement(category, blockName, "Max");
    await expect(configPage.elementMaxResolution14Bit).toBeVisible();
  });
  */
});

test.describe("Input field keyboard shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    configPage = new ConfigPage(page);
    keyboardActions = new KeyboardActions(page);
    await page.goto(PAGE_PATH);
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("BU16");
    await configPage.removeAllActions();
  });
  test("Monaco Field", async ({ page }) => {
    const category = "condition";
    const blockName = "If";
    const field = "input";
    const expectedValue = "TestTest";
    await configPage.openAndAddActionBlock(category, blockName);
    await configPage.clickActionBlockElement(category, blockName, field);
    await keyboardActions.selectAll();
    await keyboardActions.type("Test");
    await keyboardActions.selectAll();
    await keyboardActions.copy();
    await keyboardActions.paste();
    await keyboardActions.paste();
    const actualValue = await configPage.getActionBlockMonacoFieldTextContetnt(
      category,
      blockName,
      field
    );
    await expect(actualValue).toBe(expectedValue);
  });
  test("Text Field", async () => {
    const category = "midi";
    const blockName = "MIDI";
    const field = "Channel";
    const expectedValue = "TestTest";
    await configPage.openAndAddActionBlock(category, blockName);
    await configPage.clickActionBlockElement(category, blockName, field);
    await keyboardActions.selectAll();
    await keyboardActions.type("Test");
    await keyboardActions.selectAll();
    await keyboardActions.copy();
    await keyboardActions.paste();
    await keyboardActions.paste();
    const actualValue = await configPage.getActionBlockFieldValue(
      category,
      blockName,
      field
    );
    await expect(actualValue).toBe(expectedValue);
  });
});
