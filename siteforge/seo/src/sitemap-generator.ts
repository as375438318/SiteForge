/**
 * SiteForge SEO Engine - sitemap.xml 生成器
 */
import type { SiteInfo, PageInfo, ContentInfo } from './types'

export function generateSitemap(
  site: SiteInfo,
  pages: PageInfo[] = [],
  contents: ContentInfo[] = [],
): string {
  const urls: string[] = []

  for (const page of pages) {
    const lastmod = page.updatedAt || new Date().toISOString().split('T')[0]
    const priority = page.priority || (page.url === '/' ? '1.0' : '0.8')
    const changefreq = page.changefreq || 'weekly'
    urls.push(
      `  <url>\n    <loc>https://${site.domain}${page.url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    )
  }

  for (const content of contents.filter((c) => c.status === 'published')) {
    const basePath =
      content.type === 'product' ? '/products' : content.type === 'case' ? '/cases' : '/posts'
    const lastmod = content.updatedAt || new Date().toISOString().split('T')[0]
    urls.push(
      `  <url>\n    <loc>https://${site.domain}${basePath}/${content.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    )
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}
