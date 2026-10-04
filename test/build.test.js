import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildBook } from '../src/build.js'

const make = () => mkdtemp(join(tmpdir(), 'euiyun-book-'))

test('build preserves the source and emits one beacon, SEO, sitemap and CNAME', async () => {
  const root = await make()
  try {
    await mkdir(join(root, 'chapters'))
    await writeFile(join(root, 'book.json'), JSON.stringify({ id: 'testbook', title: 'TestBook', description: 'A book', domain: 'testbook.euiyun.com' }))
    await writeFile(join(root, 'CNAME'), 'testbook.euiyun.com\n')
    await writeFile(join(root, '.nojekyll'), '')
    await writeFile(join(root, 'favicon.svg'), '<svg/>')
    const source = '<!doctype html><html><head><title>TestBook</title><script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token":"old"}\'></script></head><body>Content</body></html>'
    await writeFile(join(root, 'index.html'), source)
    await writeFile(join(root, 'chapters', 'first.html'), '<html><head><title>First · TestBook</title></head><body>First</body></html>')
    const result = await buildBook(root)
    assert.equal(result.pages, 2)
    assert.equal(await readFile(join(root, 'index.html'), 'utf8'), source)
    const output = await readFile(join(root, '.book-dist', 'index.html'), 'utf8')
    assert.equal((output.match(/beacon\.min\.js/g) || []).length, 1)
    assert.match(output, /rel="canonical" href="https:\/\/testbook\.euiyun\.com\/"/)
    assert.match(output, /property="og:title"/)
    assert.match(output, /type="application\/ld\+json"/)
    assert.match(await readFile(join(root, '.book-dist', 'sitemap.xml'), 'utf8'), /chapters\/first\.html/)
    assert.equal(await readFile(join(root, '.book-dist', 'CNAME'), 'utf8'), 'testbook.euiyun.com\n')
    await readFile(join(root, '.book-dist', '.nojekyll'))
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('build rejects a domain mismatch', async () => {
  const root = await make()
  try {
    await writeFile(join(root, 'book.json'), JSON.stringify({ id: 'testbook', title: 'T', description: 'D', domain: 'testbook.euiyun.com' }))
    await writeFile(join(root, 'CNAME'), 'otherbook.euiyun.com')
    await assert.rejects(buildBook(root), /differs/)
  } finally { await rm(root, { recursive: true, force: true }) }
})
