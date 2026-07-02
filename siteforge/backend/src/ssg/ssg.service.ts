import { Injectable } from '@nestjs/common'
import { SeoService } from '../seo/seo.service'
import { GeoService } from '../geo/geo.service'

const BLOCK_RENDERERS: Record<string, (p: any) => string> = {
  hero: (p) => `<section class="block-hero"><div class="hero-content"><h1>${p.title || '标题'}</h1><p>${p.subtitle || ''}</p>${p.cta ? `<a href="#contact" class="btn-hero">${p.cta}</a>` : ''}</div></section>`,
  feature_grid: (p) => `<section class="block-feature-grid"><h2>${p.title || '核心优势'}</h2><div class="feature-grid">${(p.items || []).map((i: any) => `<div class="feature-item"><div class="feature-icon">${i.icon || '✦'}</div><h3>${i.title || ''}</h3><p>${i.desc || ''}</p></div>`).join('')}</div></section>`,
  product_grid: (p) => `<section class="block-product-grid"><h2>${p.title || '产品服务'}</h2><div class="product-grid"></div></section>`,
  product_list: (p) => `<section class="block-product-list"><h2>${p.title || '产品'}</h2><div class="product-list"></div></section>`,
  case_list: (p) => `<section class="block-case-list"><h2>${p.title || '案例'}</h2><div class="case-list"></div></section>`,
  page_header: (p) => `<section class="block-page-header"><h1>${p.title || '标题'}</h1></section>`,
  text_image: (p) => `<section class="block-text-image"><div class="text-content"><h2>${p.title || ''}</h2><div>${p.content || ''}</div></div><div class="image-content">${p.image ? `<img src="${p.image}">` : '图片'}</div></section>`,
  team: (p) => `<section class="block-team"><h2>${p.title || '团队'}</h2><div class="team-grid"></div></section>`,
  cta: (p) => `<section class="block-cta"><h2>${p.title || '联系我们'}</h2><a href="/contact" class="btn-cta">${p.button || '立即咨询'}</a></section>`,
  contact_info: (p) => `<section class="block-contact-info"><h2>联系我们</h2><ul class="contact-list"><li>📞 ${p.phone || ''}</li><li>📧 ${p.email || ''}</li><li>📍 ${p.address || ''}</li></ul></section>`,
  form: (p) => `<section class="block-form"><h2>${p.title || '在线咨询'}</h2><form action="/api/leads/submit" method="POST" class="contact-form"><input name="name" placeholder="姓名" required><input name="phone" placeholder="电话" required><textarea name="message" placeholder="需求" rows="4"></textarea><button type="submit" class="btn-submit">提交</button></form></section>`,
  stats: (p) => `<section class="block-stats"><div class="stats-grid">${(p.items || []).map((i: any) => `<div class="stat-item"><div class="stat-number">${i.number || '0'}</div><div class="stat-label">${i.label || ''}</div></div>`).join('')}</div></section>`,
  faq: (p) => `<section class="block-faq"><h2>${p.title || 'FAQ'}</h2>${(p.items || []).map((i: any) => `<details class="faq-item"><summary>${i.question || ''}</summary><p>${i.answer || ''}</p></details>`).join('')}</section>`,
  testimonial: (p) => `<section class="block-testimonial"><blockquote>"${p.quote || ''}"</blockquote><cite>${p.author || ''}</cite></section>`,
  map: (_p) => `<section class="block-map"><h2>地图</h2></section>`,
  footer: (p) => `<footer class="block-footer"><div class="footer-content"><div class="footer-col"><h4>${p.companyName || '企业'}</h4><p>${p.description || ''}</p></div><div class="footer-col"><h4>联系方式</h4><p>${p.phone || ''}</p></div></div><div class="footer-copyright">© ${new Date().getFullYear()} ${p.companyName || ''}</div></footer>`,
}

