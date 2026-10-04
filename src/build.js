import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { siteToken } from './site-token.js'

const beaconSource = 'https://static.cloudflareinsights.com/beacon.min.js'
const beaconTag = `<script defer src="${beaconSource}" data-cf-beacon='${JSON.stringify({ token: siteToken })}'></script>`
const beaconPattern = /<script\b(?=[^>]*\bsrc\s*=\s*["']https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js["'])[^>]*>\s*<\/script>\s*/gi
const escapeAttribute = value => String(value).replaceAll('&', '&amp;').replaceAll('\"', '&quot;').replaceAll('<', '&lt;')
const excluded = new Set(['.git', '.github', '.book-dist', 'node_modules', 'tools', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'book.json'])

/** Produce an independent GitHub Pages artifact while keeping source HTML intact. */
export async function buildBook(directory = '.') {
  const root = resolve(directory)
  const book = JSON.parse(await readFile(join(root, 'book.json'), 'utf8'))
  for (const key of ['id', 'title', 'description', 'domain']) {
    if (!book[key] || typeof book[key] !== 'string') throw new Error(`book.json needs a string ${key}`)
  }
  if (!/^[a-z0-9-]+\.euiyun\.com$/.test(book.domain)) throw new Error(`Invalid domain: ${book.domain}`)
  const cname = (await readFile(join(root, 'CNAME'), 'utf8')).trim()
  if (cname !== book.domain) throw new Error(`CNAME ${cname} differs from book.json domain ${book.domain}`)
  const output = join(root, '.book-dist')
  await rm(output, { recursive: true, force: true })
  await mkdir(output, { recursive: true })
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (excluded.has(entry.name) || (entry.name.startsWith('.') && entry.name !== '.nojekyll')) continue
    await cp(join(root, entry.name), join(output, entry.name), { recursive: true })
  }
  let pages = 0
  const urls = []
  const origin = `https://${book.domain}`
  const imagePath = book.image || (await fileExists(join(output, 'og.png')) ? '/og.png' : '/favicon.svg')
  const imageUrl = new URL(imagePath, origin).href
  async function processDirectory(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) { await processDirectory(path); continue }
      if (!entry.name.endsWith('.html')) continue
      const original = await readFile(path, 'utf8')
      if (!/<\/head>/i.test(original)) throw new Error(`Missing </head>: ${relative(output, path)}`)
      const page = relative(output, path).split(sep).join('/')
      const url = page === 'index.html' ? `${origin}/` : `${origin}/${page}`
      const title = original.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || book.title
      const description = original.match(/<meta\b[^>]*\bname=[\"']description[\"'][^>]*\bcontent=[\"']([^\"']*)[\"'][^>]*>/i)?.[1] || book.description
      let html = original.replace(beaconPattern, '')
      const additions = []
      const canonical = html.match(/<link\b[^>]*\brel=[\"']canonical[\"'][^>]*\bhref=[\"']([^\"']+)[\"'][^>]*>/i)?.[1]
      if (canonical && canonical !== url) throw new Error(`Canonical ${canonical} differs from ${url}`)
      if (!canonical) additions.push(`<link rel="canonical" href="${url}">`)
      if (!/<meta\b[^>]*\bname=[\"']description[\"']/i.test(html)) additions.push(`<meta name="description" content="${escapeAttribute(description)}">`)
      const metas = {
        'og:type': page === 'index.html' ? 'website' : 'article',
        'og:site_name': book.title,
        'og:title': title,
        'og:description': description,
        'og:url': url,
        'og:image': imageUrl
      }
      for (const [name, content] of Object.entries(metas)) {
        if (!new RegExp(`<meta\\b[^>]*\\bproperty=[\"']${name}[\"']`, 'i').test(html)) additions.push(`<meta property="${name}" content="${escapeAttribute(content)}">`)
      }
      if (!/<meta\b[^>]*\bname=[\"']twitter:card[\"']/i.test(html)) additions.push('<meta name="twitter:card" content="summary_large_image">')
      if (!/<link\b[^>]*\brel=[\"']icon[\"']/i.test(html)) additions.push('<link rel="icon" href="/favicon.svg">')
      if (!/<script\b[^>]*\btype=[\"']application\/ld\+json[\"']/i.test(html)) {
        additions.push(`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': page === 'index.html' ? 'Book' : 'Chapter', name: title, description, url, inLanguage: 'ko', isAccessibleForFree: true })}</script>`)
      }
      additions.push(beaconTag)
      const result = html.replace(/<\/head>/i, `${additions.join('\n')}\n</head>`)
      if ((result.match(/static\.cloudflareinsights\.com\/beacon\.min\.js/g) || []).length !== 1) {
        throw new Error(`Expected one analytics beacon: ${relative(output, path)}`)
      }
      await writeFile(path, result)
      pages++
      urls.push(url)
    }
  }
  await processDirectory(output)
  if (!pages) throw new Error('No HTML pages found')
  if (!await fileExists(join(output, 'sitemap.xml'))) {
    const body = urls.sort().map(url => `  <url><loc>${url}</loc></url>`).join('\n')
    await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)
  }
  if (!await fileExists(join(output, 'robots.txt'))) await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`)
  return { root, output, pages, domain: book.domain }
}

async function fileExists(path) { try { await readFile(path); return true } catch { return false } }
