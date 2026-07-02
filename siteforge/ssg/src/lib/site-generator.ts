/**
 * SiteForge - 静态站点生成器（TypeScript 重写版）
 *
 * 复用原型 siteforge-prototype/src/ssg/site-generator.js 的逻辑，
 * 用 TypeScript 重写，类型安全。
 *
 * 职责：
 *   generateSite(siteData) - 接收站点数据，生成全部页面 HTML + sitemap.xml + robots.txt + llms.txt
 *   注入 SEO 标签（TDK / canonical / OG / Schema.org JSON-LD）
 *   注入 GEO 标签（语义化 HTML / 权威信号 / AI 爬虫放行）
 *
 * 在 Astro 项目中：
 *   - 开发/预览场景：通过 Astro 页面 + SiteLayout.astro 渲染（推荐）
 *   - 离线生成场景：通过本文件直接生成 HTML 字符串（用于后端 SSG Worker 调用）
 */

import {
  renderPageBody,
} from '@lib/block-renderer'
import {
  generateSitemap,
  generateRobotsTxt,
  generateSchema,
  runHealthCheck,
  type ContentEntry,
  type Breadcrumb,
} from '@lib/seo-engine'
import {
  generateLlmsTxt,
  generateLlmsFullTxt,
} from '@lib/llms-txt-generator'
import { siteDataSchema, type SiteData, type Page } from '@shared/block-schema'

// ============================================================================
// 站点 CSS（与 src/styles/global.css 内容保持一致；离线生成时内联）
// ============================================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STYLES_PATH = resolve(__dirname, '../styles/global.css')

function loadSiteCss(): string {
  try {
    return readFileSync(STYLES_PATH, 'utf-8')
  } catch {
    // 降级：返回最小样式
    return `*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;line-height:1.6}`
  }
}

// ============================================================================
// 类型定义
// ============================================================================

export interface GeneratePageOptions {
  content?: ContentEntry
  breadcrumbs?: Breadcrumb[]
}

export interface GenerateSiteResult {
  /** 页面路径 → HTML 内容 */
  pages: Record<string, string>
  /** sitemap.xml 内容 */
  sitemap: string
  /** robots.txt 内容 */
  robots: string
  /** llms.txt 内容（精简版） */
  llmsTxt: string
  /** llms-full.txt 内容（完整版） */
  llmsFullTxt: string
  /** 生成统计 */
  stats: {
    pageCount: number
    totalSize: number
    generatedAt: string
  }
  /** SEO 健康度报告 */
  healthReport: ReturnType<typeof runHealthCheck>
}

// ============================================================================
// 导航栏渲染
// ============================================================================

export function renderNavigation(
  navItems: SiteData['navigation'],
  siteName: string,
): string {
  const links = (navItems ?? [])
    .map((item) => `<a href="${escapeAttr(item.url)}">${escapeHtml(item.label)}</a>`)
    .join('')
  return `<nav class="site-nav" aria-label="主导航">
    <div class="site-nav-inner">
      <a href="/" class="site-nav-logo">${escapeHtml(siteName || 'SiteForge')}</a>
      <div class="site-nav-links">${links}</div>
    </div>
  </nav>`
}

// ============================================================================
// 单页 HTML 生成
// ============================================================================

