import { chromium, test, expect } from "@playwright/test";
import { ConfigPage } from "../pages/configPage";
import { PAGE_PATH } from "../utility";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";
import blocks from "../data/actionBlocks.json";
import blockElements from "../data/actionBlockElements.json";

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
async function changeModuleIfNeeded(category) {
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
  await changeModuleIfNeeded(blockName);
  await configPage.removeAllActions();
  await configPage.noActionAddActionButton.isVisible();
  await configPage.openAndAddActionBlock(category, blockName);
  if (blockName == "Repeater Loop") {
    configPage.openLoopTimes();
  }
  if (category == "element") {
    await configPage.clickCategoryCheckboxFileds(blockName);
  }
}

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
          const blockElement = configPage.blocks[category][blockName]["block"];
          await changeModuleIfNeeded(category);
          await configPage.openActionBlockList();
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
