import { test, expect } from "@playwright/test";
import { ConnectModulePage } from "../pages/connectModulePage";
import { PAGE_PATH, mockNavigatorSerial } from "../utility";
import { NavbarPage } from "../pages/navbarPage";

let connectModulePage;
let navbarPage;

test.beforeEach(async ({ page }) => {
  await mockNavigatorSerial(page);
  connectModulePage = new ConnectModulePage(page);
  navbarPage = new NavbarPage(page);
  await page.goto(PAGE_PATH);
});

test("should open Debug Monitor when clicked", async ({ page }) => {
  await navbarPage.clickNavItem("debugMonitor");
  await expect(page.getByText("Watched values:")).toBeVisible();
});

test("should open Preferences when clicked", async ({ page }) => {
  await navbarPage.clickNavItem("preferences");
  await expect(page.getByText("Control surface rotation")).toBeVisible();
});

test("should open MIDI Monitor when clicked", async ({ page }) => {
  await navbarPage.clickNavItem("midiMonitor");
  await expect(page.getByTestId("midi-monitor")).toBeVisible();
});
