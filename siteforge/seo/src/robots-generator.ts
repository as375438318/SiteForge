/**
 * SiteForge SEO Engine - robots.txt 生成器
 * GEO 关键：默认放行 9 个 AI 爬虫
 */
import type { SiteInfo } from './types'
import { AI_CRAWLER_WHITELIST } from './types'

export interface RobotsConfig {
  disallowPaths?: string[]
  allowAiCrawlers?: boolean
  customRules?: string[]
}

export function generateRobotsTxt(site: SiteInfo, config: RobotsConfig = {}): string {
  const lines: string[] = []
  const disallowPaths = config.disallowPaths ?? ['/admin/']
  const allowAi = config.allowAiCrawlers ?? site.allowAiCrawlers ?? true

  // 默认规则
  lines.push('User-agent: *')
  lines.push('Allow: /')
  for (const path of disallowPaths) {
    lines.push(`Disallow: ${path}`)
  }
  lines.push('')

  // AI 爬虫放行（GEO 关键设计）
  if (allowAi) {
    for (const bot of AI_CRAWLER_WHITELIST) {
      lines.push(`# ${bot.platform}`)
      lines.push(`User-agent: ${bot.agent}`)
      lines.push('Allow: /')
      lines.push('')
    }
  }

  // 自定义规则
  if (config.customRules) {
    lines.push(...config.customRules)
    lines.push('')
  }

  // Sitemap 引用
  lines.push(`Sitemap: https://${site.domain}/sitemap.xml`)

  return lines.join('\n')
}
