/**
 * SiteForge SEO Engine - 健康度检查器
 * 12 项检查，输出 0-100 评分
 */
import type { SiteInfo, PageInfo, HealthCheckResult, HealthIssue } from './types'

export function runHealthCheck(site: SiteInfo, pages: PageInfo[]): HealthCheckResult {
  const issues: HealthIssue[] = []
  let totalChecks = 0
  let passedChecks = 0

  for (const page of pages) {
    // 1. TDK 完整性
    totalChecks++
    if (page.seoMeta?.title && page.seoMeta?.description) {
      passedChecks++
    } else {
      issues.push({
        page: page.url,
        severity: 'error',
        check: 'TDK 完整性',
        message: `页面 "${page.title}" 缺少 ${!page.seoMeta?.title ? 'SEO 标题 ' : ''}${!page.seoMeta?.description ? 'SEO 描述' : ''}`,
        autoFix: true,
      })
    }

    // 2. H1 标签唯一性
    totalChecks++
    const h1Count = (page.html || '').match(/<h1/gi)?.length ?? 0
    if (h1Count === 1) {
      passedChecks++
    } else {
      issues.push({
        page: page.url,
        severity: 'error',
        check: 'H1 标签',
        message: `页面 "${page.title}" 有 ${h1Count} 个 H1，应为 1 个`,
        autoFix: false,
      })
    }

    // 3. H 标签层级
    totalChecks++
    const headings = extractHeadings(page.html || '')
    const hasSkip = checkHeadingSkip(headings)
    if (!hasSkip && headings.length > 0) {
      passedChecks++
    } else if (hasSkip) {
      issues.push({
        page: page.url,
        severity: 'warning',
        check: 'H 标签层级',
        message: `页面 "${page.title}" 标题层级有跳级`,
        autoFix: false,
      })
    }

    // 4. 图片 alt
    totalChecks++
    const images = (page.html || '').match(/<img[^>]*>/gi) ?? []
    const imagesWithoutAlt = images.filter(
      (img) => !img.includes('alt=') || img.includes('alt=""'),
    )
    if (imagesWithoutAlt.length === 0 && images.length > 0) {
      passedChecks++
    } else if (imagesWithoutAlt.length > 0) {
      issues.push({
        page: page.url,
        severity: 'warning',
        check: '图片 alt',
        message: `页面 "${page.title}" 有 ${imagesWithoutAlt.length} 个图片缺少 alt 文本`,
        autoFix: true,
      })
    }

    // 5. canonical 标签
    totalChecks++
    if (page.seoMeta?.canonical) {
      passedChecks++
    } else {
      issues.push({
        page: page.url,
        severity: 'warning',
        check: 'canonical 标签',
        message: `页面 "${page.title}" 缺少 canonical 标签`,
        autoFix: true,
      })
    }

    // 6. HTTPS
    totalChecks++
    if (site.ssl) {
      passedChecks++
    } else {
      issues.push({
        page: page.url,
        severity: 'error',
        check: 'HTTPS',
        message: '站点未启用 HTTPS',
        autoFix: false,
      })
    }

    // 7. sitemap 可达性
    totalChecks++
    if (site.sitemapGenerated) {
      passedChecks++
    } else {
      issues.push({
        page: '/',
        severity: 'warning',
        check: 'sitemap',
        message: 'sitemap.xml 未生成',
        autoFix: true,
      })
    }

    // 8. robots.txt
    totalChecks++
    if (site.robotsGenerated) {
      passedChecks++
    } else {
      issues.push({
        page: '/robots.txt',
        severity: 'warning',
        check: 'robots.txt',
        message: 'robots.txt 未生成',
        autoFix: true,
      })
    }

    // 9. AI 爬虫放行（GEO 检查）
    totalChecks++
    if (site.allowAiCrawlers) {
      passedChecks++
    } else {
      issues.push({
        page: '/robots.txt',
        severity: 'warning',
        check: 'AI 爬虫放行（GEO）',
        message: 'robots.txt 未放行 AI 爬虫（GPTBot/ClaudeBot/PerplexityBot），影响 GEO 效果',
        autoFix: true,
      })
    }

    // 10. 结构化数据
    totalChecks++
    if (page.schemaInjected) {
      passedChecks++
    } else {
      issues.push({
        page: page.url,
        severity: 'warning',
        check: '结构化数据',
        message: `页面 "${page.title}" 未注入 Schema.org 结构化数据`,
        autoFix: true,
      })
    }

    // 11. 页面体积
    totalChecks++
    const pageSize = (page.html || '').length
    if (pageSize < 2 * 1024 * 1024) {
      passedChecks++
    } else {
      issues.push({
        page: page.url,
        severity: 'warning',
        check: '页面体积',
        message: `页面 "${page.title}" 体积 ${Math.round(pageSize / 1024)} KB，建议 < 2MB`,
        autoFix: true,
      })
    }

    // 12. 内链
    totalChecks++
    const internalLinks = (page.html || '').match(/href="\/[^"]*"/g) ?? []
    if (internalLinks.length >= 2) {
      passedChecks++
    } else {
      issues.push({
        page: page.url,
        severity: 'info',
        check: '内链结构',
        message: `页面 "${page.title}" 内链较少（${internalLinks.length} 个），建议增加内部链接`,
        autoFix: false,
      })
    }
  }

  const score = Math.round((passedChecks / Math.max(totalChecks, 1)) * 100)
  const level = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'

  return {
    score,
    level,
    totalChecks,
    passedChecks,
    issues,
    checkedAt: new Date().toISOString(),
  }
}

function extractHeadings(html: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = []
  const regex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    headings.push({ level: parseInt(match[1]), text: match[2].replace(/<[^>]+>/g, '') })
  }
  return headings
}

function checkHeadingSkip(headings: { level: number }[]): boolean {
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level > headings[i - 1].level + 1) return true
  }
  return false
}
