import { expect, test } from '@playwright/test';

const portal = process.env.BOOK_PORTAL_URL || 'https://books.euiyun.com';
const fallbackExperiments = {
  chipindustrybook: '/chapters/business.html#sim-bm-map',
  colorbook: '/chapters/colorimetry.html#sim-match',
  etchbook: '/chapters/ale.html#sim-cyc',
  moneybook: '/chapters/behavior.html#sim-value',
  stockbook: '/chapters/backtest.html#sim-engine',
};

function trackPageErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('published books load on mobile and expose a working simulator page', async ({ browser, request }) => {
  test.setTimeout(240_000);
  const [catalogResponse, discoveryResponse] = await Promise.all([
    request.get(`${portal}/data/books.json`),
    request.get(`${portal}/data/discovery.json`),
  ]);
  expect(catalogResponse.ok()).toBeTruthy();
  expect(discoveryResponse.ok()).toBeTruthy();
  const catalog = await catalogResponse.json();
  const discovery = await discoveryResponse.json();
  const published = catalog.books.filter(book => book.status === 'published');
  expect(published.length).toBeGreaterThanOrEqual(22);

  for (const book of published) {
    await test.step(book.id, async () => {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      const errors = trackPageErrors(page);
      try {
        const home = await page.goto(book.url, { waitUntil: 'domcontentloaded' });
        expect.soft(home?.status(), `${book.id} home HTTP status`).toBe(200);
        expect.soft(await page.title(), `${book.id} title`).not.toBe('');
        expect.soft(await page.locator('body').innerText(), `${book.id} home content`).not.toBe('');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        expect.soft(overflow, `${book.id} mobile horizontal overflow (px)`).toBeLessThanOrEqual(2);

        const entry = discovery.experiments.find(item => item.bookId === book.id);
        const simulatorUrl = entry?.url || (fallbackExperiments[book.id] && new URL(fallbackExperiments[book.id], book.url).href);
        expect(simulatorUrl, `${book.id} simulator URL`).toBeTruthy();
        if (simulatorUrl) {
          const chapter = await page.goto(simulatorUrl, { waitUntil: 'domcontentloaded' });
          expect.soft(chapter?.status(), `${book.id} simulator HTTP status`).toBe(200);
          const id = new URL(simulatorUrl).hash.slice(1);
          const simulator = page.locator(`[id="${id}"]`);
          await expect.soft(simulator, `${book.id} simulator anchor`).toHaveCount(1);
          if (await simulator.count()) {
            await simulator.scrollIntoViewIfNeeded();
            await expect.soft(simulator, `${book.id} simulator visibility`).toBeVisible();
            expect.soft(await simulator.locator('canvas, input, button, select').count(), `${book.id} simulator controls`).toBeGreaterThan(0);
          }
        }
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
  await page.goto('https://aibook.euiyun.com/chapters/attention.html#sim-lookup');
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
  await page.goto('https://colorbook.euiyun.com/chapters/colorimetry.html#sim-match');
  const difference = page.locator('#o-m-duv');
  await expect(difference).not.toHaveText('—');
  await page.locator('#m-solve').click();
  await expect(difference).toContainText('등색');
  await page.locator('#m-reset').click();
  await expect(difference).not.toContainText('등색');
  expect(errors).toEqual([]);
});
