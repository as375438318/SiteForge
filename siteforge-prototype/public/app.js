/* ============================================
   SiteForge 产品 UI — 交互逻辑
   路由 | 明暗切换 | 图表 | 交互
   ============================================ */

// ========== Mock 数据 ==========
const mockData = {
  site: { name: '智云科技', domain: 'www.zhiyun-tech.com', version: 'v1.0.0' },
  stats: { svi: 72, indexed: 87, citability: 64, leads: 23 },
}

// ========== 路由 ==========
const routes = [
  'login','dashboard','system/deploy','system/license','system/backup',
  'parse','templates','editor',
  'cms/list','cms/edit','cms/pages',
  'forms/designer','leads','leads/detail',
  'seo/settings','seo/health',
  'geo/llms-txt','geo/citation-test',
  'system/llm',
  'analytics/traffic','analytics/seo-geo'
]

const routeLabels = {
  'login': '登录',
  'dashboard': '工作台',
  'system/deploy': '部署配置',
  'system/license': 'License 管理',
  'system/backup': '备份恢复',
  'parse': 'AI 结构复刻',
  'templates': '模板库',
  'editor': '可视化编辑器',
  'cms/list': '内容管理',
  'cms/edit': '编辑内容',
  'cms/pages': '页面与导航',
  'forms/designer': '表单设计器',
  'leads': '线索管理',
  'leads/detail': '线索详情',
  'seo/settings': 'SEO 设置',
  'seo/health': 'SEO 健康度',
  'geo/llms-txt': 'llms.txt 编辑',
  'geo/citation-test': 'AI 引用模拟',
  'system/llm': 'LLM API 配置',
  'analytics/traffic': '访问统计',
  'analytics/seo-geo': '效果仪表盘',
}

const routeGroups = {
  'dashboard': '概览',
  'parse': '建站', 'templates': '建站', 'editor': '建站',
  'cms/list': '内容', 'cms/edit': '内容', 'cms/pages': '内容',
  'forms/designer': '获客', 'leads': '获客', 'leads/detail': '获客',
  'seo/settings': '优化', 'seo/health': '优化',
  'geo/llms-txt': '优化', 'geo/citation-test': '优化',
  'analytics/traffic': '数据', 'analytics/seo-geo': '数据',
  'system/deploy': '系统', 'system/license': '系统', 'system/backup': '系统', 'system/llm': '系统',
}

function router() {
  let hash = location.hash.slice(2) || 'dashboard'
  if (!routes.includes(hash)) hash = 'dashboard'

  // 登录页特殊处理
  if (hash === 'login') {
    document.querySelector('.app').style.display = 'none'
  } else {
    document.querySelector('.app').style.display = 'flex'
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.dataset.route === hash)
    })
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.route === hash)
    })
    updateBreadcrumb(hash)
  }

  // 编辑器页面折叠侧边栏
  if (hash === 'editor') {
    document.querySelector('.sidebar').classList.add('collapsed')
    document.querySelector('.main').classList.add('expanded')
  } else {
    document.querySelector('.sidebar').classList.remove('collapsed')
    document.querySelector('.main').classList.remove('expanded')
  }

  // 初始化图表
  setTimeout(() => initCharts(hash), 100)
  window.scrollTo(0, 0)
}

function updateBreadcrumb(route) {
  const group = routeGroups[route] || ''
  const label = routeLabels[route] || ''
  const bc = document.querySelector('.breadcrumb')
  if (bc) {
    bc.innerHTML = group
      ? `<span>${group}</span><span>›</span><span class="crumb-active">${label}</span>`
      : `<span class="crumb-active">${label}</span>`
  }
}

window.addEventListener('hashchange', router)
window.addEventListener('load', router)

// ========== 明暗切换 ==========
function toggleTheme() {
  const cur = document.documentElement.dataset.theme
  const next = cur === 'light' ? 'dark' : 'light'
  document.documentElement.dataset.theme = next
  localStorage.setItem('sf-theme', next)
  updateThemeIcon(next)
  // 重新渲染图表（主题色变化）
  setTimeout(() => {
    const activeRoute = location.hash.slice(2) || 'dashboard'
    initCharts(activeRoute)
  }, 100)
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle')
  if (!btn) return
  btn.innerHTML = theme === 'light'
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
}

// 初始化主题
;(function initTheme() {
  const saved = localStorage.getItem('sf-theme') || 'light'
  document.documentElement.dataset.theme = saved
  updateThemeIcon(saved)
})()

// ========== 侧边栏折叠 ==========
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('collapsed')
  document.querySelector('.main').classList.toggle('expanded')
}

// ========== Toast ==========
function showToast(msg, type = 'info') {
  let toast = document.querySelector('.toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.className = 'toast'
    document.body.appendChild(toast)
  }
  const colors = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--info)', warning: 'var(--warning)' }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }
  toast.style.background = colors[type] || colors.info
  toast.style.color = '#fff'
  toast.innerHTML = `${icons[type] || icons.info} ${msg}`
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 3000)
}

