/**
 * SiteForge SEO Engine - URL slug 规范化
 */

export function generateSlug(title: string): string {
  if (!title) return ''

  let slug = title
    .trim()
    .toLowerCase()
    // 中文 → 保留（生产环境可用 pinyin 库转换，此处简化）
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // 如果全是中文，取前 20 个字符
  if (/^[\u4e00-\u9fa5]+$/.test(slug) && slug.length > 20) {
    slug = slug.substring(0, 20)
  }

  return slug
}
