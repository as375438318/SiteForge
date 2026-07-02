/**
 * SiteForge - 结构解析器（原型 mock 版）
 * 真实环境调用云端解析服务，原型用 mock 数据演示
 */

// 模拟解析结果生成
function mockParseUrl(url) {
  // 从 URL 提取域名作为站点名
  let domain = 'example.com'
  let siteName = '示例企业'
  try {
    const u = new URL(url)
    domain = u.hostname
    siteName = domain.split('.')[0]
  } catch (_) {}

  return {
    url,
    domain,
    siteName,
    pages: [
      {
        type: 'home',
        title: '首页',
        url: '/',
        blocks: [
          { type: 'hero', sortOrder: 0, props: { title: '【占位】企业标语', subtitle: '【占位】一句话描述核心价值', cta: '了解更多' } },
          { type: 'feature_grid', sortOrder: 1, props: { title: '核心优势', items: [
            { icon: '⚡', title: '【占位】优势1', desc: '【占位】描述' },
            { icon: '🛡️', title: '【占位】优势2', desc: '【占位】描述' },
            { icon: '📊', title: '【占位】优势3', desc: '【占位】描述' },
          ]}},
          { type: 'product_list', sortOrder: 2, props: { title: '产品服务' } },
          { type: 'cta', sortOrder: 3, props: { title: '【占位】联系我们', button: '立即咨询' } },
        ],
      },
      {
        type: 'product',
        title: '产品服务',
        url: '/products',
        blocks: [
          { type: 'page_header', sortOrder: 0, props: { title: '产品服务' } },
          { type: 'product_grid', sortOrder: 1, props: { title: '我们的产品' } },
        ],
      },
      {
        type: 'case',
        title: '成功案例',
        url: '/cases',
        blocks: [
          { type: 'page_header', sortOrder: 0, props: { title: '成功案例' } },
          { type: 'case_list', sortOrder: 1, props: { title: '客户案例' } },
        ],
      },
      {
        type: 'about',
        title: '关于我们',
        url: '/about',
        blocks: [
          { type: 'page_header', sortOrder: 0, props: { title: '关于我们' } },
          { type: 'text_image', sortOrder: 1, props: { title: '【占位】公司简介', content: '【占位】在此填写公司简介...' } },
          { type: 'team', sortOrder: 2, props: { title: '团队介绍' } },
        ],
      },
      {
        type: 'contact',
        title: '联系我们',
        url: '/contact',
        blocks: [
          { type: 'page_header', sortOrder: 0, props: { title: '联系我们' } },
          { type: 'contact_info', sortOrder: 1, props: { phone: '【占位】电话', email: '【占位】邮箱', address: '【占位】地址' } },
          { type: 'form', sortOrder: 2, props: { title: '在线咨询' } },
        ],
      },
    ],
    navigation: [
      { label: '首页', url: '/' },
      { label: '产品服务', url: '/products' },
      { label: '成功案例', url: '/cases' },
      { label: '关于我们', url: '/about' },
      { label: '联系我们', url: '/contact' },
    ],
    note: '此为原型 mock 解析结果。真实环境将调用云端解析服务（Playwright + cheerio + 分类模型），仅复刻结构骨架，不含原站文字/图片内容。',
  }
}

// 区块类型说明
const blockTypeDescriptions = {
  hero: 'Hero 大图区 — 标题+副标题+CTA+背景',
  feature_grid: '特性网格 — 多个优势卡片排列',
  product_list: '产品列表 — 产品卡片列表',
  product_grid: '产品网格 — 产品卡片网格',
  case_list: '案例列表 — 客户案例卡片',
  page_header: '页面标题区 — 页面标题+面包屑',
  text_image: '图文介绍 — 文字+图片并排',
  team: '团队介绍 — 头像+姓名+职位',
  cta: '行动号召区 — 标题+按钮',
  contact_info: '联系信息 — 电话/邮箱/地址',
  form: '表单区 — 询盘/留言表单',
  stats: '数据统计 — 大数字+标签',
  faq: '常见问答 — Q&A 折叠面板',
  testimonial: '客户评价 — 证言+头像',
  map: '地图区 — 嵌入地图',
  footer: '页脚 — 多列链接区',
}

module.exports = { mockParseUrl, blockTypeDescriptions }
