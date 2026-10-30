// Public GA4 measurement ID shared by the Books sites.
export const measurementId = 'G-LST8C5WL08'
export const analyticsSource = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
export const analyticsTag = `<!-- Google tag (gtag.js) -->
<script async src="${analyticsSource}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${measurementId}');
</script>`

const cloudflareBeacon = /<script\b(?=[^>]*\bsrc\s*=\s*["']https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js["'])[^>]*>\s*<\/script>\s*/gi

export function stripAnalytics(html) {
  return html.replace(cloudflareBeacon, '')
    .replace(/<!--\s*(?:End )?Cloudflare Web Analytics\s*-->\s*/gi, '')
    .replaceAll(analyticsTag, '')
}