// ========== 登录 ==========
function doLogin() {
  location.hash = '#/dashboard'
  showToast('登录成功', 'success')
}

// ========== AI 复刻 — 真实 API 调用 ==========
let parseStep = 1
function showParseStep(step) {
  parseStep = step
  document.querySelectorAll('[id^="parse-step"]').forEach(el => {
    const elStep = el.id.replace('parse-step', '').replace('-', '')
    el.style.display = elStep == step ? 'block' : 'none'
  })
}

async function startParse() {
  // 获取 URL 输入
  const urlInput = document.querySelector('#parse-step1 input')
  const url = urlInput ? urlInput.value : 'https://www.example.com'

  showParseStep(2)

  // 模拟阶段进度（同时调用真实 API）
  const stages = [
    { name: '检查 robots.txt', delay: 400 },
    { name: '爬取页面并渲染', delay: 800 },
    { name: '识别页面类型', delay: 600 },
    { name: '提取区块结构', delay: 600 },
    { name: '生成模板骨架', delay: 400 },
  ]
  let progress = 0
  let stageIdx = 0
  const step2 = document.getElementById('parse-step2')
  const progressEl = step2?.querySelector('.progress-fill')
  const progressText = step2?.querySelector('.text-primary')

  function nextStage() {
    if (stageIdx >= stages.length) {
      renderParseResult()
      showParseStep(3)
      return
    }
    const stage = stages[stageIdx]
    progress = Math.round(((stageIdx + 1) / stages.length) * 100)
    if (progressEl) progressEl.style.width = progress + '%'
    if (progressText) progressText.textContent = `${stageIdx + 1} / 5 · ${progress}%`
    stageIdx++
    setTimeout(nextStage, stage.delay)
  }

  // 同时调用真实 API
  try {
    const res = await fetch('/api/parse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    window._parseResult = await res.json()
  } catch (err) {
    window._parseResult = null
  }

  nextStage()
}

// 渲染解析结果到 step3
function renderParseResult() {
  const step3 = document.getElementById('parse-step3')
  if (!step3 || !window._parseResult) return

  const data = window._parseResult
  const grid = step3.querySelector('.grid')
  if (!grid) return

  // 用真实解析结果替换 mock 内容
  grid.innerHTML = data.pages.map(page => `
    <div class="card" style="border-color:var(--primary-border);background:var(--primary-soft)">
      <div class="flex items-center gap-12 mb-8">
        <input type="checkbox" checked>
        <span class="font-semibold">${page.title} · ${page.url}</span>
        <span class="badge badge-primary">${page.blocks.length} 区块</span>
      </div>
      <div class="flex gap-8" style="flex-wrap:wrap">
        ${page.blocks.map((b, i) => `<span class="badge badge-neutral">${i + 1} ${b.type}</span>`).join('')}
      </div>
    </div>
  `).join('')

  // 更新统计
  const alert = step3.querySelector('.alert-success div')
  if (alert) {
    const totalBlocks = data.pages.reduce((s, p) => s + p.blocks.length, 0)
    alert.innerHTML = `解析完成，共识别 <strong>${data.pages.length} 个页面</strong>、<strong>${totalBlocks} 个区块</strong>。勾选要保留的页面，进入编辑器后即可填充内容`
  }
}

// ========== GEO 可引用性评分 — 真实 API ==========
async function runGeoScore() {
  // 获取内容编辑页的正文
  const editPage = document.querySelector('[data-route="cms/edit"]')
  if (!editPage) { showToast('请在内容编辑页使用评分', 'warning'); return }

  const textareas = editPage.querySelectorAll('textarea')
  const titleInput = editPage.querySelector('input')
  const text = (textareas[textareas.length - 1]?.value || '') + (titleInput?.value || '')
  if (!text || text.length < 10) { showToast('内容太少，请先输入正文', 'warning'); return }

  // 找到评分卡区域
  const scoreCard = editPage.querySelector('.score-card')
  const dimBars = editPage.querySelectorAll('.dim-bar')
  if (scoreCard) scoreCard.innerHTML = '<div class="text-muted">评分中...</div>'

  try {
    const res = await fetch('/api/geo/score', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, html: text, meta: { author: '张明', authorTitle: 'SEO专家', publishedAt: '2025-07-01' } })
    })
    const data = await res.json()
    renderGeoScore(editPage, data)
    showToast(`可引用性评分: ${data.total} 分`, 'success')
  } catch (err) {
    if (scoreCard) scoreCard.innerHTML = '<div class="text-danger">评分失败</div>'
    showToast('评分失败: ' + err.message, 'error')
  }
}

