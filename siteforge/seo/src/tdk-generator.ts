/**
 * SiteForge SEO Engine - TDK 自动生成
 */
import type { PageInfo, SiteInfo, TdkResult } from './types'

export function generateTdk(page: PageInfo, site: SiteInfo): TdkResult {
  // 标题：页面标题 + 站点名称，≤ 60 字符
  let title = page.seoMeta?.title || page.title || site.name
  if (!title.includes(site.name) && title.length < 50) {
    title = `${title} - ${site.name}`
  }
  if (title.length > 60) {
    title = title.substring(0, 57) + '...'
  }

  // 描述：从页面内容或站点描述生成，≤ 160 字符
  let description =
    page.seoMeta?.description ||
    site.description ||
    `${site.name}提供专业的产品和服务。`

  // 尝试从 HTML 提取摘要
  if (!page.seoMeta?.description && page.html) {
    const plainText = page.html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (plainText.length > 20) {
      description = plainText.substring(0, 157) + '...'
    }
  }

  if (description.length > 160) {
    description = description.substring(0, 157) + '...'
  }

  return { title, description }
}