const SITE_CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;line-height:1.6;color:#1a1a2e}img{max-width:100%}a{color:#4f46e5;text-decoration:none}section{padding:60px 20px;max-width:1200px;margin:0 auto}h1{font-size:2.5rem;margin-bottom:16px}h2{font-size:1.8rem;margin-bottom:24px}.block-hero{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-align:center;padding:80px 20px;max-width:100%}.block-hero h1{color:#fff;font-size:3rem}.btn-hero{display:inline-block;background:#fff;color:#4f46e5;padding:12px 32px;border-radius:8px;font-weight:600}.feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px}.feature-item{text-align:center;padding:24px;border-radius:12px;background:#f8fafc}.feature-icon{font-size:2.5rem;margin-bottom:12px}.block-cta{text-align:center;background:#f1f5f9;border-radius:12px;padding:48px}.btn-cta{display:inline-block;background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;font-weight:600}.contact-list{list-style:none}.contact-form{display:flex;flex-direction:column;gap:12px;max-width:500px;margin:0 auto}.contact-form input,.contact-form textarea{padding:12px;border:1px solid #ddd;border-radius:8px}.btn-submit{background:#4f46e5;color:#fff;border:none;padding:12px;border-radius:8px;cursor:pointer}.faq-item{border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;padding:16px}.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:24px;text-align:center}.stat-number{font-size:2.5rem;font-weight:800;color:#4f46e5}.block-footer{background:#1a1a2e;color:#94a3b8;padding:48px 20px;max-width:100%}.footer-content{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;max-width:1200px;margin:0 auto}.footer-col h4{color:#fff;margin-bottom:12px}.footer-copyright{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #334155}.block-page-header{text-align:center;padding:48px;background:#f8fafc;border-radius:12px}.site-nav{background:#fff;border-bottom:1px solid #e2e8f0;position:sticky;top:0;z-index:100}.site-nav-inner{display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto;padding:0 20px;height:60px}.site-nav-logo{font-size:1.3rem;font-weight:800;color:#4f46e5}.site-nav-links{display:flex;gap:24px}.site-nav-links a{color:#1a1a2e;font-weight:500}`

function renderBlock(block: any): string {
  const r = BLOCK_RENDERERS[block.type]
  return r ? r(block.props || {}) : `<!-- 未知区块: ${block.type} -->`
}

function renderPageBody(blocks: any[]): string {
  return blocks.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(renderBlock).join('\n')
}

function renderNav(nav: any[], name: string): string {
  return `<nav class="site-nav"><div class="site-nav-inner"><a href="/" class="site-nav-logo">${name || 'SiteForge'}</a><div class="site-nav-links">${(nav || []).map(n => `<a href="${n.url}">${n.label}</a>`).join('')}</div></div></nav>`
}

@Injectable()
export class SsgService {
  constructor(private seoService: SeoService, private geoService: GeoService) {}

  generatePage(site: any, page: any): string {
    const body = renderPageBody(page.blocks || [])
    const nav = renderNav(site.navigation, site.name)
    const schema = this.seoService.generateSchema(site, page)
    const title = page.seoMeta?.title || page.title || site.name
    const desc = page.seoMeta?.description || site.description || ''
    const canonical = `https://${site.domain}${page.url}`
    return `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${title}</title>\n  <meta name="description" content="${desc}">\n  <link rel="canonical" href="${canonical}">\n  <meta property="og:title" content="${title}">\n  <meta property="og:description" content="${desc}">\n  <meta property="og:url" content="${canonical}">\n  <meta property="og:type" content="website">\n  <style>${SITE_CSS}</style>\n  ${schema}\n</head>\n<body>\n  ${nav}\n  <main>\n    ${body}\n  </main>\n</body>\n</html>`
  }

  generateSite(site: any) {
    const pages: Record<string, string> = {}
    for (const page of (site.pages || [])) { pages[page.url] = this.generatePage(site, page) }
    const sitemap = this.seoService.generateSitemap(site, site.pages)
    const robots = this.seoService.generateRobots(site, site.allowAiCrawlers)
    const llms = this.geoService.generateLlmsTxt(site)
    return { pages, sitemap, robots, llmsTxt: llms.llmsTxt, llmsFullTxt: llms.llmsFullTxt, stats: { pageCount: Object.keys(pages).length, totalSize: Object.values(pages).reduce((s, h) => s + (h as string).length, 0) } }
  }
}
