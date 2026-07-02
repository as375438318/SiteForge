/**
 * SiteForge - SEO 引擎
 * 技术 SEO 自动化：sitemap、robots.txt、Schema.org、健康度检查
 */

// ========== sitemap.xml 生成 ==========
function generateSitemap(site) {
  const urls = []

  for (const page of (site.pages || [])) {
    urls.push(`  <url>
    <loc>https://${site.domain}${page.url}</loc>
    <lastmod>${page.updatedAt || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq || 'weekly'}</changefreq>
    <priority>${page.priority || '0.8'}</priority>
  </url>`)
  }

  for (const content of (site.contents || []).filter(c => c.status === 'published')) {
    const basePath = content.type === 'product' ? '/products' : content.type === 'case' ? '/cases' : '/posts'
    urls.push(`  <url>
    <loc>https://${site.domain}${basePath}/${content.slug}</loc>
    <lastmod>${content.updatedAt || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}

// ========== robots.txt 生成 ==========
// GEO 关键：主动放行 AI 爬虫
function generateRobotsTxt(site) {
  const lines = []

  // 默认放行
  lines.push('User-agent: *')
  lines.push('Allow: /')
  lines.push('Disallow: /admin/')
  lines.push('')

  // ✅ 主动放行 AI 爬虫（GEO 关键！）
  const aiBots = [
    { agent: 'GPTBot', platform: 'ChatGPT' },
    { agent: 'OAI-SearchBot', platform: 'ChatGPT Search' },
    { agent: 'ChatGPT-User', platform: 'ChatGPT' },
    { agent: 'ClaudeBot', platform: 'Claude' },
    { agent: 'Claude-SearchBot', platform: 'Claude Search' },
    { agent: 'CCBot', platform: 'Common Crawl' },
    { agent: 'Google-Extended', platform: 'Google AI' },
    { agent: 'PerplexityBot', platform: 'Perplexity' },
    { agent: 'Applebot-Extended', platform: 'Apple Intelligence' },
  ]

  for (const bot of aiBots) {
    lines.push(`# ${bot.platform}`)
    lines.push(`User-agent: ${bot.agent}`)
    lines.push('Allow: /')
    lines.push('')
  }

  lines.push(`Sitemap: https://${site.domain}/sitemap.xml`)

  return lines.join('\n')
}

// ========== Schema.org JSON-LD 生成 ==========
function generateSchema(site, page, content) {
  const schemas = []

  // 全站 Organization schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: `https://${site.domain}`,
    logo: site.logo || '',
    description: site.description || '',
    sameAs: site.socialLinks || [],
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.email ? { email: site.email } : {}),
    ...(site.address ? { address: { '@type': 'PostalAddress', addressLocality: site.address } } : {}),
  })

  // 页面级 schema
  if (content) {
    if (content.type === 'product') {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: content.title,
        description: content.summary || '',
        brand: { '@type': 'Brand', name: site.name },
        image: content.coverImage || '',
      })
    } else if (content.type === 'post' || content.type === 'case') {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: content.title,
        image: content.coverImage || '',
        publisher: {
          '@type': 'Organization',
          name: site.name,
          logo: { '@type': 'ImageObject', url: site.logo || '' },
        },
      }
      if (content.meta) {
        if (content.meta.author) {
          schema.author = {
            '@type': 'Person',
            name: content.meta.author,
            ...(content.meta.authorTitle ? { jobTitle: content.meta.authorTitle } : {}),
          }
        }
        if (content.meta.publishedAt) schema.datePublished = content.meta.publishedAt
        if (content.meta.updatedAt) schema.dateModified = content.meta.updatedAt
      }
      schemas.push(schema)
    }
  }

  // FAQ schema
  if (page && page.type === 'faq' && page.faqs) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    })
  }

  // Breadcrumb schema
  if (page && page.breadcrumbs) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumbs.map((bc, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: bc.name,
        item: `https://${site.domain}${bc.url}`,
      })),
    })
  }

  return schemas.map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`).join('\n')
}

// ========== SEO 健康度检查 ==========
function runHealthCheck(site, pages) {
  const issues = []
  let totalChecks = 0
  let passedChecks = 0

  for (const page of pages) {
    // TDK 完整性
    totalChecks++
    if (page.seoMeta && page.seoMeta.title && page.seoMeta.description) {
      passedChecks++
    } else {
      issues.push({
        page: page.url,
        severity: 'error',
        check: 'TDK 完整性',
        message: `页面 "${page.title}" 缺少 ${!page.seoMeta?.title ? 'SEO 标题' : ''} ${!page.seoMeta?.description ? 'SEO 描述' : ''}`,
        autoFix: true,
      })
    }

    // H1 标签
    totalChecks++
    const h1Count = (page.html || '').match(/<h1/gi)?.length || 0
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

    // 图片 alt
    totalChecks++
    const images = (page.html || '').match(/<img[^>]*>/gi) || []
    const imagesWithoutAlt = images.filter(img => !img.includes('alt=') || img.includes('alt=""'))
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

    // canonical
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

    // HTTPS
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

    // sitemap 可达
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

    // robots.txt
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

    // AI 爬虫放行（GEO 检查）
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

    // 结构化数据
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
  }

  const score = Math.round((passedChecks / Math.max(totalChecks, 1)) * 100)

  return {
    score,
    level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
    totalChecks,
    passedChecks,
    issues,
    checkedAt: new Date().toISOString(),
  }
}

module.exports = { generateSitemap, generateRobotsTxt, generateSchema, runHealthCheck }
