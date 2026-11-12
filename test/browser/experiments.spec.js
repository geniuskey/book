import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../runtime/experiments.js', import.meta.url), 'utf8');
const origin = 'https://book.test';

const sim = (id) => `<div class="sim" id="${id}" style="height:400px">
  <canvas width="200" height="100"></canvas>
  <input type="range" id="${id}-a"><input type="range" id="${id}-b">
  <div class="seg"><button data-value="1">1</button><button data-value="0">0</button></div>
</div>`;
const fixture = `<!doctype html><html><head><script>
  window.sent = [];
  window.gtag = (kind, name, params) => window.sent.push({ kind, name, ...params });
</script></head><body>
  ${sim('sim-top')}<div style="height:3000px"></div>${sim('sim-far')}
  <script defer src="/runtime/experiments.js" data-book="memorybook"></script>
</body></html>`;

async function open(page) {
  await page.route(`${origin}/**`, (route) => route.fulfill(route.request().url().endsWith('.js')
    ? { contentType: 'text/javascript', body: runtime }
    : { contentType: 'text/html', body: fixture }));
  await page.goto(`${origin}/memory/chapters/dram-cell.html`);
  await page.waitForFunction(() => document.readyState === 'complete');
}
const events = (page) => page.evaluate(() => window.sent.map(({ name, experiment_id }) => `${name} ${experiment_id}`));

test('experiment events: one view per visible sim, start on first use, explore after three controls', async ({ page }) => {
  await open(page);
  await expect.poll(() => events(page)).toEqual(['experiment_view memorybook/dram-cell/sim-top']);

  await page.locator('#sim-top-a').fill('30');
  await page.locator('#sim-top-a').fill('60');
  await page.locator('#sim-top button').first().click();
  expect(await events(page)).toEqual([
    'experiment_view memorybook/dram-cell/sim-top',
    'experiment_start memorybook/dram-cell/sim-top',
  ]);
  await page.locator('#sim-top canvas').click();
  await page.locator('#sim-top-b').fill('10');
  await page.locator('#sim-top button').nth(1).click();
  const all = await events(page);
  expect(all.filter((e) => e.startsWith('experiment_explore'))).toEqual(['experiment_explore memorybook/dram-cell/sim-top']);
  expect(all.filter((e) => e.startsWith('experiment_start'))).toHaveLength(1);
  expect(await page.evaluate(() => window.sent[0])).toMatchObject({ kind: 'event', book_id: 'memorybook' });
});

test('experiment events: a sim scrolled past in under a second is not counted as seen', async ({ page }) => {
  await open(page);
  await expect.poll(() => events(page)).toHaveLength(1);
  await page.evaluate(() => document.getElementById('sim-far').scrollIntoView());
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1300);
  expect(await events(page)).toEqual(['experiment_view memorybook/dram-cell/sim-top']);
});
