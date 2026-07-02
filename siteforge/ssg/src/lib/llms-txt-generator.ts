/**
 * SiteForge - llms.txt 生成器（GEO 关键）
 *
 * llms.txt 是面向 LLM 的网站摘要文件（类似 robots.txt 但面向 AI），
 * 帮助 AI 爬虫快速理解站点结构与核心信息。
 *
 * 规范参考：https://llmstxt.org
 */

import type { SiteData } from '@shared/block-schema'

/**
 * 生成 llms.txt（精简版）
 * 包含：站点名、描述、关键页面链接
 */
export function generateLlmsTxt(site: SiteData): string {
  const lines: string[] = []

  lines.push(`# ${site.name}`)
  lines.push('')
  if (site.description) {
    lines.push(`> ${site.description}`)
    lines.push('')
  }

  // 关键页面链接
  lines.push('## Pages')
  for (const page of site.pages ?? []) {
    const desc = page.seoMeta?.description ?? page.title
    lines.push(`- [${page.title}](https://${site.domain}${page.url}): ${desc}`)
  }
  lines.push('')

  // 联系方式
  if (site.phone || site.email || site.address) {
    lines.push('## Contact')
    if (site.phone) lines.push(`- Phone: ${site.phone}`)
    if (site.email) lines.push(`- Email: ${site.email}`)
    if (site.address) lines.push(`- Address: ${site.address}`)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * 生成 llms-full.txt（完整版）
 * 包含：站点所有页面 + 内容摘要，便于 AI 一次性抓取
 */
export function generateLlmsFullTxt(site: SiteData): string {
  const lines: string[] = []

  lines.push(`# ${site.name} - Full Content`)
  lines.push('')
  lines.push(`URL: https://${site.domain}`)
  if (site.description) {
    lines.push(`Description: ${site.description}`)
  }
  lines.push('')

  // 页面摘要
  lines.push('## Pages')
  for (const page of site.pages ?? []) {
    lines.push('')
    lines.push(`### ${page.title}`)
    lines.push(`URL: https://${site.domain}${page.url}`)
    if (page.seoMeta?.description) {
      lines.push(`Description: ${page.seoMeta.description}`)
    }
    // 列出页面包含的区块类型
    const blockTypes = (page.blocks ?? []).map((b) => b.type)
    if (blockTypes.length > 0) {
      lines.push(`Blocks: ${blockTypes.join(', ')}`)
    }
  }
  lines.push('')

  // 已发布内容摘要
  const published = (site.contents ?? []).filter((c) => c.status === 'published')
  if (published.length > 0) {
    lines.push('## Published Content')
    for (const c of published) {
      const basePath =
        c.type === 'product' ? '/products' : c.type === 'case' ? '/cases' : '/posts'
      lines.push('')
      lines.push(`### ${c.title}`)
      lines.push(`URL: https://${site.domain}${basePath}/${c.slug}`)
      lines.push(`Type: ${c.type}`)
      if (c.summary) lines.push(`Summary: ${c.summary}`)
      if (c.meta?.author) lines.push(`Author: ${c.meta.author}`)
      if (c.meta?.publishedAt) lines.push(`Published: ${c.meta.publishedAt}`)
    }
  }

  return lines.join('\n')
}
