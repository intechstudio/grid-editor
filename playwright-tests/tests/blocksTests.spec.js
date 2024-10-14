import { test, expect } from "@playwright/test";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";
import { PAGE_PATH, mockNavigatorSerial, getRandomInt } from "../utility";
import { ConfigPage } from "../pages/configPage";

let connectModulePage;
let modulePage;
let configPage;

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
      .locator("anim-block")
      .filter({ hasText: 'Code preview: print("hello")' })
      .getByRole("button")
      .nth(2)
      .click();
    await page
      .locator("div:nth-child(2) > div:nth-child(2) > button:nth-child(5)")
      .click();

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
