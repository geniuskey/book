import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile(new URL('../runtime/topbar.js', import.meta.url), 'utf8')
const css = await readFile(new URL('../runtime/topbar.css', import.meta.url), 'utf8')

test('topbar runtime installs EuiyunBook.topbar and keeps a series shelf set before or after it loads', () => {
  const before = { EuiyunBook: { shelf: { href: '/', label: '서가', title: '서가' } } }
  vm.runInNewContext(source, { window: before })
  assert.equal(typeof before.EuiyunBook.topbar, 'function')
  assert.equal(before.EuiyunBook.shelf.label, '서가')
  const fresh = {}
  vm.runInNewContext(source, { window: fresh })
  assert.equal(typeof fresh.EuiyunBook.topbar, 'function')
})

test('topbar stylesheet covers the standard parts and breakpoints', () => {
  for (const selector of ['.bk-topbar', '.bk-nav-left', '.bk-nav-right', '.bk-logo', '.bk-btn', '.bk-shelf', '.bk-search', '.bk-progress', '.bk-keep']) {
    assert.ok(css.includes(selector), selector)
  }
  for (const width of ['760px', '600px', '440px']) assert.ok(css.includes(`(max-width: ${width})`), width)
  for (const name of ['bk-topbar', 'bk-nav-left', 'bk-search', 'bk-shelf', 'bk-feedback', 'bk-progress', 'bk-keep', 'bk-label']) {
    assert.ok(source.includes(name), name)
  }
})
