import { test, expect } from "@playwright/test";
import { ConfigPage } from "../pages/configPage";
import { PAGE_PATH } from "../utility";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";

let configPage;
let connectModulePage;
let modulePage;

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
  specialButton: ["Press/Release"],
  specialEncoder: ["Left/Right Rotate", "Push & Rotate L R", "Push & Rotate"],
  code: ["Code Block", "Comment Block", "Element Name"],
  timer: ["Clock Source", "Start", "Stop"],
};
const blockElements = {
  variables: {
    Lookup: ["source", "input", "output", "destination", "addNewPair"],
    Global: ["commit", "var", "i", "addNewPair"],
    Locals: ["commit", "var", "i", "addNewPair"],
    Self: ["commit", "var", "i", "addNewPair"],
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
    Intensity: ["element1", "element2", "element3", "element4"],
  },
  midi: {
    MIDI: ["element1", "element2", "element3", "element4"],
    "MIDI 14": ["element1", "element2", "element3", "element4"],
    "MIDI SysEX": ["element1", "element2", "element3", "element4"],
  },
  hid: {
    "GamePad Axis": ["element1", "element2", "element3", "element4"],
    "GamePad Button": ["element1", "element2", "element3", "element4"],
    Keyboard: ["element1", "element2", "element3", "element4"],
    "Mouse Button": ["element1", "element2", "element3", "element4"],
    "Mouse Move": ["element1", "element2", "element3", "element4"],
  },
  element: {
    "Button Mode": ["element1", "element2", "element3", "element4"],
    "Encoder Mode": ["element1", "element2", "element3", "element4"],
    "Potmeter Mode": ["element1", "element2", "element3", "element4"],
  },
  condition: {
    If: ["element1", "element2", "element3", "element4"],
    // Add "If Else" and "Else"
  },
  loop: {
    "Repeater Loop": ["element1", "element2", "element3", "element4"],
  },
  specialButton: {
    "Press/Release": ["element1", "element2", "element3", "element4"],
  },
  specialEncoder: {
    "Left/Right Rotate": ["element1", "element2", "element3", "element4"],
    "Push & Rotate L R": ["element1", "element2", "element3", "element4"],
    "Push & Rotate": ["element1", "element2", "element3", "element4"],
  },
  code: {
    "Code Block": ["element1", "element2", "element3", "element4"],
    "Comment Block": ["element1", "element2", "element3", "element4"],
    "Element Name": ["element1", "element2", "element3", "element4"],
  },
  timer: {
    "Clock Source": ["element1", "element2", "element3", "element4"],
    Start: ["element1", "element2", "element3", "element4"],
    Stop: ["element1", "element2", "element3", "element4"],
  },
};

test.beforeAll(async ({ page }) => {
  configPage = new ConfigPage(page);
  modulePage = new ModulePage(page);
  connectModulePage = new ConnectModulePage(page);
  await page.goto(PAGE_PATH);
  await setupModule("EF44");
});

test.describe("Block Existence", () => {
  for (const [category, blockList] of Object.entries(blocks)) {
    test.describe(`${category} category`, () => {
      for (const blockName of blockList) {
        // Test
        test(`should find ${blockName} block`, async () => {
          if (category == "specialButton") {
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

test.describe("Elements Existence", () => {
  for (const [category, blockData] of Object.entries(blockElements)) {
    test.describe(`${category} category`, () => {
      for (const [blockName, elementList] of Object.entries(blockData)) {
        test.describe(`${blockName} block`, () => {
          // Remove all actions
          test.beforeAll(async () => {
            await configPage.removeAllActions();
            await configPage.addActionBlock(category, blockName);
          });

          // Test
          for (const elementName of elementList) {
            test(`should find ${blockName} block's ${elementName} element`, async () => {
              const element =
                configPage.blocks[category][blockName]["elements"][elementName];
              await expect(element).toBeVisible();
            });
          }
        });
      }
    });
  }
});