function renderGeoScore(container, data) {
  const levelMap = { excellent: { cls: 'level-excellent', label: '优秀 · 极易被 AI 引用' }, good: { cls: 'level-good', label: '良好 · 可被 AI 引用' }, fair: { cls: 'level-fair', label: '一般 · 需优化' }, poor: { cls: 'level-poor', label: '较差 · 需重点优化' } }
  const info = levelMap[data.level] || levelMap.fair

  const scoreCard = container.querySelector('.score-card')
  if (scoreCard) {
    scoreCard.innerHTML = `
      <div class="score-total ${info.cls}">${data.total}</div>
      <div class="score-label">${info.label}</div>
    `
  }

  // 更新维度条
  const dimBars = container.querySelectorAll('.dim-bar')
  data.dimensions.forEach((dim, i) => {
    if (dimBars[i]) {
      const fill = dimBars[i].querySelector('.dim-fill')
      const score = dimBars[i].querySelector('.dim-score')
      const name = dimBars[i].querySelector('.dim-name')
      if (name) name.textContent = dim.dimension
      if (fill) {
        const pct = (dim.score / dim.maxScore) * 100
        fill.style.width = pct + '%'
        fill.className = 'dim-fill bg-' + (dim.level === 'excellent' ? 'excellent' : dim.level === 'good' ? 'good' : 'fair')
      }
      if (score) {
        score.textContent = dim.score
        score.className = 'dim-score level-' + dim.level
      }
    }
  })
}

function setEditorViewport(vp) {
  const frame = document.getElementById('editor-canvas-frame')
  if (!frame) return
  const widths = { desktop: '100%', tablet: '768px', mobile: '375px' }
  frame.style.maxWidth = widths[vp] || '100%'
  document.querySelectorAll('[id^="vp-"]').forEach(el => el.classList.remove('active'))
  const btn = document.getElementById(`vp-${vp}`)
  if (btn) btn.classList.add('active')
}

// ========== 内容 Tab 切换 ==========
function switchCmsTab(tab) {
  document.querySelectorAll('.cms-tab').forEach(t => t.classList.remove('active'))
  event.target.classList.add('active')
  showToast(`切换到${tab}列表`, 'info')
}

// ========== SEO 健康度检查 — 真实 API ==========
async function runSeoHealthCheck() {
  const page = document.querySelector('[data-route="seo/health"]')
  if (!page) return

  const scoreCard = page.querySelector('.score-card')
  const tableWrap = page.querySelector('.table-wrap')

  if (scoreCard) scoreCard.innerHTML = '<div class="text-muted">检查中...</div>'

  const site = {
    ssl: true, sitemapGenerated: true, robotsGenerated: true, allowAiCrawlers: true,
  }
  const pages = [
    { url: '/', title: '首页', html: '<h1>首页</h1><img src="banner.jpg">', seoMeta: { title: '首页', description: '公司首页' } },
    { url: '/products', title: '产品', html: '<h1>产品</h1><h2>产品A</h2><img src="a.jpg">', seoMeta: { title: '产品服务' } },
    { url: '/about', title: '关于', html: '<h1>关于</h1><h1>公司</h1>', seoMeta: {} },
  ]

  try {
    const res = await fetch('/api/seo/health-check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site, pages })
    })
    const data = await res.json()
    renderSeoHealth(page, data)
    showToast(`SEO 健康度: ${data.score} 分`, 'success')
  } catch (err) {
    if (scoreCard) scoreCard.innerHTML = '<div class="text-danger">检查失败</div>'
    showToast('检查失败: ' + err.message, 'error')
  }
}

function renderSeoHealth(page, data) {
  const levelColors = { excellent: '#22c55e', good: '#eab308', fair: '#f97316', poor: '#ef4444' }
  const levelLabels = { excellent: '优秀', good: '良好', fair: '一般', poor: '较差' }

  const scoreCard = page.querySelector('.score-card')
  if (scoreCard) {
    scoreCard.innerHTML = `
      <div class="score-total" style="color:${levelColors[data.level]}">${data.score}</div>
      <div class="score-label">${levelLabels[data.level]} — ${data.passedChecks}/${data.totalChecks} 项通过</div>
    `
  }

  // 更新表格
  const tableWrap = page.querySelector('.table-wrap')
  if (tableWrap && data.issues) {
    const tbody = tableWrap.querySelector('tbody')
    if (tbody) {
      if (data.issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:24px">✅ 全部检查通过！</td></tr>'
      } else {
        tbody.innerHTML = data.issues.map(issue => {
          const sevColor = issue.severity === 'error' ? 'var(--danger)' : 'var(--warning)'
          const sevBadge = issue.severity === 'error' ? 'badge-danger' : 'badge-warning'
          const sevText = issue.severity === 'error' ? '未通过' : '警告'
          const sevIcon = issue.severity === 'error' ? '✕' : '!'
          return `<tr>
            <td><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color:${sevColor}"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></td>
            <td><strong>${issue.check}</strong><div class="text-xs text-muted">${issue.page}</div></td>
            <td><span class="badge ${sevBadge}">${sevText}</span></td>
            <td class="text-sm text-secondary">${issue.message}</td>
            <td>${issue.autoFix ? '<button class="btn btn-primary btn-sm">一键修复</button>' : '<button class="btn btn-link btn-sm">查看</button>'}</td>
          </tr>`
        }).join('')
      }
    }
  }
}

