/**
 * SiteForge - 区块渲染器（TypeScript 重写版）
 *
 * 复用原型 siteforge-prototype/src/ssg/block-renderer.js 的逻辑，
 * 但用 TypeScript + Zod 保证类型安全。
 *
 * 在 Astro 中通过 blockRenderer 组件使用（见 src/components/BlockRenderer.astro），
 * 这里提供：
 *   1) sortBlocks：按 sortOrder 排序
 *   2) getBlockComponent：type → Astro 组件路径映射
 *   3) renderBlocksToHtml：纯 HTML 字符串渲染（用于 site-generator 离线生成场景）
 */

import {
  blockInstanceSchema,
  validateBlockProps,
  type BlockInstance,
  type BlockType,
} from '@shared/block-schema'

/** 按 sortOrder 升序排序的区块列表 */
export function sortBlocks(blocks: BlockInstance[]): BlockInstance[] {
  return [...blocks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

/** type → Astro 组件文件名映射（与 src/components/blocks/ 对应） */
export const BLOCK_COMPONENT_MAP: Record<BlockType, string> = {
  hero: 'Hero.astro',
  feature_grid: 'FeatureGrid.astro',
  product_grid: 'ProductGrid.astro',
  product_list: 'ProductList.astro',
  case_list: 'CaseList.astro',
  page_header: 'PageHeader.astro',
  text_image: 'TextImage.astro',
  team: 'Team.astro',
  cta: 'Cta.astro',
  contact_info: 'ContactInfo.astro',
  form: 'Form.astro',
  stats: 'Stats.astro',
  faq: 'Faq.astro',
  testimonial: 'Testimonial.astro',
  map: 'Map.astro',
  footer: 'Footer.astro',
}

/** 校验并解析单个区块（运行时类型安全） */
export function parseBlock(raw: unknown): BlockInstance {
  return blockInstanceSchema.parse(raw)
}

/** 批量校验 + 排序 */
export function parseAndSortBlocks(rawList: unknown[]): BlockInstance[] {
  const parsed = rawList.map(parseBlock)
  return sortBlocks(parsed)
}

/**
 * 校验区块 props（按 type 路由到对应 schema）
 * 返回 [type, validatedProps] 元组，供 Astro 组件消费
 */
export function validateBlock(block: BlockInstance): {
  type: BlockType
  props: unknown
} {
  const props = validateBlockProps(block)
  return { type: block.type, props }
}

// ============================================================================
// 纯 HTML 字符串渲染（用于 site-generator 离线生成场景，无 Astro 运行时）
// ============================================================================

const PLACEHOLDER = (text: string): string =>
  `<span class="sf-placeholder">${escapeHtml(text)}</span>`

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface HtmlRenderer {
  (props: Record<string, unknown>): string
}

const htmlRenderers: Record<BlockType, HtmlRenderer> = {
  hero: (p) => `
    <section class="block-hero">
      <div class="hero-content">
        <h1>${p.title ? escapeHtml(String(p.title)) : PLACEHOLDER('在此输入企业标语')}</h1>
        <p>${p.subtitle ? escapeHtml(String(p.subtitle)) : PLACEHOLDER('一句话描述核心价值')}</p>
        ${p.cta ? `<a href="${escapeHtml(String(p.ctaUrl ?? '/contact'))}" class="btn-hero">${escapeHtml(String(p.cta))}</a>` : ''}
      </div>
    </section>`,

  feature_grid: (p) => {
    const items = (Array.isArray(p.items) ? p.items : []) as Array<{
      icon?: string
      title?: string
      desc?: string
    }>
    const itemsHtml = items
      .map(
        (item) => `
      <div class="feature-item">
        <div class="feature-icon">${item.icon ? escapeHtml(item.icon) : '✦'}</div>
        <h3>${item.title ? escapeHtml(item.title) : PLACEHOLDER('优势标题')}</h3>
        <p>${item.desc ? escapeHtml(item.desc) : PLACEHOLDER('优势描述')}</p>
      </div>`,
      )
      .join('')
    return `
    <section class="block-feature-grid">
      <h2>${p.title ? escapeHtml(String(p.title)) : '核心优势'}</h2>
      <div class="feature-grid">${itemsHtml || PLACEHOLDER('添加优势条目')}</div>
    </section>`
  },

  product_grid: (p) => `
    <section class="block-product-grid">
      <h2>${p.title ? escapeHtml(String(p.title)) : '产品服务'}</h2>
      <div class="product-grid" id="product-list">
        ${PLACEHOLDER('产品列表将自动从 CMS 内容生成')}
      </div>
    </section>`,

  product_list: (p) => `
    <section class="block-product-list">
      <h2>${p.title ? escapeHtml(String(p.title)) : '产品服务'}</h2>
      <div class="product-list" id="product-list">
        ${PLACEHOLDER('产品列表将自动从 CMS 内容生成')}
      </div>
    </section>`,

  case_list: (p) => `
    <section class="block-case-list">
      <h2>${p.title ? escapeHtml(String(p.title)) : '成功案例'}</h2>
      <div class="case-list" id="case-list">
        ${PLACEHOLDER('案例列表将自动从 CMS 内容生成')}
      </div>
    </section>`,

  page_header: (p) => `
    <section class="block-page-header">
      <h1>${p.title ? escapeHtml(String(p.title)) : PLACEHOLDER('页面标题')}</h1>
      ${p.subtitle ? `<p>${escapeHtml(String(p.subtitle))}</p>` : ''}
    </section>`,

  text_image: (p) => `
    <section class="block-text-image image-${escapeHtml(String(p.imagePosition ?? 'right'))}">
      <div class="text-content">
        <h2>${p.title ? escapeHtml(String(p.title)) : PLACEHOLDER('标题')}</h2>
        <div>${p.content ? String(p.content) : PLACEHOLDER('在此填写内容...')}</div>
      </div>
      <div class="image-content">
        ${p.image ? `<img src="${escapeHtml(String(p.image))}" alt="${escapeHtml(String(p.imageAlt ?? ''))}" loading="lazy">` : PLACEHOLDER('图片')}
      </div>
    </section>`,

  team: (p) => {
    const members = (Array.isArray(p.members) ? p.members : []) as Array<{
      name?: string
      title?: string
      avatar?: string
      bio?: string
    }>
    const membersHtml = members
      .map(
        (m) => `
      <article class="team-member">
        <div class="avatar">${m.avatar ? `<img src="${escapeHtml(m.avatar)}" alt="${escapeHtml(m.name ?? '')}" loading="lazy">` : ''}</div>
        <h3>${m.name ? escapeHtml(m.name) : PLACEHOLDER('姓名')}</h3>
        ${m.title ? `<p class="member-title">${escapeHtml(m.title)}</p>` : ''}
        ${m.bio ? `<p class="member-bio">${escapeHtml(m.bio)}</p>` : ''}
      </article>`,
      )
      .join('')
    return `
    <section class="block-team">
      <h2>${p.title ? escapeHtml(String(p.title)) : '团队介绍'}</h2>
      <div class="team-grid" id="team-list">${membersHtml || PLACEHOLDER('添加团队成员')}</div>
    </section>`
  },

  cta: (p) => `
    <section class="block-cta">
      <h2>${p.title ? escapeHtml(String(p.title)) : PLACEHOLDER('联系我们')}</h2>
      ${p.subtitle ? `<p>${escapeHtml(String(p.subtitle))}</p>` : ''}
      <a href="${escapeHtml(String(p.buttonUrl ?? '/contact'))}" class="btn-cta">${escapeHtml(String(p.button ?? '立即咨询'))}</a>
    </section>`,

  contact_info: (p) => `
    <section class="block-contact-info">
      <h2>${escapeHtml(String(p.title ?? '联系我们'))}</h2>
      <address class="contact-list">
        <li><span class="contact-label">电话</span>${p.phone ? `<a href="tel:${escapeHtml(String(p.phone))}">${escapeHtml(String(p.phone))}</a>` : PLACEHOLDER('电话')}</li>
        <li><span class="contact-label">邮箱</span>${p.email ? `<a href="mailto:${escapeHtml(String(p.email))}">${escapeHtml(String(p.email))}</a>` : PLACEHOLDER('邮箱')}</li>
        <li><span class="contact-label">地址</span>${p.address ? escapeHtml(String(p.address)) : PLACEHOLDER('地址')}</li>
        ${p.wechat ? `<li><span class="contact-label">微信</span>${escapeHtml(String(p.wechat))}</li>` : ''}
        ${p.workingHours ? `<li><span class="contact-label">工作时间</span>${escapeHtml(String(p.workingHours))}</li>` : ''}
      </address>
    </section>`,

  form: (p) => {
    const fields = Array.isArray(p.fields)
      ? (p.fields as Array<{
          name: string
          label: string
          type: string
          required?: boolean
          placeholder?: string
          options?: string[]
        }>)
      : [
          { name: 'name', label: '您的姓名', type: 'text', required: true, placeholder: '您的姓名' },
          { name: 'phone', label: '联系电话', type: 'tel', required: true, placeholder: '联系电话' },
          { name: 'message', label: '您的需求', type: 'textarea', required: false, placeholder: '您的需求' },
        ]
    const fieldsHtml = fields
      .map((f) => {
        const required = f.required ? 'required' : ''
        const label = `<label for="field-${escapeHtml(f.name)}">${escapeHtml(f.label)}${f.required ? '<span class="required">*</span>' : ''}</label>`
        let control = ''
        if (f.type === 'textarea') {
          control = `<textarea id="field-${escapeHtml(f.name)}" name="${escapeHtml(f.name)}" placeholder="${escapeHtml(f.placeholder ?? '')}" ${required} rows="4"></textarea>`
        } else if (f.type === 'select') {
          const opts = (f.options ?? []).map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')
          control = `<select id="field-${escapeHtml(f.name)}" name="${escapeHtml(f.name)}" ${required}>${opts}</select>`
        } else {
          control = `<input id="field-${escapeHtml(f.name)}" type="${escapeHtml(f.type)}" name="${escapeHtml(f.name)}" placeholder="${escapeHtml(f.placeholder ?? '')}" ${required}>`
        }
        return `<div class="form-field">${label}${control}</div>`
      })
      .join('')
    return `
    <section class="block-form">
      <h2>${escapeHtml(String(p.title ?? '在线咨询'))}</h2>
      <form action="${escapeHtml(String(p.action ?? '/api/leads/submit'))}" method="${escapeHtml(String(p.method ?? 'POST'))}" class="contact-form">
        ${fieldsHtml}
        <button type="submit" class="btn-submit">${escapeHtml(String(p.submitLabel ?? '提交咨询'))}</button>
      </form>
    </section>`
  },

  stats: (p) => {
    const items = (Array.isArray(p.items) ? p.items : []) as Array<{
      number?: string
      label?: string
      suffix?: string
    }>
    const itemsHtml = items
      .map(
        (it) => `
      <div class="stat-item">
        <dt class="stat-number">${escapeHtml(String(it.number ?? '0'))}${escapeHtml(String(it.suffix ?? ''))}</dt>
        <dd class="stat-label">${escapeHtml(String(it.label ?? ''))}</dd>
      </div>`,
      )
      .join('')
    return `<section class="block-stats">${p.title ? `<h2>${escapeHtml(String(p.title))}</h2>` : ''}<dl class="stats-grid">${itemsHtml || PLACEHOLDER('添加统计数据')}</dl></section>`
  },

  faq: (p) => {
    const items = (Array.isArray(p.items) ? p.items : []) as Array<{
      question?: string
      answer?: string
    }>
    const itemsHtml = items
      .map(
        (it) => `
      <details class="faq-item">
        <summary>${it.question ? escapeHtml(it.question) : PLACEHOLDER('问题')}</summary>
        <p>${it.answer ? escapeHtml(it.answer) : PLACEHOLDER('回答')}</p>
      </details>`,
      )
      .join('')
    return `
    <section class="block-faq">
      <h2>${escapeHtml(String(p.title ?? '常见问题'))}</h2>
      ${itemsHtml || PLACEHOLDER('添加常见问题')}
    </section>`
  },

  testimonial: (p) => `
    <section class="block-testimonial">
      <blockquote>${p.quote ? escapeHtml(String(p.quote)) : PLACEHOLDER('客户评价')}</blockquote>
      ${p.avatar ? `<div class="author-avatar"><img src="${escapeHtml(String(p.avatar))}" alt="${escapeHtml(String(p.author ?? ''))}" loading="lazy"></div>` : ''}
      <cite>—— ${escapeHtml(String(p.author ?? ''))}${p.authorTitle ? `，${escapeHtml(String(p.authorTitle))}` : ''}${p.company ? `，${escapeHtml(String(p.company))}` : ''}</cite>
    </section>`,

  map: (p) => `
    <section class="block-map">
      <h2>${escapeHtml(String(p.title ?? '地图'))}</h2>
      ${p.embedUrl ? `<div class="map-embed" style="padding:0"><iframe src="${escapeHtml(String(p.embedUrl))}" width="100%" height="320" style="border:0;display:block" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="${escapeHtml(String(p.title ?? '地图'))}"></iframe></div>` : `<div class="map-embed">${PLACEHOLDER(p.address ? `地图：${escapeHtml(String(p.address))}` : '配置地图 embed URL')}</div>`}
    </section>`,

  footer: (p) => {
    const navLinks = Array.isArray(p.navLinks)
      ? (p.navLinks as Array<{ label: string; url: string }>)
      : [
          { label: '首页', url: '/' },
          { label: '产品', url: '/products' },
          { label: '关于', url: '/about' },
          { label: '联系', url: '/contact' },
        ]
    const socialLinks = Array.isArray(p.socialLinks)
      ? (p.socialLinks as Array<{ platform: string; url: string }>)
      : []
    const year = new Date().getFullYear()
    return `
    <footer class="block-footer">
      <div class="footer-content">
        <div class="footer-col">
          <h4>${escapeHtml(String(p.companyName ?? '企业名称'))}</h4>
          ${p.description ? `<p>${escapeHtml(String(p.description))}</p>` : ''}
          ${socialLinks.length ? `<div class="footer-social">${socialLinks.map((s) => `<a href="${escapeHtml(s.url)}" rel="me" title="${escapeHtml(s.platform)}">${escapeHtml(s.platform)}</a>`).join('')}</div>` : ''}
        </div>
        <div class="footer-col">
          <h4>联系方式</h4>
          ${p.phone ? `<p><a href="tel:${escapeHtml(String(p.phone))}">${escapeHtml(String(p.phone))}</a></p>` : ''}
          ${p.email ? `<p><a href="mailto:${escapeHtml(String(p.email))}">${escapeHtml(String(p.email))}</a></p>` : ''}
          ${p.address ? `<p>${escapeHtml(String(p.address))}</p>` : ''}
        </div>
        <nav class="footer-col" aria-label="快速导航">
          <h4>快速导航</h4>
          <ul>${navLinks.map((l) => `<li><a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a></li>`).join('')}</ul>
        </nav>
      </div>
      <div class="footer-copyright">
        © ${year} ${escapeHtml(String(p.companyName ?? ''))}. All rights reserved.
        ${p.icp ? ` | <a href="https://beian.miit.gov.cn" rel="external">${escapeHtml(String(p.icp))}</a>` : ''}
      </div>
    </footer>`
  },
}

/** 渲染单个区块为 HTML 字符串 */
export function renderBlockToHtml(block: BlockInstance): string {
  const renderer = htmlRenderers[block.type]
  if (!renderer) {
    return `<!-- 未知区块类型: ${block.type} --><section><p>未知区块: ${block.type}</p></section>`
  }
  // 校验 props 后再渲染
  const props = validateBlockProps(block) as Record<string, unknown>
  return renderer(props)
}

/** 渲染页面 body（区块序列 → HTML） */
export function renderPageBody(blocks: BlockInstance[]): string {
  return sortBlocks(blocks)
    .map(renderBlockToHtml)
    .join('\n')
}
