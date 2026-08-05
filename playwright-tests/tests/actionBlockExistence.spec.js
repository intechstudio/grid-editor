import { test, expect } from "@playwright/test";
import { ConfigPage } from "../pages/configPage";
import {
  initializeBrowserContext,
  closeBrowserContext,
  PAGE_PATH,
} from "../utility";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";
import blocks from "../data/actionBlocks.json";
import blockElements from "../data/actionBlockElements.json";
import KeyboardActions from "../keyboardActions";
import { NavbarPage } from "../pages/navbarPage";

let configPage;
let connectModulePage;
let modulePage;
let browser;
let context;
let page;
let keyboardActions;
let navbarPage;

async function setupModule(moduleName) {
  await connectModulePage.openVirtualModules();
  await connectModulePage.addModule(moduleName);
}
async function changeModuleIfNeeded(category) {
  // A prior test can leave the action menu open / a toast up on the shared
  // page, which would intercept the "Remove Module" click below.
  await configPage.resetTransientUi();
  if (category === "specialButton") {
    await modulePage.removeModule();
    await setupModule("BU16");
  }
  if (category == "Press/Release") {
    await modulePage.removeModule();
    await setupModule("BU16");
  }
}

async function prepareForBlockTest(category, blockName) {
  await changeModuleIfNeeded(category);
  await configPage.removeAllActions();
  await expect(configPage.noActionAddActionButton).toBeVisible();
  await configPage.turnOffMinimalistMode();
  await configPage.openAndAddActionBlock(category, blockName);
}

test.beforeAll(async () => {
  ({ browser, context, page } = await initializeBrowserContext());

  configPage = new ConfigPage(page);
  modulePage = new ModulePage(page);
  keyboardActions = new KeyboardActions(page);
  connectModulePage = new ConnectModulePage(page);

  await page.goto(PAGE_PATH);
  await configPage.closeWelcomeModal();
  await setupModule("EF44");
});

test.afterAll(async () => {
  await closeBrowserContext({ browser, context });
});

test.describe("Block Existence", () => {
  for (const [category, blockList] of Object.entries(blocks)) {
    test.describe(`${category} category`, () => {
      for (const blockName of blockList) {
        test(`should find ${blockName} block`, async () => {
          const blockElement = configPage.blocks[category][blockName]["block"];
          await configPage.turnOffMinimalistMode();
          await changeModuleIfNeeded(category);
          await configPage.clearElement();
          await configPage.removeAllActions();
          await configPage.openActionBlockList();
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
          test.beforeAll(async () => {
            await prepareForBlockTest(category, blockName);
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

test.describe("Interactable input field", () => {
  for (const [category, blockList] of Object.entries(blocks)) {
    test.describe(`${category} category`, () => {
      for (const blockName of blockList) {
        test(`${blockName} block`, async () => {
          if (category == "specialButton") {
            await configPage.selectElementEvent("Button");
          }
          await configPage.turnOffMinimalistMode();
          await configPage.removeAllActions();
          await configPage.openAndAddActionBlock(category, blockName);
          const actionBlock = configPage.actionBlock;

          // Click all checkboxes that are unchecked
          const checkboxes = actionBlock.locator(
            'button[data-state="unchecked"]',
          );
          const checkboxCount = await checkboxes.count();

          for (let i = 0; i < checkboxCount; i++) {
            const checkbox = checkboxes.nth(0);
            await checkbox.click();
          }

          // Click all toggle
          const toggles = actionBlock.locator("input.toggle");
          const toggleCount = await toggles.count();

          for (let i = 0; i < toggleCount; i++) {
            const toggle = toggles.nth(0);
            await toggle.click();
          }

          // Locate input fields that are not of type "checkbox"
          const inputFields = actionBlock.locator(
            "input[type='text']:not(.rename-input)",
          );

          const monacoFields = actionBlock.locator("div#line-editor");
          const fieldCount = await inputFields.count();
          const monacoCount = await monacoFields.count();

          const expectedValue = "test";

          // Loop through monaco fields and interact with them
          for (let i = 0; i < monacoCount; i++) {
            const monacoField = monacoFields.nth(i);

            // Type in the monaco field and validate
            await monacoField.click();
            await keyboardActions.selectAll();
            await keyboardActions.type(expectedValue);
            const value = await monacoField.innerText();
            expect(value).toMatch("test");
          }

          // Loop through input fields and interact with them
          for (let i = 0; i < fieldCount; i++) {
            const inputField = inputFields.nth(i);

            // Fill the input field and validate
            await inputField.fill(expectedValue);
            const value = await inputField.inputValue();
            expect(value).toBe(expectedValue);
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
  await configPage.turnOffMinimalistMode();
  await configPage.removeAllActions();
  await expect(configPage.noActionAddActionButton).toBeVisible();
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
