import { Injectable } from '@nestjs/common'

// ========== GEO 引擎核心逻辑（从原型 + GEO 专项设计文档迁移）==========

function scoreFactDensity(text: string) {
  const patterns = { percentage: /\d+(\.\d+)?\s*%/g, currency: /[\d,]+(\.\d+)?\s*(亿|万|元|美元)/g, multiplier: /\d+(\.\d+)?\s*倍/g, number: /\b\d{2,}\b/g, date: /\d{4}年|\d{4}-\d{2}/g }
  let total = 0
  for (const r of Object.values(patterns)) { total += (text.match(r) || []).length }
  const density = total / (Math.max(text.length / 2, 1) / 1000)
  const score = density >= 5 ? 20 : density >= 3 ? 15 : density >= 1 ? 10 : 5
  return { dimension: '事实陈述密度', dimensionKey: 'factDensity', score, maxScore: 20, level: density >= 3 ? 'excellent' : density >= 1 ? 'fair' : 'poor', suggestions: density < 3 ? ['建议补充统计数据，可提升AI引用33%'] : [] }
}

function scoreStructure(text: string, html: string) {
  let pts = 0
  if ((text.match(/.{2,30}[？?]\s*\n/g) || []).length >= 2) pts += 6
  if (((html.match(/<li>/g) || []).length + (text.match(/^[\d一二三四五六七八九十][\.、]/gm) || []).length) >= 3) pts += 4
  if ((html.match(/<table/g) || []).length > 0) pts += 4
  if ((text.match(/.{2,10}(?:是指|定义为|是)/g) || []).length >= 2) pts += 3
  if ((text.match(/第[一二三四五六七八九十]步|步骤[1-9]|^\d+\.\s/gm) || []).length >= 3) pts += 3
  return { dimension: '结构化程度', dimensionKey: 'structure', score: Math.min(pts, 20), maxScore: 20, level: pts >= 10 ? 'good' : pts >= 5 ? 'fair' : 'poor', suggestions: pts < 10 ? ['建议增加FAQ、列表、表格等结构化内容'] : [] }
}

function scoreCitations(text: string, html: string) {
  let pts = 0
  const ext = (html.match(/href="https?:\/\/([^"\/]+)/g) || []).length
  if (ext >= 3) pts += 6; else if (ext >= 1) pts += 3
  const src = (text.match(/来源[：:]|引自|据.{2,10}报道/g) || []).length
  if (src >= 2) pts += 5; else if (src >= 1) pts += 3
  const quotes = (text.match(/["""].{10,}["""].*?(?:表示|认为|指出)/g) || []).length
  if (quotes >= 1) pts += 4
  return { dimension: '引用来源', dimensionKey: 'citations', score: Math.min(pts, 15), maxScore: 15, level: pts >= 8 ? 'good' : pts >= 4 ? 'fair' : 'poor', suggestions: pts < 8 ? ['建议标注数据来源，可提升AI引用28%'] : [] }
}

function scoreAuthority(meta: any) {
  let pts = 0
  if (meta.author) pts += 4
  if (meta.authorTitle) pts += 3
  if (meta.publishedAt) pts += 3
  if (meta.updatedAt && meta.updatedAt !== meta.publishedAt) pts += 2
  if (meta.authorBio) pts += 3
  return { dimension: '权威性信号', dimensionKey: 'authority', score: Math.min(pts, 15), maxScore: 15, level: pts >= 8 ? 'good' : pts >= 4 ? 'fair' : 'poor', suggestions: pts < 8 ? ['建议补充作者信息和发布时间，可提升AI引用41%'] : [] }
}

function scoreCompleteness(text: string, html: string) {
  let pts = 0
  const wc = text.length
  if (wc >= 1500) pts += 6; else if (wc >= 800) pts += 4; else if (wc >= 300) pts += 2
  const paras = text.split(/\n\s*\n/).filter((p) => p.trim().length > 30)
  if (paras.length >= 5) pts += 3; else if (paras.length >= 3) pts += 2; else if (paras.length >= 1) pts += 1
  const imgs = (html.match(/<img/g) || []).length
  if (imgs >= 3) pts += 2; else if (imgs >= 1) pts += 1
  const unique = new Set(text.replace(/[\s\p{P}]/gu, '').split(''))
  const ratio = unique.size / Math.max(text.length, 1)
  if (ratio > 0.4) pts += 4; else if (ratio > 0.25) pts += 2
  return { dimension: '内容完整度', dimensionKey: 'completeness', score: Math.min(pts, 15), maxScore: 15, level: pts >= 8 ? 'good' : pts >= 4 ? 'fair' : 'poor', suggestions: wc < 800 ? [`当前${wc}字，建议扩展至800字以上`] : [] }
}