// ========== SSG 发布 — 真实 API ==========
async function publishSiteReal() {
  showToast('正在生成静态站点...', 'info')

  // 用 mock 站点数据调用 SSG
  const site = {
    name: mockData.site.name,
    domain: mockData.site.domain,
    description: '专注企业数字化转型与AI应用',
    ssl: true, sitemapGenerated: true, robotsGenerated: true, allowAiCrawlers: true,
    pages: [
      { url: '/', title: '首页', seoMeta: { title: `${mockData.site.name} - 企业数字化转型专家`, description: '专注企业数字化转型' }, blocks: [
        { type: 'hero', sortOrder: 0, props: { title: mockData.site.name, subtitle: '专注企业数字化转型与AI应用', cta: '了解更多' } },
        { type: 'feature_grid', sortOrder: 1, props: { title: '核心优势', items: [{ icon: '⚡', title: '高效', desc: '提升效率47%' }, { icon: '🛡️', title: '安全', desc: '企业级保障' }] } },
        { type: 'cta', sortOrder: 2, props: { title: '联系我们', button: '立即咨询' } },
      ]},
      { url: '/products', title: '产品服务', seoMeta: { title: '产品服务' }, blocks: [{ type: 'page_header', sortOrder: 0, props: { title: '产品服务' } }] },
      { url: '/about', title: '关于我们', seoMeta: { title: '关于我们' }, blocks: [{ type: 'page_header', sortOrder: 0, props: { title: '关于我们' } }] },
      { url: '/contact', title: '联系我们', seoMeta: { title: '联系我们' }, blocks: [{ type: 'page_header', sortOrder: 0, props: { title: '联系我们' } }, { type: 'form', sortOrder: 1, props: { title: '在线咨询' } }] },
    ],
    navigation: [
      { label: '首页', url: '/' }, { label: '产品', url: '/products' },
      { label: '关于', url: '/about' }, { label: '联系', url: '/contact' },
    ],
  }

  try {
    const res = await fetch('/api/ssg/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site)
    })
    const data = await res.json()

    showToast(`发布成功！${data.stats.pageCount} 个页面，${(data.stats.totalSize / 1024).toFixed(1)} KB`, 'success')

    // 显示生成结果 Modal
    showPublishResult(data)
  } catch (err) {
    showToast('发布失败: ' + err.message, 'error')
  }
}

function showPublishResult(data) {
  let modal = document.getElementById('publish-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'publish-modal'
    modal.className = 'modal-overlay'
    modal.innerHTML = `<div class="modal" style="width:600px">
      <div class="modal-header"><h3 style="font-size:18px;font-weight:600">🚀 发布成功</h3><button class="btn btn-ghost btn-sm" onclick="document.getElementById('publish-modal').classList.remove('show')">✕</button></div>
      <div class="modal-body" id="publish-modal-body"></div>
      <div class="modal-footer"><button class="btn btn-primary" onclick="document.getElementById('publish-modal').classList.remove('show')">完成</button></div>
    </div>`
    document.body.appendChild(modal)
  }

  const body = modal.querySelector('#publish-modal-body')
  body.innerHTML = `
    <div class="alert alert-success">✅ 静态站点生成完成！已注入 SEO + GEO 标签</div>
    <div class="grid grid-3 mt-16 mb-16">
      <div class="stat-card text-center"><div class="stat-value text-primary">${data.stats.pageCount}</div><div class="stat-label">页面数</div></div>
      <div class="stat-card text-center"><div class="stat-value text-primary">${(data.stats.totalSize / 1024).toFixed(1)}</div><div class="stat-label">总大小 KB</div></div>
      <div class="stat-card text-center"><div class="stat-value text-success">9</div><div class="stat-label">AI 爬虫放行</div></div>
    </div>
    <h4 style="font-size:14px;font-weight:600;margin-bottom:8px">生成文件清单</h4>
    <div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
      ${Object.entries(data.pages).map(([url, html]) => `<div class="flex items-center gap-8 py-8 px-16" style="border-bottom:1px solid var(--border)"><span>📄</span><span style="flex:1" class="text-sm">${url === '/' ? '/ (首页)' : url}</span><span class="text-xs text-muted">${(html.length / 1024).toFixed(1)} KB</span></div>`).join('')}
      <div class="flex items-center gap-8 py-8 px-16" style="border-bottom:1px solid var(--border)"><span>🗺️</span><span style="flex:1" class="text-sm">sitemap.xml</span><span class="text-xs text-muted">${(data.sitemap.length / 1024).toFixed(1)} KB</span></div>
      <div class="flex items-center gap-8 py-8 px-16" style="border-bottom:1px solid var(--border)"><span>🤖</span><span style="flex:1" class="text-sm">robots.txt (9 AI 爬虫)</span><span class="text-xs text-muted">${(data.robots.length / 1024).toFixed(1)} KB</span></div>
      <div class="flex items-center gap-8 py-8 px-16"><span>📄</span><span style="flex:1" class="text-sm">llms.txt + llms-full.txt</span><span class="text-xs text-muted">${((data.llmsTxt.length + data.llmsFullTxt.length) / 1024).toFixed(1)} KB</span></div>
    </div>
    <div class="alert alert-info mt-16"><div class="text-xs">✅ 已注入：SEO TDK + canonical + Open Graph + Schema.org JSON-LD + AI 爬虫放行 + llms.txt</div></div>
  `
  modal.classList.add('show')
}

