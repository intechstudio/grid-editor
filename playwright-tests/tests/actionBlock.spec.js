import { test, expect } from "@playwright/test";
import { ConfigPage } from "../pages/configPage";
import { PAGE_PATH } from "../utility";
import { ConnectModulePage } from "../pages/connectModulePage";

const blocks = {
  variables: ["Lookup", "Global", "Locals", "Self"],
  led: ["Start Animation", "Stop Animation", "Color", "Intensity"],
  midi: ["MIDI", "MIDI 14", "MIDI SysEX"],
  hid: [
    "GamePad Axis",
    "GamePad Button",
    "Keyboard",
    "Mouse Button",
    "Mouse Move",
  ],
  element: ["Button Mode", "Encoder Mode", "Potmeter Mode"],
  condition: ["If"], // Add "If Else" and "Else"
  loop: ["Repeater Loop"],
  special: ["Press/Release"],
  code: ["Code Block", "Comment Block", "Element Name"],
  timer: ["Clock Source", "Start", "Stop"],
};

test.describe("Block Existence", () => {
  let configPage;
  let connectModulePage;

  test.beforeAll(async ({ page }) => {
    configPage = new ConfigPage(page);
    connectModulePage = new ConnectModulePage(page);
    await page.goto(PAGE_PATH);
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("BU16");
  });

  for (const [category, blockList] of Object.entries(blocks)) {
    test.describe(`${category} blocks`, () => {
      for (const blockName of blockList) {
        test(`should find ${blockName} block`, async () => {
          await configPage.openAddActionBlock();
          await expect(configPage.blocks[category][blockName]).toBeVisible();
        });
      }
    });
  }
});
