import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile(new URL('../runtime/ui.js', import.meta.url), 'utf8')
const css = await readFile(new URL('../runtime/ui.css', import.meta.url), 'utf8')

test('ui runtime installs every part and keeps a series shelf set before or after it loads', () => {
  const before = { EuiyunBook: { shelf: { href: '/', label: '서가', title: '서가', back: '← 서가로' } } }
  vm.runInNewContext(source, { window: before })
  for (const part of ['topbar', 'drawer', 'pager', 'footer']) assert.equal(typeof before.EuiyunBook[part], 'function', part)
  assert.equal(before.EuiyunBook.shelf.label, '서가')
  const fresh = {}
  vm.runInNewContext(source, { window: fresh })
  assert.equal(typeof fresh.EuiyunBook.topbar, 'function')
})

test('ui stylesheet covers the standard parts and breakpoints', () => {
  for (const selector of ['.bk-topbar', '.bk-nav-left', '.bk-nav-right', '.bk-logo', '.bk-btn', '.bk-shelf', '.bk-search', '.bk-progress', '.bk-keep',
    '.bk-drawer', '.bk-drawer-backdrop', 'body.drawer-open .bk-drawer', '.bk-chlist', '.bk-part', '.bk-drawer-shelf', '.bk-pager', '.bk-foot']) {
    assert.ok(css.includes(selector), selector)
  }
  for (const width of ['760px', '640px', '600px', '440px']) assert.ok(css.includes(`(max-width: ${width})`), width)
  for (const name of ['bk-topbar', 'bk-search', 'bk-shelf', 'bk-feedback', 'bk-keep', 'bk-drawer', 'bk-part', 'bk-pager', 'bk-foot']) {
    assert.ok(source.includes(name), name)
  }
})

test('a series can replace the search and add drawer entries', () => {
  assert.ok(source.includes('NS.search') && source.includes('wireProvider'), 'search provider hook')
  assert.ok(source.includes('NS.drawerExtra'), 'series drawer entries')
  for (const selector of ['.bk-sr-type', '.bk-sr-text', '.bk-sr-foot', '.bk-search-results mark']) assert.ok(css.includes(selector), selector)
})