// ========== SEO 文件生成 — 真实 API ==========
async function generateSeoFiles() {
  showToast('生成中...', 'info')
  const site = {
    name: mockData.site.name, domain: mockData.site.domain, ssl: true,
    pages: [
      { url: '/', title: '首页', updatedAt: '2025-07-01', priority: '1.0' },
      { url: '/products', title: '产品服务', updatedAt: '2025-07-01', priority: '0.8' },
      { url: '/about', title: '关于我们', updatedAt: '2025-07-01', priority: '0.6' },
      { url: '/contact', title: '联系我们', updatedAt: '2025-07-01', priority: '0.6' },
    ],
  }

  try {
    const res = await fetch('/api/seo/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site, page: site.pages[0] })
    })
    const data = await res.json()
    showSeoResult(data)
    showToast('SEO 文件已生成', 'success')
  } catch (err) {
    showToast('生成失败: ' + err.message, 'error')
  }
}

function showSeoResult(data) {
  // 在 SEO 设置页找到代码块区域并更新
  const page = document.querySelector('[data-route="seo/settings"]')
  if (!page) return
  const codeBlocks = page.querySelectorAll('.code-block')
  if (codeBlocks[0]) codeBlocks[0].textContent = data.robots
  if (codeBlocks[1]) codeBlocks[1].textContent = data.sitemap
}

// ========== 编辑器预览 — 真实 API ==========
async function previewEditorPage() {
  const editorPage = document.querySelector('[data-route="editor"]')
  const canvas = editorPage?.querySelector('.canvas-frame') || editorPage?.querySelector('iframe')
  if (!canvas) { showToast('未找到画布', 'warning'); return }

  const site = {
    name: mockData.site.name, domain: mockData.site.domain,
    description: '专注企业数字化转型',
    navigation: [{ label: '首页', url: '/' }, { label: '产品', url: '/products' }],
  }
  const page = {
    url: '/', title: '首页',
    seoMeta: { title: mockData.site.name, description: '专注企业数字化转型' },
    blocks: [
      { type: 'hero', sortOrder: 0, props: { title: mockData.site.name, subtitle: '专注企业数字化转型与AI应用', cta: '了解更多' } },
      { type: 'feature_grid', sortOrder: 1, props: { title: '核心优势', items: [{ icon: '⚡', title: '高效建站', desc: '10分钟完成' }, { icon: '🔍', title: 'SEO 优化', desc: '搜得到' }, { icon: '🤖', title: 'GEO 优化', desc: 'AI 引得到' }] } },
      { type: 'cta', sortOrder: 2, props: { title: '联系我们', button: '立即咨询' } },
    ],
  }

  try {
    const res = await fetch('/api/ssg/preview-page', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site, page })
    })
    const data = await res.json()
    if (canvas.tagName === 'IFRAME') {
      canvas.srcdoc = data.html
    } else {
      canvas.innerHTML = data.html
      canvas.style.minHeight = '600px'
    }
    showToast('预览已更新', 'success')
  } catch (err) {
    showToast('预览失败: ' + err.message, 'error')
  }
}

// ========== 折叠面板 ==========
function toggleCollapse(id) {
  const el = document.getElementById(id)
  if (el) el.classList.toggle('hidden')
}

// ========== 线索状态切换 ==========
function switchLeadStatus(status) {
  document.querySelectorAll('.lead-status-btn').forEach(btn => btn.classList.remove('active'))
  event.target.classList.add('active')
  showToast(`状态已更新为：${status}`, 'success')
}

// ========== SEO 健康度一键修复 ==========
function seoAutoFix(item) {
  showToast(`已自动修复：${item}`, 'success')
}

