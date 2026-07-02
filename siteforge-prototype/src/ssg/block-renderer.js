/**
 * SiteForge - 区块渲染器
 * 将区块结构（block schema）渲染为语义化 HTML
 * 这是编辑器与 SSG 的"渲染契约"
 */

// 占位内容提示
const PLACEHOLDER = (text) => `<span class="sf-placeholder">${text}</span>`

// 区块渲染器映射表
const blockRenderers = {
  hero: (props) => `
    <section class="block-hero">
      <div class="hero-content">
        <h1>${props.title || PLACEHOLDER('在此输入企业标语')}</h1>
        <p>${props.subtitle || PLACEHOLDER('一句话描述核心价值')}</p>
        ${props.cta ? `<a href="#contact" class="btn-hero">${props.cta}</a>` : ''}
      </div>
    </section>`,

  feature_grid: (props) => {
    const items = (props.items || []).map(item => `
      <div class="feature-item">
        <div class="feature-icon">${item.icon || '✦'}</div>
        <h3>${item.title || PLACEHOLDER('优势标题')}</h3>
        <p>${item.desc || PLACEHOLDER('优势描述')}</p>
      </div>`).join('')
    return `
    <section class="block-feature-grid">
      <h2>${props.title || '核心优势'}</h2>
      <div class="feature-grid">${items}</div>
    </section>`
  },

  product_grid: (props) => `
    <section class="block-product-grid">
      <h2>${props.title || '产品服务'}</h2>
      <div class="product-grid" id="product-list">
        ${PLACEHOLDER('产品列表将自动从 CMS 内容生成')}
      </div>
    </section>`,

  product_list: (props) => `
    <section class="block-product-list">
      <h2>${props.title || '产品服务'}</h2>
      <div class="product-list" id="product-list">
        ${PLACEHOLDER('产品列表将自动从 CMS 内容生成')}
      </div>
    </section>`,

  case_list: (props) => `
    <section class="block-case-list">
      <h2>${props.title || '成功案例'}</h2>
      <div class="case-list" id="case-list">
        ${PLACEHOLDER('案例列表将自动从 CMS 内容生成')}
      </div>
    </section>`,

  page_header: (props) => `
    <section class="block-page-header">
      <h1>${props.title || PLACEHOLDER('页面标题')}</h1>
    </section>`,

  text_image: (props) => `
    <section class="block-text-image">
      <div class="text-content">
        <h2>${props.title || PLACEHOLDER('标题')}</h2>
        <div>${props.content || PLACEHOLDER('在此填写内容...')}</div>
      </div>
      <div class="image-content">
        ${props.image ? `<img src="${props.image}" alt="${props.imageAlt || ''}">` : PLACEHOLDER('图片')}
      </div>
    </section>`,

  team: (props) => `
    <section class="block-team">
      <h2>${props.title || '团队介绍'}</h2>
      <div class="team-grid" id="team-list">
        ${PLACEHOLDER('团队成员')}
      </div>
    </section>`,

  cta: (props) => `
    <section class="block-cta">
      <h2>${props.title || PLACEHOLDER('联系我们')}</h2>
      <a href="/contact" class="btn-cta">${props.button || '立即咨询'}</a>
    </section>`,

  contact_info: (props) => `
    <section class="block-contact-info">
      <h2>联系我们</h2>
      <ul class="contact-list">
        <li>📞 电话：${props.phone || PLACEHOLDER('电话')}</li>
        <li>📧 邮箱：${props.email || PLACEHOLDER('邮箱')}</li>
        <li>📍 地址：${props.address || PLACEHOLDER('地址')}</li>
      </ul>
    </section>`,

  form: (props) => `
    <section class="block-form">
      <h2>${props.title || '在线咨询'}</h2>
      <form action="/api/leads/submit" method="POST" class="contact-form">
        <input type="text" name="name" placeholder="您的姓名" required>
        <input type="tel" name="phone" placeholder="联系电话" required>
        <textarea name="message" placeholder="您的需求" rows="4"></textarea>
        <button type="submit" class="btn-submit">提交咨询</button>
      </form>
    </section>`,

  stats: (props) => {
    const items = (props.items || []).map(item => `
      <div class="stat-item">
        <div class="stat-number">${item.number || '0'}</div>
        <div class="stat-label">${item.label || ''}</div>
      </div>`).join('')
    return `<section class="block-stats"><div class="stats-grid">${items}</div></section>`
  },

  faq: (props) => {
    const items = (props.items || []).map((item, i) => `
      <details class="faq-item">
        <summary>${item.question || PLACEHOLDER('问题')}</summary>
        <p>${item.answer || PLACEHOLDER('回答')}</p>
      </details>`).join('')
    return `
    <section class="block-faq">
      <h2>${props.title || '常见问题'}</h2>
      ${items}
    </section>`
  },

  testimonial: (props) => `
    <section class="block-testimonial">
      <blockquote>"${props.quote || PLACEHOLDER('客户评价')}"</blockquote>
      <cite>—— ${props.author || ''}，${props.title || ''}</cite>
    </section>`,

  map: (props) => `
    <section class="block-map">
      <h2>地图</h2>
      ${PLACEHOLDER('嵌入地图')}
    </section>`,

  footer: (props) => `
    <footer class="block-footer">
      <div class="footer-content">
        <div class="footer-col">
          <h4>${props.companyName || '企业名称'}</h4>
          <p>${props.description || ''}</p>
        </div>
        <div class="footer-col">
          <h4>联系方式</h4>
          <p>📞 ${props.phone || ''}</p>
          <p>📧 ${props.email || ''}</p>
        </div>
        <div class="footer-col">
          <h4>快速导航</h4>
          <ul>
            <li><a href="/">首页</a></li>
            <li><a href="/products">产品</a></li>
            <li><a href="/about">关于</a></li>
            <li><a href="/contact">联系</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-copyright">© ${new Date().getFullYear()} ${props.companyName || ''}. All rights reserved.</div>
    </footer>`,
}

// 渲染单个区块
function renderBlock(block) {
  const renderer = blockRenderers[block.type]
  if (!renderer) {
    return `<!-- 未知区块类型: ${block.type} --><section><p>未知区块: ${block.type}</p></section>`
  }
  return renderer(block.props || {})
}

// 渲染页面（区块序列 → 完整 HTML body）
function renderPageBody(blocks) {
  return blocks
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(block => renderBlock(block))
    .join('\n')
}

module.exports = { renderBlock, renderPageBody, blockRenderers }
