/**
 * SiteForge - llms.txt 生成器
 * 基于 llms.txt 规范 (Jeremy Howard, llmld.org)
 * 生成 llms.txt (简洁版) 和 llms-full.txt (详细版)
 */

function generateLlmsTxt(site) {
  const lines = []

  // 标题
  lines.push(`# ${site.name}`)
  lines.push('')

  // 简介
  lines.push(`> ${site.description || '企业官方网站'}`)
  lines.push('')

  // 主要内容
  lines.push('## 主要内容')
  lines.push('')

  const pages = site.pages || []
  for (const page of pages) {
    lines.push(`- ${page.title}: https://${site.domain}${page.url} - ${page.summary || ''}`)
  }

  // 核心资源
  const posts = (site.contents || []).filter(c => c.type === 'post' && c.status === 'published')
  if (posts.length > 0) {
    lines.push('')
    lines.push('## 核心资源')
    lines.push('')
    for (const post of posts.slice(0, 5)) {
      lines.push(`- ${post.title}: https://${site.domain}/posts/${post.slug} - ${(post.summary || '').substring(0, 80)}`)
    }
  }

  // FAQ
  const faqPages = pages.filter(p => p.type === 'faq')
  if (faqPages.length > 0) {
    if (!lines.includes('## 核心资源')) {
      lines.push('')
      lines.push('## 核心资源')
      lines.push('')
    }
    lines.push(`- 常见问答: https://${site.domain}/faq - 常见问题解答`)
  }

  // 补充说明
  lines.push('')
  lines.push('## 补充说明')
  lines.push('')
  lines.push(site.geoDescription || site.description || `${site.name} 致力于为客户提供专业的产品和服务。`)

  return lines.join('\n')
}

function generateLlmsFullTxt(site) {
  const lines = []

  lines.push(`# ${site.name} — 完整内容指南`)
  lines.push('')
  lines.push(`> ${site.description || '企业官方网站'}`)
  lines.push('')

  // 企业概况
  lines.push('## 企业概况')
  lines.push('')
  if (site.about) {
    lines.push(site.about.replace(/<[^>]+>/g, ''))
  }
  lines.push('')

  const info = []
  if (site.industry) info.push(`**所属行业**: ${site.industry}`)
  if (site.phone) info.push(`**联系电话**: ${site.phone}`)
  if (site.email) info.push(`**邮箱**: ${site.email}`)
  if (site.address) info.push(`**地址**: ${site.address}`)
  if (info.length > 0) {
    lines.push(info.join('  '))
    lines.push('')
  }

  // 产品与服务
  const products = (site.contents || []).filter(c => c.type === 'product' && c.status === 'published')
  if (products.length > 0) {
    lines.push('## 产品与服务')
    lines.push('')
    for (const product of products) {
      lines.push(`### ${product.title}`)
      lines.push('')
      lines.push(product.summary || '')
      lines.push('')
      if (product.fields) {
        for (const [key, value] of Object.entries(product.fields)) {
          lines.push(`- ${key}: ${value}`)
        }
        lines.push('')
      }
      lines.push(`[查看详情](https://${site.domain}/products/${product.slug})`)
      lines.push('')
    }
  }

  // 成功案例
  const cases = (site.contents || []).filter(c => c.type === 'case' && c.status === 'published')
  if (cases.length > 0) {
    lines.push('## 成功案例')
    lines.push('')
    for (const item of cases) {
      lines.push(`### ${item.title}`)
      lines.push('')
      if (item.fields) {
        if (item.fields.customer) lines.push(`**客户**: ${item.fields.customer}`)
        if (item.fields.industry) lines.push(`**行业**: ${item.fields.industry}`)
        if (item.fields.challenge) lines.push(`**挑战**: ${item.fields.challenge.substring(0, 200)}`)
        if (item.fields.solution) lines.push(`**方案**: ${item.fields.solution.substring(0, 200)}`)
        if (item.fields.result) lines.push(`**成果**: ${item.fields.result.substring(0, 200)}`)
      }
      lines.push('')
      lines.push(`[查看详情](https://${site.domain}/cases/${item.slug})`)
      lines.push('')
    }
  }

  // 专业文章
  const posts = (site.contents || []).filter(c => c.type === 'post' && c.status === 'published')
  if (posts.length > 0) {
    lines.push('## 专业文章')
    lines.push('')
    for (const post of posts) {
      lines.push(`### ${post.title}`)
      lines.push('')
      if (post.meta) {
        if (post.meta.author) lines.push(`**作者**: ${post.meta.author}${post.meta.authorTitle ? ` (${post.meta.authorTitle})` : ''}`)
        if (post.meta.publishedAt) lines.push(`**发布时间**: ${post.meta.publishedAt}`)
      }
      if (post.summary) {
        lines.push('')
        lines.push(post.summary)
      }
      lines.push('')
      lines.push(`[阅读全文](https://${site.domain}/posts/${post.slug})`)
      lines.push('')
    }
  }

  // 联系方式
  lines.push('## 联系我们')
  lines.push('')
  if (site.phone) lines.push(`- 电话: ${site.phone}`)
  if (site.email) lines.push(`- 邮箱: ${site.email}`)
  if (site.address) lines.push(`- 地址: ${site.address}`)
  lines.push(`- 网站: https://${site.domain}`)

  return lines.join('\n')
}

module.exports = { generateLlmsTxt, generateLlmsFullTxt }
