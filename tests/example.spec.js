import { _electron as electron } from "@playwright/test";
import { test, expect } from "@playwright/test";

/*
let electronApp = undefined;
let window = undefined;

test.beforeEach(async () => {
  electronApp = await electron.launch({ args: ["."] });
  const appPath = await electronApp.evaluate(async ({ app }) => {
    return app.getAppPath();
  });

  console.log(appPath);
  window = await electronApp.firstWindow();
  console.log(await window.title());
});*/

test.beforeEach(async ({ page }, testInfo) => {
  // Extend timeout for all tests running this hook by 30 seconds.
  test.setTimeout(24000);
});

test("Launch electron app", async () => {
  // Launch Electron app.
  const electronApp = await electron.launch({ args: ["src/electron/main.ts"] });

  // Evaluation expression in the Electron context.
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the main Electron process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath();
  });
  console.log(appPath);

  // Get the first window that the app opens, wait if necessary.
  const window = await electronApp.firstWindow({
    timeout: 24000,
  });
  // Print the title.
  console.log(await window.title());
  // Capture a screenshot.
  await window.screenshot({ path: "intro.png" });
  // Direct Electron console to Node terminal.
  window.on("console", console.log);
  // Click button.
  await window.click("text=Click me");
  // Exit app.
  await electronApp.close();
});
