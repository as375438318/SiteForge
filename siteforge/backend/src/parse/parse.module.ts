import { Module, Controller, Post, Body } from '@nestjs/common'

function mockParse(url: string) {
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
          { type: 'feature_grid', sortOrder: 1, props: { title: '核心优势', items: [{ icon: '⚡', title: '【占位】优势1', desc: '【占位】描述' }, { icon: '🛡️', title: '【占位】优势2', desc: '【占位】描述' }, { icon: '📊', title: '【占位】优势3', desc: '【占位】描述' }] } },
          { type: 'cta', sortOrder: 2, props: { title: '【占位】联系我们', button: '立即咨询' } },
        ],
      },
      {
        type: 'product_list',
        title: '产品服务',
        url: '/products',
        blocks: [
          { type: 'page_header', sortOrder: 0, props: { title: '产品服务' } },
          { type: 'product_grid', sortOrder: 1, props: { title: '我们的产品' } },
        ],
      },
      {
        type: 'case_list',
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
    note: '此为 mock 解析结果。真实环境将调用云端解析服务，仅复刻结构骨架，不含原站文字/图片内容。',
  }
}

@Controller('parse')
class ParseController {
  @Post()
  parse(@Body() body: { url: string }) {
    if (!body?.url) return { error: '请提供 URL' }
    return mockParse(body.url)
  }
}

@Module({ controllers: [ParseController] })
export class ParseModule {}
