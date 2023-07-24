import { expect, test } from "@playwright/test";
import {
  clickMenuItemById,
  findLatestBuild,
  ipcMainCallFirstListener,
  ipcRendererCallFirstListener,
  parseElectronApp,
  ipcMainInvokeHandler,
  ipcRendererInvoke,
} from "electron-playwright-helpers";
import { _electron as electron } from "@playwright/test";

let electronApp;

test.beforeAll(async () => {
  // find the latest build in the out directory
  const latestBuild = findLatestBuild();
  // parse the directory and find paths and other info
  const appInfo = parseElectronApp(latestBuild);
  // set the CI environment variable to true
  //process.env.CI = "e2e";

  electronApp = await electron.launch({
    args: [appInfo.main],
    executablePath: appInfo.executable,
  });

  electronApp.on("window", async (page) => {
    const filename = page.url()?.split("/").pop();
    console.log(`Window opened: ${filename}`);

    // capture errors
    page.on("pageerror", (error) => {
      console.error(error);
    });
    // capture console messages
    page.on("console", (msg) => {
      console.log(msg.text());
    });
  });
});

/*
test.afterAll(async () => {
  await electronApp.close();
});*/

let window;

test("renders the first page", async () => {
  window = await electronApp.firstWindow();
  console.log(await window.title());
  // Capture a screenshot.
  await window.screenshot({ path: "intro.png" });
  // Direct Electron console to Node terminal.
  window.on("console", console.log);
});