// ========== llms.txt 重新生成 — 真实 API ==========
async function regenerateLlmsTxt() {
  // 找到 llms.txt 页面的代码编辑区
  const page = document.querySelector('[data-route="geo/llms-txt"]')
  const codeBlock = page?.querySelector('textarea') || page?.querySelector('.code-block')
  if (codeBlock) {
    const orig = codeBlock.tagName === 'TEXTAREA' ? codeBlock.value : codeBlock.textContent
    if (codeBlock.tagName === 'TEXTAREA') codeBlock.value = '# 生成中...'
    else codeBlock.textContent = '# 生成中...'
  }

  const site = {
    name: mockData.site.name,
    domain: mockData.site.domain,
    description: '专注企业数字化转型与AI应用',
    pages: [
      { title: '产品服务', url: '/products', summary: '提供专业的产品和服务解决方案' },
      { title: '成功案例', url: '/cases', summary: '服务客户的成功案例展示' },
      { title: '关于我们', url: '/about', summary: '公司简介与团队介绍' },
      { title: '联系我们', url: '/contact', summary: '联系方式与在线咨询' },
    ],
    contents: [
      { type: 'post', status: 'published', title: '企业数字化转型指南', slug: 'digital-transformation', summary: '2025年企业数字化转型的关键步骤与最佳实践' },
    ]
  }

  try {
    const res = await fetch('/api/geo/llms-txt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site)
    })
    const data = await res.json()
    if (codeBlock) {
      if (codeBlock.tagName === 'TEXTAREA') codeBlock.value = data.llmsTxt
      else codeBlock.textContent = data.llmsTxt
    }
    showToast('llms.txt 已重新生成', 'success')
  } catch (err) {
    showToast('生成失败: ' + err.message, 'error')
  }
}

// ========== AI 引用模拟 — 真实 API ==========
async function runCitationTest() {
  const page = document.querySelector('[data-route="geo/citation-test"]')
  const questionInput = page?.querySelector('#citation-question-input')
  const question = questionInput ? questionInput.value : '企业官网怎么提升AI搜索排名'

  // 模拟站点内容
  const contents = [
    { title: '企业官网如何提升AI搜索排名', text: 'GEO是面向AI搜索的优化方法。专家引言提升可见性41%。建议生成llms.txt文件、放行AI爬虫、注入结构化数据。某企业90天内AI引用通过率从15%提升至68%。', summary: 'GEO优化指南' },
    { title: 'SiteForge建站系统', text: 'SiteForge是本地部署的企业官网搭建系统，支持AI结构复刻、SEO优化、GEO生成式引擎优化。数据100%存本地。', summary: '产品介绍' },
    { title: 'llms.txt规范', text: 'llms.txt是面向大语言模型的站点说明文件。由Jeremy Howard提出。包含站点名称、简介、核心页面链接与摘要。', summary: '技术规范' },
  ]

  // 找到结果区，显示加载中
  const resultArea = page?.querySelector('.grid')
  if (resultArea) {
    const cards = resultArea.querySelectorAll('.card')
    if (cards[0]) {
      cards[0].innerHTML = '<div class="text-center py-16 text-muted">🔄 模拟 AI 搜索引擎检索中...</div>'
    }
  }

  try {
    const res = await fetch('/api/geo/citation-test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, contents })
    })
    const data = await res.json()
    renderCitationResult(page, data)
    showToast('模拟测试完成', 'success')
  } catch (err) {
    showToast('测试失败: ' + err.message, 'error')
  }
}

