import { test, expect } from "@playwright/test";
import { ConfigPage } from "../pages/configPage";
import { PAGE_PATH } from "../utility";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";

test.describe("Block Existence", () => {
  let configPage;
  let connectModulePage;
  let modulePage;

  async function setupModule(moduleName) {
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule(moduleName);
  }

  test.beforeAll(async ({ page }) => {
    configPage = new ConfigPage(page);
    modulePage = new ModulePage(page);
    connectModulePage = new ConnectModulePage(page);
    await page.goto(PAGE_PATH);
    await setupModule("EF44");
  });
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
    specialButton: ["Press/Release"],
    specialEncoder: ["Left/Right Rotate", "Push & Rotate L R", "Push & Rotate"],
    code: ["Code Block", "Comment Block", "Element Name"],
    timer: ["Clock Source", "Start", "Stop"],
  };

  for (const [category, blockList] of Object.entries(blocks)) {
    test.describe(`${category} category`, () => {
      for (const blockName of blockList) {
        test(`should find ${blockName} block`, async () => {
          if (category == "specialButton") {
            console.log("asd");
            await modulePage.removeModule();
            await setupModule("BU16");
          }
          await configPage.openAddActionBlock();
          const blockElement = configPage.blocks[category][blockName]["block"];
          await expect(blockElement).toBeVisible();
        });
      }
    });
  }
});

test.describe("Action Block operations", () => {
  test("Copy and Paste", async ({ page }) => {
    // Your test implementation here
  });

  test("Duplicate", async ({ page }) => {
    // Your test implementation here
  });

  test("Discard", async ({ page }) => {
    // Your test implementation here
  });
});