export function generatePage(
  site: SiteData,
  page: Page,
  options: GeneratePageOptions = {},
): string {
  const bodyContent = renderPageBody(page.blocks ?? [])
  const nav = renderNavigation(site.navigation, site.name)
  const schemaJsonld = generateSchema(
    site,
    page,
    options.content ?? null,
    options.breadcrumbs ?? null,
  )

  // SEO meta
  const seoTitle = page.seoMeta?.title || page.title || site.name
  const seoDesc = page.seoMeta?.description || site.description || ''
  const canonical = page.seoMeta?.canonical || `https://${site.domain}${page.url}`
  const ogImage = page.seoMeta?.ogImage || site.logo || ''
  const noindex = page.seoMeta?.noindex ?? false
  const keywords = page.seoMeta?.keywords ?? []

  // CSS（离线生成时内联）
  const siteCss = loadSiteCss()

  // GEO：内容语言声明（提升 AI 可读性）
  // SEO：TDK + canonical + OG + Twitter Card + Schema.org
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="content-language" content="zh-CN">
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="description" content="${escapeAttr(seoDesc)}">
  ${keywords.length > 0 ? `<meta name="keywords" content="${escapeAttr(keywords.join(', '))}">` : ''}
  <link rel="canonical" href="${escapeAttr(canonical)}">
  ${noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow">'}
  <meta name="author" content="${escapeAttr(site.name)}">
  <meta name="publisher" content="${escapeAttr(site.name)}">
  <meta property="og:title" content="${escapeAttr(seoTitle)}">
  <meta property="og:description" content="${escapeAttr(seoDesc)}">
  <meta property="og:url" content="${escapeAttr(canonical)}">
  <meta property="og:type" content="${options.content?.type === 'post' ? 'article' : 'website'}">
  <meta property="og:site_name" content="${escapeAttr(site.name)}">
  ${ogImage ? `<meta property="og:image" content="${escapeAttr(ogImage)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(seoTitle)}">
  <meta name="twitter:description" content="${escapeAttr(seoDesc)}">
  ${ogImage ? `<meta name="twitter:image" content="${escapeAttr(ogImage)}">` : ''}
  ${site.logo ? `<link rel="icon" type="image/svg+xml" href="${escapeAttr(site.logo)}">` : ''}
  <style>${siteCss}</style>
  ${schemaJsonld}
</head>
<body>
  ${nav}
  <main>
    ${bodyContent}
  </main>
  <aside class="sr-only" aria-hidden="true">
    <p>本页面内容由 ${escapeHtml(site.name)} 发布，转载请注明出处：${escapeHtml(canonical)}</p>
  </aside>
</body>
</html>`
}

// ============================================================================
// 完整静态站点生成
// ============================================================================

export function generateSite(rawSiteData: unknown): GenerateSiteResult {
  // 入参校验
  const site = siteDataSchema.parse(rawSiteData)

  const pages: Record<string, string> = {}
  const pagesHtml: Array<{ page: Page; html: string }> = []

  // 生成每个页面
  for (const page of site.pages ?? []) {
    const html = generatePage(site, page)
    pages[page.url] = html
    pagesHtml.push({ page, html })
  }

  // sitemap.xml
  const sitemap = generateSitemap(site)

  // robots.txt（含 AI 爬虫放行 = GEO 关键）
  const robots = generateRobotsTxt(site)

  // llms.txt + llms-full.txt（GEO 关键）
  const llmsTxt = generateLlmsTxt(site)
  const llmsFullTxt = generateLlmsFullTxt(site)

  // SEO 健康度检查
  const healthReport = runHealthCheck(site, pagesHtml)

  return {
    pages,
    sitemap,
    robots,
    llmsTxt,
    llmsFullTxt,
    stats: {
      pageCount: Object.keys(pages).length,
      totalSize: Object.values(pages).reduce((s, h) => s + h.length, 0),
      generatedAt: new Date().toISOString(),
    },
    healthReport,
  }
}

// ============================================================================
// HTML 转义工具
// ============================================================================

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}

// ============================================================================
// CLI 入口：tsx src/lib/site-generator.ts <site-data.json> <output-dir>
// ============================================================================

async function main() {
  const [inputPath, outputDir] = process.argv.slice(2)
  if (!inputPath || !outputDir) {
    console.error('用法: tsx src/lib/site-generator.ts <site-data.json> <output-dir>')
    process.exit(1)
  }

  const { readFile, writeFile, mkdir } = await import('node:fs/promises')
  const { resolve: resolvePath } = await import('node:path')

  const raw = await readFile(resolvePath(inputPath), 'utf-8')
  const siteData = JSON.parse(raw)

  const result = generateSite(siteData)

  await mkdir(resolvePath(outputDir), { recursive: true })

  // 写入页面
  for (const [url, html] of Object.entries(result.pages)) {
    const filePath = resolvePath(
      outputDir,
      url === '/' ? 'index.html' : `${url.replace(/^\//, '')}.html`,
    )
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, html, 'utf-8')
    console.log(`✓ ${url} → ${filePath}`)
  }

  // 写入 sitemap / robots / llms.txt
  await writeFile(resolvePath(outputDir, 'sitemap.xml'), result.sitemap, 'utf-8')
  await writeFile(resolvePath(outputDir, 'robots.txt'), result.robots, 'utf-8')
  await writeFile(resolvePath(outputDir, 'llms.txt'), result.llmsTxt, 'utf-8')
  await writeFile(resolvePath(outputDir, 'llms-full.txt'), result.llmsFullTxt, 'utf-8')

  console.log('\n=== 生成完成 ===')
  console.log(`页面数: ${result.stats.pageCount}`)
  console.log(`总大小: ${(result.stats.totalSize / 1024).toFixed(2)} KB`)
  console.log(`SEO 健康度: ${result.healthReport.score}/100 (${result.healthReport.level})`)
  if (result.healthReport.issues.length > 0) {
    console.log(`\n问题列表 (${result.healthReport.issues.length}):`)
    for (const issue of result.healthReport.issues) {
      console.log(`  [${issue.severity}] ${issue.page}: ${issue.message}`)
    }
  }
}

// 仅在直接执行时运行 CLI
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
