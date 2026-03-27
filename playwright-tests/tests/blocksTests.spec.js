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
    await configPage.turnOffMinimalistMode();
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
      .getByTestId(/^action-checkbox/)
      .click(); //uncheck codeblock
    await configPage.removeAction();

    const preText = await page.locator("#cfg-0").getByText(expectedText); // should find codeblock with hello
    await expect(preText).toBeVisible();
  });

  // https://github.com/intechstudio/grid-editor/issues/1022
  test("Code block saving the stored changes", async ({ page }) => {
    const storedInput = 'print("stored codeblock")';
    await configPage.removeAllActions();
    await configPage.addAndEditCodeBlock(storedInput);
    await configPage.commitCode();
    await configPage.closeCode();
    await modulePage.storeConfig();
    await configPage.selectElementEvent("Setup");
    await configPage.selectElementEvent("Button");

    const preText = page.locator("#cfg-0").getByText(storedInput); // should find codeblock with the sored filed
    await expect(preText).toBeVisible();
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
      expectedValue,
    );
    await configPage.selectElementEvent("Timer");
    await configPage.selectElementEvent("Button");
    const actualValue = await configPage.getActionBlockFieldValue(
      "midi",
      "MIDI NRPN",
      "NRPN CC",
    );
    await expect(actualValue).toBe(expectedValue);
  });

  test("Coma character in MIDI NRPN ", async ({ page }) => {
    const expectedValue = ",";
    await configPage.removeAllActions();
    await configPage.openAndAddActionBlock("midi", "MIDI NRPN");
    await configPage.writeActionBlockField(
      "midi",
      "MIDI NRPN",
      "NRPN CC",
      expectedValue,
    );
    const actualValue = await configPage.getActionBlockFieldValue(
      "midi",
      "MIDI NRPN",
      "NRPN CC",
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
      "testwrite",
    );
    await modulePage.selectModuleElement(2);
    await modulePage.selectModuleElement(0);

    const actualValue = await configPage.getTextFromNameBlock();
    await expect(actualValue).toBe("testwrite");
  });

  test("Nested action block should not prevent opening other actions", async () => {
    await configPage.addActionBlockToTop("condition", "If");
    await configPage.clickActionBlock(4);
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
    await configPage.turnOffMinimalistMode();
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
      "NRPN CC",
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
      "223",
    );
    await configPage.selectElementEvent("Button");
    const actualMSB = await configPage.getActionBlockFieldValue(
      "midi",
      "MIDI NRPN",
      "MSB",
    );
    await expect(actualMSB).toBe(expectedMSB);
    const actualLSB = await configPage.getActionBlockFieldValue(
      "midi",
      "MIDI NRPN",
      "LSB",
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
      "x//128",
    );
    await configPage.writeActionBlockField(
      "midi",
      "MIDI NRPN",
      "LSB",
      "x//128",
    );
    await configPage.writeActionBlockField("midi", "MIDI NRPN", "LSB", "x%128");
    await configPage.selectElementEvent("Button");
    const actualValue = await configPage.getActionBlockFieldValue(
      "midi",
      "MIDI NRPN",
      "NRPN CC",
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
    await configPage.turnOffMinimalistMode();
    await configPage.removeAllActions();
  });

  test("Potmeter", async () => {
    const category = "element";
    const blockName = "Potmeter Mode";
    await configPage.openAndAddActionBlock(category, blockName);
    await configPage.clickActionBlockElement(category, blockName, "Max");
    await expect(configPage.elementMaxResolution14Bit).toBeVisible();
  });

  test("Encoder", async () => {
    const category = "element";
    const blockName = "Encoder Mode";
    await configPage.openAndAddActionBlock(category, blockName);
    await configPage.clickActionBlockElement(category, blockName, "Max");
    await expect(configPage.elementMaxResolution14Bit).toBeVisible();
  });

  test("Endless", async () => {
    const category = "element";
    const blockName = "Endless Mode";
    await configPage.openAndAddActionBlock(category, blockName);
    await configPage.clickActionBlockElement(category, blockName, "Max");
    await expect(configPage.elementMaxResolution14Bit).toBeVisible();
  });

  test("Button", async () => {
    const category = "element";
    const blockName = "Button Mode";
    await configPage.openAndAddActionBlock(category, blockName);
    await configPage.clickActionBlockElement(category, blockName, "Max");
    await expect(configPage.elementMaxResolution14Bit).toBeVisible();
  });
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
    await configPage.turnOffMinimalistMode();
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
    await keyboardActions.cut();
    await page.waitForTimeout(10);
    await keyboardActions.paste();
    await keyboardActions.paste();
    await configPage.clickActionBlockElement(category, blockName, field); // make sure expected value is loaded
    const actualValue = await configPage.getActionBlockMonacoFieldTextContetnt(
      category,
      blockName,
      field,
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
      field,
    );
    await expect(actualValue).toBe(expectedValue);
  });
});

test.describe("Code block closes Modal", () => {
  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    configPage = new ConfigPage(page);
    keyboardActions = new KeyboardActions(page);
    await page.goto(PAGE_PATH);
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("BU16");
    await configPage.turnOffMinimalistMode();
    await configPage.removeAllActions();
  });
  test("Esc key closes Modal", async () => {
    const code = "print('test')";
    await configPage.addAndEditCodeBlock(code);
    await configPage.closeCode();
    await keyboardActions.esc();
    await expect(await configPage.codeBlockModalDiscardButton).toBeHidden();
    await expect(await configPage.commitCodeButton).toBeVisible();
  });

  test("Enter key closes modal and discard changes", async () => {
    const code = "print('')";
    await configPage.addAndEditCodeBlock(code);
    await configPage.closeCode();
    await keyboardActions.enter();
    await expect(await configPage.getTextFromCode()).toBe(`print("hello")`);
  });

  test("Modal appears if changes present", async () => {
    await configPage.addAndEditCodeBlock("print('test')");
    await configPage.closeCode();
    await expect(await configPage.codeBlockModalDiscardButton).toBeVisible();
  });
  test("Modal appears if syntax error presents", async () => {
    await configPage.addAndEditCodeBlock("./././");
    await configPage.closeCode();
    await expect(await configPage.codeBlockModalDiscardButton).toBeVisible();
  });
  test("Modal not appear if no changes", async () => {
    await configPage.addAndEditCodeBlock(`print("hello")`);
    await configPage.closeCode();
    await expect(await configPage.codeBlockModalDiscardButton).toBeHidden();
  });
});

test.describe("Element naming", () => {
  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    configPage = new ConfigPage(page);
    keyboardActions = new KeyboardActions(page);
    await page.goto(PAGE_PATH);
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("BU16");
    await configPage.turnOffMinimalistMode();
  });
  test("Element naming add 'element name' action block", async () => {
    const name = "happy path";
    await configPage.fillElementName(name);
    await configPage.selectElementEvent("Setup");
    await configPage.clickActionBlock(0);
    expect(await configPage.getTextFromNameBlock()).toBe(name);
  });
  test("Element name entered in action block is displayed correctly", async () => {
    const name = "happy path";
    await configPage.selectElementEvent("Setup");
    await configPage.removeAllActions();
    await configPage.openAndAddActionBlock("code", "Element Name");
    await configPage.writeActionBlockField(
      "code",
      "Element Name",
      "input",
      name,
    );
    expect(await configPage.getElementNameFromMainTextbox()).toBe(name);
  });
});
