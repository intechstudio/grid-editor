import { test, expect } from "@playwright/test";
import { PAGE_PATH, mockNavigatorSerial } from "../utility";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ProfileCloudPage } from "../pages/profileCloudPage";

let connectModulePage;
let profileCloudPage;

test.beforeEach(async ({ page }) => {
  await mockNavigatorSerial(page);
  connectModulePage = new ConnectModulePage(page);
  profileCloudPage = new ProfileCloudPage(page);
  await page.goto(PAGE_PATH);
  await profileCloudPage.waitForProfilesLoad();
});

test("search", async () => {
  await profileCloudPage.searchProfile("Endless");
});

test("clicknCategory", async () => {
  await profileCloudPage.clickMainProfileCategory("community");
});
