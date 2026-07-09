import { chromium } from "@playwright/test";

export const PAGE_PATH = "http://localhost:5273";

export async function initializeBrowserContext() {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Abort all outbound requests to external hosts.  On CI these connections
  // (mixpanel, GitHub, YouTube, …) can hang indefinitely and exhaust test
  // retries, pushing the job past the 30-minute timeout.
  await context.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());

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
