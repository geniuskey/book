import { expect, test } from '@playwright/test';
import { simulatorUrlFor } from './discovery.js';

const portal = process.env.BOOK_PORTAL_URL || 'https://books.euiyun.com';

function trackPageErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

// Load the live catalog once at collection time so each book is its own test.
// One test per book keeps the per-test timeout meaningful and lets workers run them in parallel.
async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

const [catalog, discovery] = await Promise.all([
  loadJson(`${portal}/data/books.json`),
  loadJson(`${portal}/data/discovery.json`),
]);
const published = catalog.books.filter(book => book.status === 'published');

test('portal catalog lists the published books', () => {
  expect(published.length).toBeGreaterThanOrEqual(22);
});

test.describe('published book', () => {
  // Some book pages take 8s+ to fire `load` locally and much longer on shared CI runners.
  test.describe.configure({ mode: 'parallel', timeout: 90_000 });

  for (const book of published) {
    test(`${book.id} loads on mobile and exposes a working simulator page`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      const errors = trackPageErrors(page);
      try {
        const home = await page.goto(book.url, { waitUntil: 'domcontentloaded' });
        expect.soft(home?.status(), `${book.id} home HTTP status`).toBe(200);
        expect.soft(await page.title(), `${book.id} title`).not.toBe('');
        expect.soft(await page.locator('body').innerText(), `${book.id} home content`).not.toBe('');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        expect.soft(overflow, `${book.id} mobile horizontal overflow (px)`).toBeLessThanOrEqual(2);

        const simulatorUrl = simulatorUrlFor(book, discovery);
        expect(simulatorUrl, `${book.id} simulator URL`).toBeTruthy();
        const chapter = await page.goto(simulatorUrl, { waitUntil: 'load' });
        expect.soft(chapter?.status(), `${book.id} simulator HTTP status`).toBe(200);
        const id = new URL(simulatorUrl).hash.slice(1);
        const simulator = page.locator(`[id="${id}"]`);
        await expect(simulator, `${book.id} simulator anchor`).toHaveCount(1);
        // Scroll with the DOM API: Playwright's scrollIntoViewIfNeeded waits for the element to be
        // "stable", which animated simulators never reach. Once on screen, three.js simulators
        // (phonebook, camerabook) render every frame in software WebGL on GPU-less CI runners and
        // keep the main thread busy, so each call can take seconds; give single calls room.
        // Re-resolve the locator each attempt in case the section re-renders.
        await expect(async () => {
          await simulator.evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }), null, { timeout: 10_000 });
          await expect(simulator).toBeVisible({ timeout: 10_000 });
        }, `${book.id} simulator visibility`).toPass({ timeout: 30_000 });
        expect.soft(await simulator.locator('canvas, input, button, select').count(), `${book.id} simulator controls`).toBeGreaterThan(0);
        expect.soft(errors, `${book.id} JavaScript errors`).toEqual([]);
      } finally {
        await page.close();
      }
    });
  }
});

test('ProcessBook cleanroom control updates particle allowance', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('https://processbook.euiyun.com/chapters/overview.html#sim-clean');
  const range = page.locator('#cl-n');
  const result = page.locator('#cl-o-05');
  await expect(result).not.toHaveText('—');
  const before = await result.innerText();
  await range.focus();
  await range.press('ArrowRight');
  await expect(page.locator('#cl-n-out')).toHaveText('6');
  await expect(result).not.toHaveText(before);
  expect(errors).toEqual([]);
});

test('AIBook lookup temperature presets change entropy', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('https://computing.euiyun.com/ai/chapters/attention.html#sim-lookup');
  const entropy = page.locator('#lk-ent');
  await expect(entropy).not.toHaveText('—');
  await page.locator('#lk-hard').click();
  const hard = await entropy.innerText();
  await page.locator('#lk-avg').click();
  await expect(entropy).not.toHaveText(hard);
  await expect(page.locator('#lk-temp-out')).toContainText('4.95');
  expect(errors).toEqual([]);
});

test('ColorBook matching control solves and resets a color match', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('https://science.euiyun.com/color/chapters/colorimetry.html#sim-match');
  const difference = page.locator('#o-m-duv');
  await expect(difference).not.toHaveText('—');
  await page.locator('#m-solve').click();
  await expect(difference).toContainText('등색');
  await page.locator('#m-reset').click();
  await expect(difference).not.toContainText('등색');
  expect(errors).toEqual([]);
});
