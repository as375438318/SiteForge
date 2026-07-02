/**
 * SiteForge - 静态站点生成器（SSG）
 * 将站点数据 + 区块结构 + SEO/GEO 配置 → 生成完整静态 HTML 页面
 */

const { renderPageBody } = require('./block-renderer')
const { generateSitemap, generateRobotsTxt, generateSchema } = require('../seo/seo-engine')
const { generateLlmsTxt, generateLlmsFullTxt } = require('../geo/llms-txt-generator')

// 站点 CSS（内联，避免外部依赖）
const SITE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;line-height:1.6;color:#1a1a2e}
img{max-width:100%;height:auto}
a{color:#4f46e5;text-decoration:none}
section{padding:60px 20px;max-width:1200px;margin:0 auto}
h1{font-size:2.5rem;margin-bottom:16px}
h2{font-size:1.8rem;margin-bottom:24px;color:#1a1a2e}
h3{font-size:1.2rem;margin-bottom:8px}
/* Hero */
.block-hero{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-align:center;padding:80px 20px;max-width:100%;border-radius:0}
.block-hero h1{color:#fff;font-size:3rem}
.block-hero p{font-size:1.3rem;opacity:0.9;margin-bottom:24px}
.btn-hero{display:inline-block;background:#fff;color:#4f46e5;padding:12px 32px;border-radius:8px;font-weight:600;font-size:1.1rem;transition:transform 0.2s}
.btn-hero:hover{transform:scale(1.05)}
/* Feature Grid */
.feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px}
.feature-item{text-align:center;padding:24px;border-radius:12px;background:#f8fafc;transition:transform 0.2s}
.feature-item:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,0.1)}
.feature-icon{font-size:2.5rem;margin-bottom:12px}
/* Product Grid */
.product-grid,.product-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
/* CTA */
.block-cta{text-align:center;background:#f1f5f9;border-radius:12px;padding:48px 20px}
.btn-cta{display:inline-block;background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;font-weight:600;font-size:1.1rem}
/* Contact */
.contact-list{list-style:none;padding:0}
.contact-list li{padding:8px 0;font-size:1.1rem}
/* Form */
.contact-form{display:flex;flex-direction:column;gap:12px;max-width:500px;margin:0 auto}
.contact-form input,.contact-form textarea{padding:12px;border:1px solid #ddd;border-radius:8px;font-size:1rem}
.btn-submit{background:#4f46e5;color:#fff;border:none;padding:12px;border-radius:8px;font-size:1.1rem;cursor:pointer;font-weight:600}
/* FAQ */
.faq-item{border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;padding:16px}
.faq-item summary{cursor:pointer;font-weight:600;font-size:1.1rem}
.faq-item p{margin-top:8px;color:#64748b}
/* Stats */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:24px;text-align:center}
.stat-number{font-size:2.5rem;font-weight:800;color:#4f46e5}
.stat-label{color:#64748b;margin-top:4px}
/* Testimonial */
.block-testimonial{text-align:center;background:#f8fafc;border-radius:12px;padding:48px}
.block-testimonial blockquote{font-size:1.3rem;font-style:italic;margin-bottom:16px}
.block-testimonial cite{color:#64748b}
/* Text Image */
.block-text-image{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center}
@media(max-width:768px){.block-text-image{grid-template-columns:1fr}}
.image-content{background:#f1f5f9;border-radius:12px;min-height:200px;display:flex;align-items:center;justify-content:center}
/* Footer */
.block-footer{background:#1a1a2e;color:#94a3b8;padding:48px 20px;max-width:100%}
.footer-content{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;max-width:1200px;margin:0 auto}
.footer-col h4{color:#fff;margin-bottom:12px}
.footer-col ul{list-style:none}
.footer-col li{padding:4px 0}
.footer-col a{color:#94a3b8}
.footer-col a:hover{color:#fff}
.footer-copyright{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #334155}
/* Page Header */
.block-page-header{text-align:center;padding:48px 20px;background:#f8fafc;border-radius:12px}
/* Placeholder */
.sf-placeholder{background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-style:italic;font-size:0.9rem}
/* Nav */
.site-nav{background:#fff;border-bottom:1px solid #e2e8f0;position:sticky;top:0;z-index:100}
.site-nav-inner{display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto;padding:0 20px;height:60px}
.site-nav-logo{font-size:1.3rem;font-weight:800;color:#4f46e5}
.site-nav-links{display:flex;gap:24px}
.site-nav-links a{color:#1a1a2e;font-weight:500}
.site-nav-links a:hover{color:#4f46e5}
@media(max-width:768px){.site-nav-links{gap:12px;font-size:0.9rem}}
`

// 生成导航栏 HTML
function renderNavigation(navItems, siteName) {
  const links = (navItems || []).map(item =>
    `<a href="${item.url}">${item.label}</a>`
  ).join('')
  return `<nav class="site-nav">
    <div class="site-nav-inner">
      <a href="/" class="site-nav-logo">${siteName || 'SiteForge'}</a>
      <div class="site-nav-links">${links}</div>
    </div>
  </nav>`
}

// 生成单个页面的完整 HTML
function generatePage(site, page) {
  const bodyContent = renderPageBody(page.blocks || [])
  const nav = renderNavigation(site.navigation, site.name)
  const schema = generateSchema(site, page, null)

  // SEO meta
  const seoTitle = page.seoMeta?.title || page.title || site.name
  const seoDesc = page.seoMeta?.description || site.description || ''
  const canonical = `https://${site.domain}${page.url}`

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle}</title>
  <meta name="description" content="${seoDesc}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${seoDesc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <style>${SITE_CSS}</style>
  ${schema}
</head>
<body>
  ${nav}
  <main>
    ${bodyContent}
  </main>
</body>
</html>`
}

// 生成完整静态站点
function generateSite(site) {
  const pages = {}

  // 生成每个页面
  for (const page of (site.pages || [])) {
    pages[page.url] = generatePage(site, page)
  }

  // 生成 sitemap.xml
  const sitemap = generateSitemap(site)

  // 生成 robots.txt
  const robots = generateRobotsTxt(site)

  // 生成 llms.txt
  const llmsTxt = generateLlmsTxt(site)
  const llmsFullTxt = generateLlmsFullTxt(site)

  return {
    pages,
    sitemap,
    robots,
    llmsTxt,
    llmsFullTxt,
    stats: {
      pageCount: Object.keys(pages).length,
      totalSize: Object.values(pages).reduce((s, h) => s + h.length, 0),
    }
  }
}

module.exports = { generateSite, generatePage, renderNavigation, SITE_CSS }
