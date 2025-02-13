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
  await expect(page.getByText("MIDI Monitor")).toBeVisible();
});

test("Module Zoom works", async ({ page }) => {
  await navbarPage.clickNavItem("preferences");
  await connectModulePage.openVirtualModules();
  await connectModulePage.addModule("BU16");
  const slider = page.getByRole("slider").first();
  const sliderBox = await slider.boundingBox();
  await page.mouse.move(
    sliderBox.x + sliderBox.width / 2,
    sliderBox.y + sliderBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(sliderBox.x + 1000, sliderBox.y + sliderBox.height / 2);
  await page.mouse.up();
  const element = await page.locator(
    "#container > layout-container > div.relative.s-qohgMz_r9xxG > div > div"
  ); // need to know the selector, where to have the CSS
  await expect(await element).toHaveCSS("transform", "scale(2.6)");
});
