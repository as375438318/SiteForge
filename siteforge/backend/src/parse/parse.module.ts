import { Module, Controller, Post, Body } from '@nestjs/common'
import { Public } from '../common/decorators/public.decorator'
import * as cheerio from 'cheerio'
import * as https from 'https'
import * as http from 'http'

// ========== 爬取网页 HTML ==========
function fetchHtml(url: string, timeout = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout,
    }, (res) => {
      // 处理重定向
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        const location = res.headers.location
        if (location) {
          const redirectUrl = location.startsWith('http') ? location : new URL(location, url).href
          fetchHtml(redirectUrl, timeout).then(resolve).catch(reject)
          return
        }
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(buffer.toString('utf-8'))
      })
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')) })
  })
}

// ========== 提取配色方案 ==========
function extractColors(html: string): { primary: string; secondary: string; background: string; text: string } {
  const colors = { primary: '#4f46e5', secondary: '#7c3aed', background: '#ffffff', text: '#1a1a2e' }

  // 从 <style> 标签提取
  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []
  const cssText = styleMatches.join('\n')

  // 提取 color/background-color
  const colorHex = cssText.match(/(?:color|background-color|background)\s*:\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\))/g) || []
  const colorCount: Record<string, number> = {}
  for (const c of colorHex) {
    const m = c.match(/(#[0-9a-fA-F]{3,8}|rgb\([^)]+\))/)
    if (m) {
      const color = m[1]
      colorCount[color] = (colorCount[color] || 0) + 1
    }
  }

  // 排序取出现最多的颜色
  const sorted = Object.entries(colorCount).sort((a, b) => b[1] - a[1])
  if (sorted[0]) colors.primary = sorted[0][0]
  if (sorted[1]) colors.secondary = sorted[1][0]

  // 从内联 style 提取
  const bodyColor = html.match(/<body[^>]*style="[^"]*color:\s*(#[0-9a-fA-F]{3,8})/i)
  if (bodyColor) colors.text = bodyColor[1]
  const bgColor = html.match(/<body[^>]*style="[^"]*background[^:]*:\s*(#[0-9a-fA-F]{3,8})/i)
  if (bgColor) colors.background = bgColor[1]

  // 从 <link> 的样式表无法直接获取（需要额外请求），这里用 meta theme-color
  const themeColor = html.match(/<meta[^>]*name="theme-color"[^>]*content="([^"]+)"/i)
  if (themeColor) colors.primary = themeColor[1]

  return colors
}

// ========== 提取字体 ==========
function extractFonts(html: string): string {
  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []
  const cssText = styleMatches.join('\n')
  const fontMatch = cssText.match(/font-family\s*:\s*([^;}{]+)/i)
  if (fontMatch) return fontMatch[1].trim().replace(/['"]/g, '').split(',')[0].trim()
  return 'system-ui'
}

// ========== 识别区块类型 ==========
function identifyBlockType(_el: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string {
  const cls = ($el.attr('class') || '').toLowerCase()
  const id = ($el.attr('id') || '').toLowerCase()
  const tag = $el[0]?.tagName || ''
  const combined = `${cls} ${id} ${tag}`

  // Hero 区
  if (/hero|banner|jumbotron|swiper|carousel|slider/.test(combined)) return 'hero'

  // 特性/服务网格
  if (/feature|service|advantage|why|benefit/.test(combined)) return 'feature_grid'

  // 产品
  if (/product|shop|item|goods/.test(combined)) return 'product_grid'

  // 案例
  if (/case|portfolio|project|work|gallery/.test(combined)) return 'case_list'

  // 团队
  if (/team|member|staff|people/.test(combined)) return 'team'

  // 数据统计
  if (/stat|counter|number|count/.test(combined)) return 'stats'

  // FAQ
  if (/faq|question|accordion/.test(combined)) return 'faq'

  // 评价
  if (/testimonial|review|feedback|quote/.test(combined)) return 'testimonial'

  // 联系
  if (/contact|phone|email|address/.test(combined)) return 'contact_info'

  // 表单
  if (tag === 'form' || /form/.test(combined)) return 'form'

  // 页脚
  if (tag === 'footer' || /footer/.test(combined)) return 'footer'

  // 导航
  if (tag === 'nav' || /nav|menu/.test(combined)) return 'nav'

  // 图文
  if ($el.find('img').length > 0 && $el.find('p, h1, h2, h3').length > 0) return 'text_image'

  // 纯文字段落
  if ($el.find('h1, h2, h3').length > 0) return 'text_block'

  return 'custom'
}

// ========== 提取区块占位内容 ==========
function extractBlockProps(type: string, $: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): any {
  const getText = (sel: string) => $el.find(sel).first().text().trim() || ''
  const getAttr = (sel: string, attr: string) => $el.find(sel).first().attr(attr) || ''

  switch (type) {
    case 'hero':
      return {
        title: getText('h1') || getText('h2') || getText('.title') || '【占位】企业标语',
        subtitle: getText('p') || getText('.subtitle') || getText('.desc') || '【占位】一句话描述核心价值',
        cta: $el.find('a').first().text().trim() || '了解更多',
        backgroundImage: getAttr('img', 'src') || '',
      }
    case 'feature_grid': {
      const items: any[] = []
      $el.find('.item, .card, li, .feature').slice(0, 6).each((_, elem) => {
        const $item = $(elem)
        items.push({
          icon: '✦',
          title: $item.find('h3, h4, .title').first().text().trim() || '【占位】优势',
          desc: $item.find('p, .desc').first().text().trim() || '【占位】描述',
        })
      })
      return { title: getText('h2') || '核心优势', items: items.length > 0 ? items : [{ icon: '✦', title: '【占位】优势1', desc: '【占位】描述' }] }
    }
    case 'product_grid': {
      const items: any[] = []
      $el.find('.product, .item, .card, li').slice(0, 6).each((_, elem) => {
        const $item = $(elem)
        items.push({
          title: $item.find('h3, h4, .title').first().text().trim() || '【占位】产品',
          img: $item.find('img').first().attr('src') || '',
          desc: $item.find('p, .desc').first().text().trim() || '',
        })
      })
      return { title: getText('h2') || '产品服务', items }
    }
    case 'case_list': {
      const items: any[] = []
      $el.find('.case, .item, .card, li').slice(0, 6).each((_, elem) => {
        const $item = $(elem)
        items.push({
          title: $item.find('h3, h4, .title').first().text().trim() || '【占位】案例',
          img: $item.find('img').first().attr('src') || '',
        })
      })
      return { title: getText('h2') || '成功案例', items }
    }
    case 'team': {
      const items: any[] = []
      $el.find('.member, .person, .item, li').slice(0, 6).each((_, elem) => {
        const $item = $(elem)
        items.push({
          name: $item.find('.name, h3, h4').first().text().trim() || '【占位】姓名',
          role: $item.find('.role, .position, .job').first().text().trim() || '【占位】职位',
          avatar: $item.find('img').first().attr('src') || '',
        })
      })
      return { title: getText('h2') || '团队介绍', items }
    }
    case 'stats': {
      const items: any[] = []
      $el.find('.stat, .counter, .item, .number').slice(0, 6).each((_, elem) => {
        const $item = $(elem)
        items.push({
          number: $item.find('.number, .count').first().text().trim() || '0',
          label: $item.find('.label, .desc, p').first().text().trim() || '',
        })
      })
      return { title: '数据统计', items }
    }
    case 'faq': {
      const items: any[] = []
      $el.find('.faq-item, .item, details, dt').slice(0, 8).each((_, elem) => {
        const $item = $(elem)
        items.push({
          question: $item.find('.question, h3, h4, dt, summary').first().text().trim() || '【占位】问题',
          answer: $item.find('.answer, p, dd').first().text().trim() || '【占位】回答',
        })
      })
      return { title: '常见问题', items }
    }
    case 'testimonial':
      return {
        quote: $el.find('blockquote, p, .quote').first().text().trim() || '【占位】客户评价',
        author: $el.find('.author, .name, cite').first().text().trim() || '【占位】客户',
        title: '',
      }
    case 'contact_info': {
      const text = $el.text()
      const phone = text.match(/1[3-9]\d{9}|0\d{2,3}-?\d{7,8}/)?.[0] || '【占位】电话'
      const email = text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || '【占位】邮箱'
      return { phone, email, address: '【占位】地址' }
    }
    case 'form':
      return { title: getText('h2, h3, label') || '在线咨询' }
    case 'footer':
      return {
        companyName: $el.find('.logo, .name, h4').first().text().trim() || '',
        description: $el.find('p').first().text().trim() || '',
        phone: '',
        email: '',
      }
    case 'text_image':
      return {
        title: getText('h2, h3') || '【占位】标题',
        content: getText('p') || '【占位】内容',
        image: getAttr('img', 'src'),
      }
    case 'text_block':
      return {
        title: getText('h2, h3') || '【占位】标题',
        content: getText('p') || '【占位】内容',
      }
    default:
      return { title: getText('h2, h3') || '【占位】区块' }
  }
}

// ========== 主解析函数 ==========
async function parseWebsite(url: string) {
  let domain = ''
  let siteName = ''
  try {
    const u = new URL(url)
    domain = u.hostname
    siteName = domain.split('.')[0]
  } catch {
    domain = url
    siteName = '网站'
  }

  // 1. 爬取首页 HTML
  let html = ''
  try {
    html = await fetchHtml(url)
  } catch (err: any) {
    throw new Error(`无法访问网站: ${err.message}`)
  }

  const $ = cheerio.load(html)

  // 2. 提取站点信息
  const title = $('title').first().text().trim() || siteName
  const description = $('meta[name="description"]').attr('content') || ''
  const colors = extractColors(html)
  const font = extractFonts(html)

  // 3. 提取导航
  const navigation: any[] = []
  $('nav a, header a, .nav a, .menu a').slice(0, 10).each((_, el) => {
    const $a = $(el)
    const label = $a.text().trim()
    const href = $a.attr('href') || ''
    if (label && href && !href.startsWith('javascript') && !href.startsWith('#')) {
      navigation.push({ label, url: href.startsWith('/') ? href : `/${href}` })
    }
  })

  // 如果没找到导航，尝试从链接提取
  if (navigation.length === 0) {
    $('header a, .header a').slice(0, 8).each((_, el) => {
      const $a = $(el)
      const label = $a.text().trim()
      const href = $a.attr('href') || ''
      if (label && href.startsWith('/')) navigation.push({ label, url: href })
    })
  }

  // 4. 提取主要内容区块
  const blocks: any[] = []
  const seenTypes = new Set<string>()
  let sortOrder = 0

  // 检查 body > 直接子元素 或 main > section
  const mainContent = $('main, .main, #content, .content, body').first()
  mainContent.children('section, .section, .banner, .hero, header, footer, div').each((_, el) => {
    const $el = $(el)
    // 跳过太小的区块
    if ($el.text().trim().length < 10 && $el.find('img').length === 0) return

    const type = identifyBlockType($, $el)
    if (type === 'nav' || type === 'custom') return

    // 同类型区块最多取2个
    if (seenTypes.has(type) && type !== 'text_image' && type !== 'text_block') return
    seenTypes.add(type)

    const props = extractBlockProps(type, $, $el)
    blocks.push({ type, sortOrder: sortOrder++, props })
  })

  // 如果没提取到区块，用兜底结构
  if (blocks.length === 0) {
    blocks.push(
      { type: 'hero', sortOrder: 0, props: { title: `【占位】${title}`, subtitle: description || '【占位】一句话描述', cta: '了解更多' } },
      { type: 'feature_grid', sortOrder: 1, props: { title: '核心优势', items: [{ icon: '✦', title: '【占位】优势1', desc: '【占位】描述' }, { icon: '✦', title: '【占位】优势2', desc: '【占位】描述' }] } },
      { type: 'cta', sortOrder: 2, props: { title: '联系我们', button: '立即咨询' } },
    )
  }

  // 确保 footer 存在
  if (!blocks.find(b => b.type === 'footer')) {
    blocks.push({ type: 'footer', sortOrder: sortOrder++, props: { companyName: title, description, phone: '', email: '' } })
  }

  // 5. 构建首页
  const homePage = {
    type: 'home',
    title: '首页',
    url: '/',
    blocks,
  }

  // 6. 根据导航生成子页面骨架
  const pages = [homePage]
  const navUrls = navigation.filter(n => n.url !== '/' && n.url !== '').slice(0, 4)
  for (const nav of navUrls) {
    let pageHtml = ''
    try {
      const pageUrl = `${url.startsWith('http') ? url : `http://${url}`}${nav.url}`
      pageHtml = await fetchHtml(pageUrl, 10000)
    } catch {
      // 子页面爬取失败，用空骨架
    }

    let pageBlocks: any[] = [{ type: 'page_header', sortOrder: 0, props: { title: nav.label } }]
    if (pageHtml) {
      const $page = cheerio.load(pageHtml)
      const pageBlocksTemp: any[] = []
      let pSort = 1
      $page('main, .main, #content, .content, body').first().children('section, .section, div').each((_, el) => {
        const $el = $page(el)
        if ($el.text().trim().length < 10 && $el.find('img').length === 0) return
        const type = identifyBlockType($page, $el)
        if (type === 'nav' || type === 'custom') return
        pageBlocksTemp.push({ type, sortOrder: pSort++, props: extractBlockProps(type, $page, $el) })
      })
      if (pageBlocksTemp.length > 0) pageBlocks = pageBlocksTemp
    }
    pages.push({ type: 'custom', title: nav.label, url: nav.url, blocks: pageBlocks })
  }

  return {
    url,
    domain,
    siteName: title,
    title,
    description,
    colors,
    font,
    pages,
    navigation: navigation.length > 0 ? navigation : [
      { label: '首页', url: '/' },
      { label: '关于我们', url: '/about' },
      { label: '联系我们', url: '/contact' },
    ],
    note: '已爬取原站结构并提取配色/字体方案。文字内容为占位提示，请替换为你的内容。图片路径保留原站路径，建议替换为自己的图片。',
  }
}

// ========== Controller ==========
@Controller('parse')
class ParseController {
  @Public()
  @Post()
  async parse(@Body() body: { url: string }) {
    if (!body?.url) return { error: '请提供 URL' }
    try {
      return await parseWebsite(body.url)
    } catch (err: any) {
      return {
        error: err.message,
        url: body.url,
        pages: [],
        navigation: [],
        note: `解析失败: ${err.message}。请检查URL是否可访问。`,
      }
    }
  }
}

@Module({ controllers: [ParseController] })
export class ParseModule {}
