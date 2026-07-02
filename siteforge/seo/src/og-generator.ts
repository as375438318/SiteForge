/**
 * SiteForge SEO Engine - Open Graph 标签生成
 */
import type { PageInfo, SiteInfo, OgTags } from './types'

export function generateOgTags(page: PageInfo, site: SiteInfo): OgTags {
  const title = page.seoMeta?.ogTitle || page.seoMeta?.title || page.title || site.name
  const description =
    page.seoMeta?.ogDescription ||
    page.seoMeta?.description ||
    site.description ||
    ''
  const url = `https://${site.domain}${page.url}`
  const image = page.seoMeta?.ogImage || site.logo || undefined

  const tags: OgTags = {
    'og:title': title,
    'og:description': description,
    'og:url': url,
    'og:type': page.url === '/' ? 'website' : 'article',
  }
  if (image) tags['og:image'] = image

  return tags
}

export function renderOgTags(tags: OgTags): string {
  return Object.entries(tags)
    .map(([key, value]) => `  <meta property="${key}" content="${escapeHtml(value)}">`)
    .join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
