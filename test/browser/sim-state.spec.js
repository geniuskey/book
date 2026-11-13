import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../runtime/sim-state.js', import.meta.url), 'utf8');
const origin = 'https://book.test';
const fixture = (model) => `<!doctype html><html><head><script>
  window.sent = [];
  window.gtag = (kind, name, params) => window.sent.push(name);
</script></head><body>
  <div class="sim" id="sim-a"${model ? ` data-model="${model}"` : ''}>
    <div class="sim-head"><h3>A</h3><a class="sim-link" href="#sim-a">#</a></div>
    <div class="seg" id="mode"><button data-value="x" class="on">x</button><button data-value="y">y</button></div>
    <input type="range" id="cs" min="0" max="100" value="10">
    <input type="checkbox" id="leak" checked>
    <select id="kind"><option>p</option><option>q</option></select>
    <output id="out"></output>
  </div>
  <div class="sim" id="sim-b"><div class="sim-head"><h3>B</h3></div><input type="range" id="b" value="5"></div>
  <script>
    // Like a book's own simulator code: it reacts to control events and keeps the segmented buttons in sync.
    document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
      b.parentElement.querySelectorAll('button').forEach((o) => o.classList.toggle('on', o === b));
      draw();
    }));
    const draw = () => { out.textContent = [document.querySelector('#mode .on').dataset.value, cs.value, leak.checked, kind.value].join(','); };
    for (const n of [cs, leak, kind]) n.addEventListener('input', draw);
    draw();
  </script>
  <script defer src="/runtime/sim-state.js" data-book="memorybook"></script>
</body></html>`;

async function open(page, url, model) {
  await page.route(`${origin}/**`, (route) => route.fulfill(route.request().url().endsWith('.js')
    ? { contentType: 'text/javascript; charset=utf-8', body: runtime }
    : { contentType: 'text/html; charset=utf-8', body: fixture(model) }));
  await page.goto(url);
  await page.locator('#sim-a .bk-sim-share').first().waitFor();
}

test('a settings link reopens the simulator with the same values and can go back to the start', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  await open(page, `${origin}/memory/chapters/dram-cell.html`);
  await page.locator('#mode button[data-value=y]').click();
  await page.locator('#cs').fill('42');
  await page.locator('#leak').uncheck();
  await page.locator('#sim-a .bk-sim-share').click();
  await expect(page.locator('#sim-a .bk-sim-share')).toHaveText('복사했습니다');
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toBe(`${origin}/memory/chapters/dram-cell.html#sim-a?cs=42&leak=0&mode=y`);
  expect(await page.evaluate(() => window.sent)).toEqual(['experiment_share']);

  const other = await context.newPage();
  await open(other, link);
  await expect(other.locator('#out')).toHaveText('y,42,false,p');
  expect(await other.evaluate(() => window.sent)).toEqual(['experiment_shared_open']);
  await other.locator('#sim-a .bk-sim-share', { hasText: '처음 값으로' }).click();
  await expect(other.locator('#out')).toHaveText('x,10,true,p');
  await expect(other.locator('#sim-a .bk-sim-share')).toHaveCount(1);
  expect(new URL(other.url()).hash).toBe('#sim-a');
});

test('a link for an older model still opens and says the model changed; unknown values are ignored', async ({ page }) => {
  await open(page, `${origin}/memory/chapters/dram-cell.html#sim-a?cs=70&gone=3&mode=zzz&_v=1`, '2');
  await expect(page.locator('#out')).toHaveText('x,70,true,p');
  await expect(page.locator('.bk-sim-note')).toContainText('모델이 바뀌었습니다');
});

test('plain anchors and simulators without controls are left alone', async ({ page }) => {
  await open(page, `${origin}/memory/chapters/dram-cell.html#sim-b`);
  await expect(page.locator('#out')).toHaveText('x,10,true,p');
  expect(await page.evaluate(() => window.sent)).toEqual([]);
  await expect(page.locator('#sim-b .bk-sim-share.bk-push')).toHaveCount(1);
});
