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
    "Potmeter Mode": ["Bit", "Max"],
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
  specialButton: {
    "Press/Release": ["press", "release", "end"],
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
            await configPage.noActionAddActionButton.isVisible();
            await configPage.addActionBlock(category, blockName);
            //TODO: midire nem kapcsol itt + Loopot kinyitni + Press/release
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
