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

test.describe("Action Block Actions", () => {
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
  test("Copy", async () => {
    null;
  });
  test("Overwrite", async () => {
    null;
  });
  test("Discard", async () => {
    null;
  });
  test("Clear", async () => {
    null;
  });
});
