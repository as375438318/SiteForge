import { Injectable } from '@nestjs/common'

// 内联 SEO 引擎核心逻辑（生产环境从 @siteforge/seo 导入）
function generateSitemap(site: any, pages: any[] = []): string {
  const urls: string[] = []
  for (const page of pages) {
    const lastmod = page.updatedAt || new Date().toISOString().split('T')[0]
    const priority = page.priority || (page.url === '/' ? '1.0' : '0.8')
    urls.push(`  <url>\n    <loc>https://${site.domain}${page.url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`)
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
}

const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'CCBot', 'Google-Extended', 'PerplexityBot', 'Applebot-Extended']

function generateRobots(site: any, allowAi = true): string {
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /admin/', '']
  if (allowAi) { for (const bot of AI_CRAWLERS) { lines.push(`User-agent: ${bot}`, 'Allow: /', '') } }
  lines.push(`Sitemap: https://${site.domain}/sitemap.xml`)
  return lines.join('\n')
}

function generateSchema(site: any, page?: any): string[] {
  const schemas: any[] = [{
    '@context': 'https://schema.org', '@type': 'Organization',
    name: site.name, url: `https://${site.domain}`,
    description: site.description || '', ...(site.phone ? { telephone: site.phone } : {}),
  }]
  if (page?.faqs) {
    schemas.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: page.faqs.map((f: any) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) })
  }
  return schemas.map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`).join('\n') as any
}

function runHealthCheck(site: any, pages: any[]) {
  const issues: any[] = []
  let total = 0, passed = 0
  for (const page of pages) {
    total++; if (page.seoMeta?.title && page.seoMeta?.description) passed++
    else issues.push({ page: page.url, severity: 'error', check: 'TDK', message: '缺少TDK', autoFix: true })
    total++; const h1 = (page.html || '').match(/<h1/gi)?.length || 0; if (h1 === 1) passed++
    else issues.push({ page: page.url, severity: 'error', check: 'H1', message: `H1数量${h1}`, autoFix: false })
    total++; if (site.ssl) passed++
    else issues.push({ page: page.url, severity: 'error', check: 'HTTPS', message: '未启用', autoFix: false })
    total++; if (site.sitemapGenerated) passed++
    else issues.push({ page: '/', severity: 'warning', check: 'sitemap', message: '未生成', autoFix: true })
    total++; if (site.allowAiCrawlers) passed++
    else issues.push({ page: '/robots.txt', severity: 'warning', check: 'AI爬虫', message: '未放行AI爬虫', autoFix: true })
  }
  const score = Math.round((passed / Math.max(total, 1)) * 100)
  return { score, level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor', totalChecks: total, passedChecks: passed, issues, checkedAt: new Date().toISOString() }
}

@Injectable()
export class SeoService {
  generateSitemap(site: any, pages?: any[]) { return generateSitemap(site, pages) }
  generateRobots(site: any, allowAi?: boolean) { return generateRobots(site, allowAi) }
  generateSchema(site: any, page?: any) { return generateSchema(site, page) }
  generateAll(site: any, page?: any) {
    return { sitemap: generateSitemap(site, site.pages), robots: generateRobots(site, site.allowAiCrawlers), schema: generateSchema(site, page) }
  }
  healthCheck(site: any, pages: any[]) { return runHealthCheck(site, pages) }
}
