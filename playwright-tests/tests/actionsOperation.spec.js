import { test, expect } from "@playwright/test";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";
import { PAGE_PATH } from "../utility";
import { ConfigPage } from "../pages/configPage";

let connectModulePage;
let modulePage;
let configPage;

test.beforeEach(async ({ page }) => {
  connectModulePage = new ConnectModulePage(page);
  modulePage = new ModulePage(page);
  configPage = new ConfigPage(page);
  await page.goto(PAGE_PATH);
  await connectModulePage.openVirtualModules();
  await connectModulePage.addModule("TEK2");
});

test.describe("Action Block Operations", () => {
  test("Copy and Paste", async () => {
    null;
  });
  test("Cut and Paste", async () => {
    null;
  });
  test("Merge", async () => {
    null;
  });
  test("Remove", async () => {
    null;
  });
  // TODO: test for https://github.com/intechstudio/grid-editor/issues/741
});

test.describe("Element Actions", () => {
  test("Copy and Overwrite", async () => {
    const initComment = "init pasted";
    const buttonComment = "button pasted";
    const timerComment = "timer pasted";
    await configPage.removeAllActions();
    await configPage.addCommentBlock(buttonComment);
    await configPage.selectElementEvent("Init");
    await configPage.removeAllActions();
    await configPage.addCommentBlock(initComment);
    await configPage.selectElementEvent("Timer");
    await configPage.removeAllActions();
    await configPage.addCommentBlock(timerComment);
    await configPage.copyElement();
    await modulePage.selectModuleElement(3);
    await configPage.overwriteElement();

    await expect(await configPage.getTextFromComment()).toHaveValue(
      timerComment
    );
    await configPage.selectElementEvent("Init");
    await expect(await configPage.getTextFromComment()).toHaveValue(
      initComment
    );
    await configPage.selectElementEvent("Button");
    await expect(await configPage.getTextFromComment()).toHaveValue(
      buttonComment
    );
  });

  test("Discard", async ({ page }) => {
    const notVisibleComment = "Not Exist";
    await configPage.removeAllActions();
    await configPage.addCommentBlock(notVisibleComment);
    await configPage.selectElementEvent("Timer");
    await configPage.discardElement();
    await configPage.selectElementEvent("Button");

    await expect(await configPage.getTextFromComment()).toBeHidden();
    await expect(page.locator("#cfg-2")).toBeVisible(); //default last action block is visible
  });
  test("Clear", async () => {
    null;
  });
});
