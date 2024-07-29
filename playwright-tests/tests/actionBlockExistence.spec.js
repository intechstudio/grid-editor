import { chromium, test, expect } from "@playwright/test";
import { ConfigPage } from "../pages/configPage";
import { PAGE_PATH } from "../utility";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";

let configPage;
let connectModulePage;
let modulePage;
let browser;
let context;
let page;

async function setupModule(moduleName) {
  await connectModulePage.openVirtualModules();
  await connectModulePage.addModule(moduleName);
}

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
  specialEncoder: ["Left/Right Rotate", "Push & Rotate L R", "Push & Rotate"],
  code: ["Code Block", "Comment Block", "Element Name"],
  timer: ["Clock Source", "Start", "Stop"],
  specialButton: ["Press/Release"],
};
const blockElements = {
  variables: {
    Lookup: ["source", "input", "output", "destination", "addNewPair"],
    Global: ["Commit", "var", "i", "addNewPair"],
    Locals: ["Commit", "var", "i", "addNewPair"],
    Self: ["Commit", "var", "i", "addNewPair"],
  },
  led: {
    "Start Animation": ["ledNumber", "Layer", "Phase", "Rate", "Shape"],
    "Stop Animation": ["ledNumber", "Layer"],
    Color: [
      "ledNumber",
      "Layer",
      "Red",
      "Green",
      "Blue",
      "Canva",
      "Random",
      "Beauty",
    ],
    Intensity: ["LED Number", "Layer", "Intensity"],
  },
  midi: {
    MIDI: ["Channel", "Command", "Parameter1", "Parameter2"],
    "MIDI 14": ["Channel", "CC", "Controller Value"],
    "MIDI SysEX": ["Commit", "message"],
  },
  hid: {
    "GamePad Axis": ["Axis", "Position"],
    "GamePad Button": ["Button", "State"],
    Keyboard: [
      "Macro",
      "Add Key",
      "Delay Key",
      "Add Delay",
      "Defaul Delay",
      "Clear All",
    ],
    "Mouse Button": ["Button", "State"],
    "Mouse Move": ["Axis", "Position"],
  },
  element: {
    "Button Mode": ["Mode"],
    "Encoder Mode": ["Mode", "Velocity"],
    "Potmeter Mode": ["Bit"],
  },
  condition: {
    If: ["input", "end"],
    // Add "If Else" and "Else"
  },
  loop: {
    "Repeater Loop": [
      "input",
      "times",
      "end",
      "Variable",
      "Initial",
      "End",
      "Increment",
    ],
  },

  specialEncoder: {
    "Left/Right Rotate": ["left", "right", "end"],
    "Push & Rotate L R": [
      "push left",
      "push right",
      "just left",
      "just right",
      "end",
    ],
    "Push & Rotate": ["push rotate", "kust rotate", "end"],
  },
  code: {
    "Code Block": ["input", "Edit Code"],
    "Comment Block": ["input"],
    "Element Name": ["input"],
  },
  timer: {
    "Clock Source": ["Element Number", "Source"],
    Start: ["Element Number", "Time"],
    Stop: ["Stop"],
  },
  specialButton: {
    "Press/Release": ["press", "release", "end"],
  },
};

test.beforeAll(async () => {
  browser = await chromium.launch();
  context = await browser.newContext();
  page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "serial", {
      set: () => undefined,
      get: () => undefined,
    });
  });

  configPage = new ConfigPage(page);
  modulePage = new ModulePage(page);
  connectModulePage = new ConnectModulePage(page);

  await page.goto(PAGE_PATH);
  await setupModule("EF44");
});

test.afterAll(async () => {
  if (context) {
    await context.close();
  }
  if (browser) {
    await browser.close();
  }
});

test.describe("Block Existence", () => {
  for (const [category, blockList] of Object.entries(blocks)) {
    test.describe(`${category} category`, () => {
      for (const blockName of blockList) {
        test(`should find ${blockName} block`, async () => {
          if (category === "specialButton") {
            await modulePage.removeModule();
            await setupModule("BU16");
          }
          await configPage.openActionBlockList();
          const blockElement = configPage.blocks[category][blockName]["block"];
          await expect(blockElement).toBeVisible({ timeout: 5000 });
        });
      }
    });
  }
});

test.describe("Elements Existence", () => {
  for (const [category, blockData] of Object.entries(blockElements)) {
    test.describe(`${category} category`, () => {
      for (const [blockName, elementList] of Object.entries(blockData)) {
        test.describe(`${blockName} block`, () => {
          test.beforeAll(async () => {
            if (blockName == "Press/Release") {
              await modulePage.removeModule();
              await setupModule("BU16");
            }
            await configPage.removeAllActions();
            await configPage.noActionAddActionButton.isVisible();
            await configPage.openAndAddActionBlock(category, blockName);
            if (blockName == "Repeater Loop") {
              configPage.openLoopTimes();
            }
          });

          // Test
          for (const elementName of elementList) {
            test(`should find ${blockName} block's ${elementName} element`, async () => {
              const element =
                configPage.blocks[category][blockName]["elements"][elementName];
              await expect(element).toBeVisible({ timeout: 5000 });
            });
          }
        });
      }
    });
  }
});

test("should find Else If Actions", async () => {
  const category = "condition";
  const ElseIf = "Else if";
  const Else = "Else";
  await configPage.removeAllActions();
  await configPage.noActionAddActionButton.isVisible();
  await configPage.openAndAddActionBlock(category, "If");
  await configPage.openActionsInIf();
  await configPage.addActionBlock(category, ElseIf);
  await configPage.openActionsInElseIf();
  await configPage.addActionBlock(category, Else);

  const elementElse = configPage.blocks[category][Else]["elements"]["else"];
  const elementElseIf =
    configPage.blocks[category][ElseIf]["elements"]["input"];
  await expect(elementElse).toBeVisible({ timeout: 5000 });
  await expect(elementElseIf).toBeVisible({ timeout: 5000 });
});
