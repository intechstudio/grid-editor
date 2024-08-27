import { chromium } from "@playwright/test";

export const PAGE_PATH = "http://localhost:5173";

export async function initializeBrowserContext() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "serial", {
      set: () => undefined,
      get: () => undefined,
    });
  });

  return { browser, context, page };
}

export async function closeBrowserContext({ browser, context }) {
  if (context) {
    await context.close();
  }
  if (browser) {
    await browser.close();
  }
}

export async function mockNavigatorSerial(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "serial", {
      set: () => undefined,
      get: () => undefined,
    });
  });
}

export async function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