function renderCitationResult(page, data) {
  if (!page) return
  const resultArea = page.querySelector('.grid')
  if (!resultArea) return

  const probMap = {
    high: { color: 'var(--success)', bg: 'var(--success-soft)', border: 'var(--success-border)', label: '🟢 很可能被引用', desc: '内容质量高，AI 搜索很可能引用' },
    medium: { color: 'var(--warning)', bg: 'var(--warning-soft)', border: 'var(--warning-border)', label: '🟡 可能被引用', desc: '内容可能被引用，有优化空间' },
    low: { color: 'var(--danger)', bg: 'var(--danger-soft)', border: 'var(--danger-border)', label: '🔴 不太可能被引用', desc: '内容质量不足以被 AI 引用' },
  }
  const prob = probMap[data.citationProbability] || probMap.low

  const leftCol = resultArea.querySelector(':scope > div:first-child')
  if (leftCol) {
    leftCol.innerHTML = `
      <!-- 引用概率卡 -->
      <div class="card mb-16" style="background:${prob.bg};border-color:${prob.border}">
        <div class="flex items-center gap-12">
          <div style="width:48px;height:48px;background:${prob.color};border-radius:12px;display:flex;align-items:center;justify-content:center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24" style="color:#fff"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div>
            <div class="font-semibold" style="font-size:18px;color:${prob.color}">${prob.label}</div>
            <div class="text-sm text-secondary">${data.wouldCite ? '✅ 会引用' : '❌ 不会引用'} · ${prob.desc}</div>
          </div>
        </div>
      </div>

      <!-- 模拟回答 -->
      <div class="card mb-16">
        <div class="card-header"><div class="card-title">模拟 AI 回答</div><span class="badge badge-neutral">${data.retrievedCount || 0} 篇命中</span></div>
        <div class="code-block">${data.simulatedAnswer || '(无回答)'}</div>
      </div>

      <!-- 原因分析 -->
      ${data.reason ? `<div class="alert alert-info"><strong>判断依据</strong>：${data.reason}</div>` : ''}

      <!-- 缺失信息 -->
      ${data.missingInfo ? `<div class="alert alert-warning"><strong>⚠️ 缺失信息</strong>：${data.missingInfo}</div>` : ''}

      <!-- 优化建议 -->
      ${data.suggestions && data.suggestions.length > 0 ? `
      <div class="card">
        <div class="card-header"><div class="card-title">优化建议</div></div>
        ${data.suggestions.map(s => `<div class="alert alert-info" style="margin:0 0 8px"><div class="text-xs">💡 ${s}</div></div>`).join('')}
      </div>` : ''}

      <!-- 检索结果 -->
      ${data.retrievedContents && data.retrievedContents.length > 0 ? `
      <div class="card mt-16">
        <div class="card-header"><div class="card-title">检索到的内容</div></div>
        ${data.retrievedContents.map(c => `
          <div class="flex items-center gap-12 py-8" style="border-bottom:1px solid var(--border)">
            <span>📄</span>
            <span style="flex:1" class="text-sm">${c.title}</span>
            <span class="badge ${c.score >= 60 ? 'badge-success' : c.score >= 40 ? 'badge-warning' : 'badge-danger'}">可引用性 ${c.score}</span>
          </div>
        `).join('')}
      </div>` : ''}

      <div class="alert alert-info mt-16"><div class="text-xs">${data.disclaimer || '此为模拟测试，非真实 AI 搜索结果预测'}</div></div>
    `
  }
}

// ========== LLM 配置 ==========
function testLlmConnection() {
  const btn = event.target
  btn.disabled = true
  btn.textContent = '测试中...'
  setTimeout(() => {
    btn.disabled = false
    btn.textContent = '测试连接'
    const result = document.getElementById('llm-test-result')
    if (result) {
      result.innerHTML = '<div class="alert alert-success">✅ 连接成功（DeepSeek / deepseek-chat）</div>'
    }
    showToast('API 连接成功', 'success')
  }, 1500)
}

function saveLlmConfig() {
  showToast('LLM 配置已保存', 'success')
}

// ========== 模板预览 Modal ==========
function showTemplatePreview(name) {
  const modal = document.getElementById('template-modal')
  if (modal) {
    modal.classList.add('show')
    const title = modal.querySelector('.modal-header h3')
    if (title) title.textContent = `预览：${name}`
  }
}

function closeModal(id) {
  const modal = document.getElementById(id)
  if (modal) modal.classList.remove('show')
}

// ========== 表单设计器 ==========
function addFormField(type) {
  showToast(`已添加字段：${type}`, 'success')
}

// ========== 发布 ==========
function publishSite() {
  if (confirm('确认发布网站？发布后访客将看到最新内容。')) {
    showToast('正在生成静态站点...', 'info')
    setTimeout(() => showToast('发布成功！网站已更新', 'success'), 2000)
  }
}

// ========== 备份 ==========
function createBackup() {
  showToast('正在创建备份...', 'info')
  setTimeout(() => showToast('备份完成', 'success'), 1500)
}

