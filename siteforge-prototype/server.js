/**
 * SiteForge - 核心引擎验证原型
 * 验证 AI 结构复刻 + SEO 引擎 + GEO 引擎 + 静态站点生成 的完整链路
 */

const express = require('express')
const path = require('path')
const { scoreCitability } = require('./src/geo/citability-scorer')
const { generateLlmsTxt, generateLlmsFullTxt } = require('./src/geo/llms-txt-generator')
const { analyzeWritingTips, writingTemplates } = require('./src/geo/writing-assistant')
const { generateSite, generatePage } = require('./src/ssg/site-generator')
const { blockRenderers } = require('./src/ssg/block-renderer')
const { simulateCitationRuleBased, simulateCitationLLM, retrieveRelevantContents } = require('./src/geo/citation-tester')
const { LLMAdapter, PROVIDER_PRESETS } = require('./src/geo/llm-adapter')
const { generateSitemap, generateRobotsTxt, generateSchema, runHealthCheck } = require('./src/seo/seo-engine')
const { mockParseUrl, blockTypeDescriptions } = require('./src/parser/structure-parser')

const app = express()
const PORT = 3000

app.use(express.json({ limit: '10mb' }))
app.use(express.static(path.join(__dirname, 'public')))

// 全局 LLM 适配器实例
const llmAdapter = new LLMAdapter()

// ========== API 路由 ==========

// 1. 结构解析（mock）
app.post('/api/parse', (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: '请提供 URL' })
  try {
    const result = mockParseUrl(url)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 2. GEO 可引用性评分
app.post('/api/geo/score', (req, res) => {
  const { text, html, meta, domain } = req.body
  if (!text) return res.status(400).json({ error: '请提供内容文本' })
  try {
    const result = scoreCitability({ text, html: html || text, meta: meta || {}, domain })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 3. GEO 写作辅助
app.post('/api/geo/writing-tips', (req, res) => {
  const { text, html, type, meta } = req.body
  if (!text) return res.status(400).json({ error: '请提供内容文本' })
  try {
    const result = analyzeWritingTips({ text, html: html || text, type, meta })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 4. llms.txt 生成
app.post('/api/geo/llms-txt', (req, res) => {
  const site = req.body
  if (!site.name) return res.status(400).json({ error: '请提供站点名称' })
  try {
    res.json({
      llmsTxt: generateLlmsTxt(site),
      llmsFullTxt: generateLlmsFullTxt(site),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 5. AI 引用模拟测试
app.post('/api/geo/citation-test', async (req, res) => {
  const { question, contents } = req.body
  if (!question) return res.status(400).json({ error: '请提供测试问题' })
  if (!contents || !Array.isArray(contents)) return res.status(400).json({ error: '请提供站点内容列表' })
  try {
    const retrieved = retrieveRelevantContents(question, contents)
    const result = llmAdapter.isConfigured()
      ? await simulateCitationLLM(question, retrieved, llmAdapter)
      : simulateCitationRuleBased(question, retrieved)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 6. 写作模板
app.get('/api/geo/templates', (req, res) => {
  res.json(writingTemplates)
})

// 7. SEO 生成
app.post('/api/seo/generate', (req, res) => {
  const { site, page, content } = req.body
  if (!site) return res.status(400).json({ error: '请提供站点信息' })
  try {
    res.json({
      sitemap: generateSitemap(site),
      robots: generateRobotsTxt(site),
      schema: generateSchema(site, page, content),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 8. SEO 健康度检查
app.post('/api/seo/health-check', (req, res) => {
  const { site, pages } = req.body
  if (!site || !pages) return res.status(400).json({ error: '请提供站点和页面信息' })
  try {
    const result = runHealthCheck(site, pages)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ========== SSG 静态站点生成 ==========

// 8.5 生成完整静态站点
app.post('/api/ssg/generate', (req, res) => {
  const site = req.body
  if (!site || !site.pages) return res.status(400).json({ error: '请提供站点数据（含 pages）' })
  try {
    const result = generateSite(site)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 8.6 预览单页面
app.post('/api/ssg/preview-page', (req, res) => {
  const { site, page } = req.body
  if (!site || !page) return res.status(400).json({ error: '请提供站点和页面数据' })
  try {
    const html = generatePage(site, page)
    res.json({ html })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 8.7 获取可用区块类型列表
app.get('/api/blocks/types', (req, res) => {
  const types = Object.keys(blockRenderers).map(type => ({
    type,
    label: blockTypeLabels[type] || type,
  }))
  res.json(types)
})

const blockTypeLabels = {
  hero: 'Hero 大图区', feature_grid: '特性网格', product_grid: '产品网格',
  product_list: '产品列表', case_list: '案例列表', page_header: '页面标题',
  text_image: '图文介绍', team: '团队介绍', cta: '行动号召',
  contact_info: '联系信息', form: '表单', stats: '数据统计',
  faq: '常见问答', testimonial: '客户评价', map: '地图', footer: '页脚',
}

// 8.8 渲染单个区块（编辑器实时预览用）
app.post('/api/blocks/render', (req, res) => {
  const { block } = req.body
  if (!block || !block.type) return res.status(400).json({ error: '请提供区块数据' })
  try {
    const { renderBlock } = require('./src/ssg/block-renderer')
    const html = renderBlock(block)
    res.json({ html })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 9. LLM 配置
app.post('/api/llm/configure', (req, res) => {
  const { provider, apiKey, model } = req.body
  if (!provider || !apiKey) return res.status(400).json({ error: '请提供服务商和 API Key' })
  try {
    llmAdapter.configure(provider, apiKey, model)
    res.json({ success: true, message: '配置成功', provider: PROVIDER_PRESETS[provider] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 10. LLM 连通性测试
app.post('/api/llm/test', async (req, res) => {
  try {
    const result = await llmAdapter.testConnection()
    res.json(result)
  } catch (err) {
    res.json({ success: false, message: err.message })
  }
})

// 11. LLM 状态
app.get('/api/llm/status', (req, res) => {
  res.json({
    configured: llmAdapter.isConfigured(),
    provider: llmAdapter.provider?.label || null,
    model: llmAdapter.provider?.model || null,
    usage: llmAdapter.getUsageStats(),
  })
})

// 12. LLM 服务商列表
app.get('/api/llm/providers', (req, res) => {
  res.json(PROVIDER_PRESETS)
})

// 13. 区块类型说明
app.get('/api/block-types', (req, res) => {
  res.json(blockTypeDescriptions)
})

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n┌─────────────────────────────────────────────┐`)
  console.log(`│  SiteForge 核心引擎验证原型已启动            │`)
  console.log(`│                                              │`)
  console.log(`│  访问地址: http://localhost:${PORT}            │`)
  console.log(`│                                              │`)
  console.log(`│  功能:                                       │`)
  console.log(`│  ✅ AI 结构解析（mock）                       │`)
  console.log(`│  ✅ GEO 可引用性评分（6 维度）                 │`)
  console.log(`│  ✅ llms.txt 生成                             │`)
  console.log(`│  ✅ AI 友好写作辅助                           │`)
  console.log(`│  ✅ AI 引用模拟测试                           │`)
  console.log(`│  ✅ SEO 自动化（sitemap/robots/Schema）       │`)
  console.log(`│  ✅ SEO 健康度检查                            │`)
  console.log(`│  ✅ LLM 适配层（千问/DeepSeek/智谱）          │`)
  console.log(`│  ✅ 静态站点生成（SSG）+ 区块编辑器            │`)
  console.log(`└─────────────────────────────────────────────┘\n`)
})