function scoreSemantic(_text: string, html: string) {
  let pts = 0
  const h1 = (html.match(/<h1/gi) || []).length; if (h1 === 1) pts += 3
  const h2 = (html.match(/<h2/gi) || []).length; if (h2 >= 2) pts += 3; else if (h2 >= 1) pts += 2
  pts += 3; pts += 3 // 简化
  return { dimension: '语义清晰度', dimensionKey: 'semanticClarity', score: Math.min(pts, 15), maxScore: 15, level: pts >= 8 ? 'good' : 'fair', suggestions: [] }
}

function scoreCitability(content: { text: string; html: string; meta: any }) {
  const dims = [
    scoreFactDensity(content.text), scoreStructure(content.text, content.html),
    scoreCitations(content.text, content.html), scoreAuthority(content.meta),
    scoreCompleteness(content.text, content.html), scoreSemantic(content.text, content.html),
  ]
  const total = dims.reduce((s, d) => s + d.score, 0)
  return { total, maxTotal: 100, level: total >= 80 ? 'excellent' : total >= 60 ? 'good' : total >= 40 ? 'fair' : 'poor', dimensions: dims, topIssues: dims.filter(d => d.level === 'poor' || d.level === 'fair').flatMap(d => d.suggestions).slice(0, 3), scoredAt: new Date().toISOString() }
}

function generateLlmsTxt(site: any): string {
  const lines = [`# ${site.name}`, '', `> ${site.description || '企业官方网站'}`, '', '## 主要内容', '']
  for (const p of (site.pages || [])) { lines.push(`- ${p.title}: https://${site.domain}${p.url} - ${p.summary || ''}`) }
  lines.push('', '## 补充说明', '', site.description || `${site.name} 致力于提供专业服务。`)
  return lines.join('\n')
}

function generateLlmsFullTxt(site: any): string {
  let txt = `# ${site.name} — 完整内容指南\n\n> ${site.description || ''}\n\n## 企业概况\n\n${site.about || ''}\n\n`
  const products = (site.contents || []).filter((c: any) => c.type === 'product' && c.status === 'published')
  if (products.length > 0) { txt += '## 产品与服务\n\n'; for (const p of products) { txt += `### ${p.title}\n\n${p.summary || ''}\n\n[查看详情](https://${site.domain}/products/${p.slug})\n\n` } }
  txt += `## 联系我们\n\n- 网站: https://${site.domain}\n`
  return txt
}

function retrieveRelevant(question: string, contents: any[], topK = 5) {
  const kw = question.replace(/[\s\p{P}]/gu, '').match(/.{2,4}/g) || []
  return contents.map(c => {
    const text = (c.title + ' ' + (c.summary || '') + ' ' + c.text).toLowerCase()
    let score = 0
    for (const w of kw) { score += (text.match(new RegExp(w, 'gi')) || []).length }
    return { ...c, relevanceScore: score }
  }).filter(c => c.relevanceScore > 0).sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, topK)
}

@Injectable()
export class GeoService {
  score(content: any) { return scoreCitability(content) }

  generateLlmsTxt(site: any) { return { llmsTxt: generateLlmsTxt(site), llmsFullTxt: generateLlmsFullTxt(site) } }

  citationTest(question: string, contents: any[]) {
    const retrieved = retrieveRelevant(question, contents)
    if (retrieved.length === 0) {
      return { wouldCite: false, citationProbability: 'low', simulatedAnswer: '未找到相关内容', reason: '未检索到相关内容', suggestions: ['创建相关内容'], retrievedCount: 0, disclaimer: '模拟测试，非真实AI搜索预测' }
    }
    const scored = retrieved.map(c => ({ ...c, citabilityScore: scoreCitability({ text: c.text, html: c.text, meta: c.meta || {} }).total }))
    const top = scored[0]
    if (top.citabilityScore >= 80) {
      return { wouldCite: true, citationProbability: 'high', simulatedAnswer: `基于${top.title}：${top.summary || top.text.substring(0, 200)}`, reason: `评分${top.citabilityScore}，很可能被引用`, suggestions: ['保持内容质量'], retrievedCount: scored.length, retrievedContents: scored, disclaimer: '模拟测试，非真实AI搜索预测' }
    } else if (top.citabilityScore >= 60) {
      return { wouldCite: true, citationProbability: 'medium', simulatedAnswer: `根据${top.title}：${top.summary || top.text.substring(0, 150)}`, reason: `评分${top.citabilityScore}，可能被引用`, suggestions: ['优化内容结构'], retrievedCount: scored.length, retrievedContents: scored, disclaimer: '模拟测试，非真实AI搜索预测' }
    }
    return { wouldCite: false, citationProbability: 'low', simulatedAnswer: '内容质量不足以被引用', reason: `评分${top.citabilityScore}，需优化`, missingInfo: '建议补充数据和FAQ', suggestions: [`优化"${top.title}"的评分至60+`], retrievedCount: scored.length, retrievedContents: scored, disclaimer: '模拟测试，非真实AI搜索预测' }
  }
}