// ========== ECharts 图表 ==========
function initCharts(route) {
  if (typeof echarts === 'undefined') return

  // 获取主题色
  const isDark = document.documentElement.dataset.theme === 'dark'
  const textColor = isDark ? '#94a3b8' : '#475569'
  const gridColor = isDark ? '#334155' : '#e2e8f0'

  // 访问统计 - 趋势折线
  if (route === 'analytics/traffic') {
    const chart1 = document.getElementById('chart-traffic')
    if (chart1) {
      echarts.init(chart1).setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: ['周一','周二','周三','周四','周五','周六','周日'], axisLine: { lineStyle: { color: gridColor } }, axisLabel: { color: textColor } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: gridColor } }, axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridColor } } },
        series: [{ data: [420, 580, 390, 650, 720, 580, 507], type: 'line', smooth: true, areaStyle: { opacity: .15 }, itemStyle: { color: '#4f46e5' }, lineStyle: { width: 2 } }]
      })
    }
    const chart2 = document.getElementById('chart-source')
    if (chart2) {
      echarts.init(chart2).setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, textStyle: { color: textColor } },
        series: [{
          type: 'pie', radius: ['40%','70%'],
          data: [
            { value: 1540, name: '搜索引擎', itemStyle: { color: '#4f46e5' } },
            { value: 980, name: '直接访问', itemStyle: { color: '#3b82f6' } },
            { value: 620, name: '社交媒体', itemStyle: { color: '#22c55e' } },
            { value: 350, name: 'AI搜索', itemStyle: { color: '#eab308' } },
            { value: 357, name: '其他', itemStyle: { color: '#94a3b8' } },
          ],
          label: { color: textColor }
        }]
      })
    }
  }

  // SEO/GEO 仪表盘
  if (route === 'analytics/seo-geo') {
    const chart3 = document.getElementById('chart-seo-rank')
    if (chart3) {
      echarts.init(chart3).setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: ['第1周','第2周','第3周','第4周','第5周','第6周'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: gridColor } } },
        yAxis: { type: 'value', max: 100, axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridColor } } },
        series: [{ data: [45, 52, 48, 61, 68, 72], type: 'line', smooth: true, itemStyle: { color: '#4f46e5' }, areaStyle: { opacity: .1 } }]
      })
    }
    const chart4 = document.getElementById('chart-geo-score')
    if (chart4) {
      echarts.init(chart4).setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: ['0-20','20-40','40-60','60-80','80-100'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: gridColor } } },
        yAxis: { type: 'value', axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridColor } } },
        series: [{
          data: [3, 7, 12, 8, 4],
          type: 'bar', barWidth: '50%',
          itemStyle: { color: function(p) { return ['#ef4444','#f97316','#eab308','#22c55e','#22c55e'][p.dataIndex] } }
        }]
      })
    }
  }

  // LLM 用量统计
  if (route === 'system/llm') {
    const chart5 = document.getElementById('chart-llm-usage')
    if (chart5) {
      echarts.init(chart5).setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: ['7/1','7/2','7/3','7/4','7/5','7/6','7/7'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: gridColor } } },
        yAxis: { type: 'value', axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridColor } } },
        series: [{ data: [12, 8, 15, 6, 10, 14, 9], type: 'bar', barWidth: '40%', itemStyle: { color: '#4f46e5' } }]
      })
    }
  }
}

// ========== 全局事件委托 ==========
// 按按钮文本内容匹配，无需改 HTML
document.addEventListener('click', function(e) {
  // 主题切换
  if (e.target.closest('#themeToggle')) { toggleTheme(); return }
  // 侧边栏折叠
  if (e.target.closest('#toggleSidebar')) { toggleSidebar(); return }

  const btn = e.target.closest('button, a.btn, .nav-item')
  if (!btn) return
  const text = btn.textContent.trim()

  // 按文本匹配关键操作
  const actions = {
    '登录': () => { location.hash = '#/dashboard'; showToast('登录成功', 'success') },
    '解析并生成骨架': () => startParse(),
    '确认进入编辑器 →': () => { location.hash = '#/editor'; showToast('已进入编辑器', 'success') },
    '确认进入编辑器': () => { location.hash = '#/editor'; showToast('已进入编辑器', 'success') },
    '运行测试': () => runCitationTest(),
    '运行模拟测试': () => runCitationTest(),
    '测试连接': () => testLlmConnection(),
    '保存配置': () => saveLlmConfig(),
    '重新生成': () => regenerateLlmsTxt(),
    '立即备份': () => createBackup(),
    '发布': () => publishSiteReal(),
    '保存并发布': () => publishSiteReal(),
    '一键修复': () => seoAutoFix('选中项'),
    '导出 CSV': () => { showToast('线索已导出为 CSV', 'success') },
    '导出Excel': () => { showToast('线索已导出为 Excel', 'success') },
    '新建': () => { location.hash = '#/cms/edit'; showToast('新建内容', 'info') },
    '应用此模板': () => { location.hash = '#/editor'; showToast('模板已应用，进入编辑器', 'success') },
    '预览': () => previewEditorPage(),
    '保存': () => showToast('内容已保存', 'success'),
    '下载': () => showToast('文件已下载', 'success'),
    '恢复': () => { if(confirm('确认从备份恢复？')) showToast('恢复中...', 'info') },
    '升级': () => { if(confirm('确认升级到新版本？升级前会自动备份。')) showToast('升级中...', 'info') },
    '续期': () => showToast('请联系商务团队续期', 'info'),
    '应用 GEO 写作模板': () => { showToast('GEO 写作模板已插入编辑器', 'success') },
    '重新评分': () => runGeoScore(),
    '运行检查': () => runSeoHealthCheck(),
    '重新检查': () => runSeoHealthCheck(),
    '生成 SEO 文件': () => generateSeoFiles(),
    '重新解析': () => { showParseStep(1) },
  }

  if (actions[text]) { actions[text](); e.preventDefault(); return }

  // 联系方式的 href="tel:" 等不需要拦截
})

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  // 确保默认路由
  if (!location.hash) location.hash = '#/dashboard'
  router()
})
