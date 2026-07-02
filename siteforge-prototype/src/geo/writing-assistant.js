/**
 * SiteForge - AI 友好写作辅助（规则版）
 * 在编辑器中实时检测内容，给出 GEO 优化提示
 */

function analyzeWritingTips(content) {
  const text = content.text || ''
  const html = content.html || text
  const tips = []

  // 1. 无数据检测
  const numbers = (text.match(/\d+(\.\d+)?\s*[%倍万亿]/g) || []).length
  if (numbers === 0 && text.length > 100) {
    tips.push({
      type: 'suggestion',
      icon: '💡',
      rule: '无数据',
      message: '内容中缺少具体数据。补充性能数据或成果数据可提升 AI 引用概率。例："效率提升 47%" 优于 "效率大幅提升"',
    })
  }

  // 2. 无小标题检测
  const h2Count = (html.match(/<h2/gi) || []).length
  const textBlocks = text.split(/\n/).filter(p => p.trim().length > 100)
  if (h2Count === 0 && textBlocks.length >= 2) {
    tips.push({
      type: 'suggestion',
      icon: '💡',
      rule: '无小标题',
      message: '添加 H2 小标题让 AI 更易提取关键信息。AI 搜索偏好结构化内容',
    })
  }

  // 3. 无 FAQ 检测
  const hasFAQ = text.includes('？') || text.includes('?') || html.includes('faq')
  const contentType = content.type || 'post'
  if (!hasFAQ && (contentType === 'product' || contentType === 'case')) {
    tips.push({
      type: 'suggestion',
      icon: '💡',
      rule: '无 FAQ',
      message: '添加常见问答区块，AI 搜索偏好 Q&A 结构。建议添加 3-5 个用户可能提问的问题',
    })
  }

  // 4. 无引用来源检测
  const hasNumbers = numbers > 0
  const hasSource = text.match(/来源[：:]|引自|据.{2,10}报道|参考[：:]/)
  if (hasNumbers && !hasSource) {
    tips.push({
      type: 'suggestion',
      icon: '💡',
      rule: '无引用来源',
      message: '内容含数据但未标注来源。标注数据来源增强权威性，例：添加 "来源：XX报告"',
    })
  }

  // 5. 无作者检测
  if (contentType === 'post' && (!content.meta || !content.meta.author)) {
    tips.push({
      type: 'suggestion',
      icon: '💡',
      rule: '无作者',
      message: '填写作者姓名和身份，权威信号可提升 AI 引用概率 41%（Princeton GEO 论文数据）',
    })
  }

  // 6. 段落过长检测
  const longParagraphs = textBlocks.filter(p => p.length > 300)
  if (longParagraphs.length > 0) {
    tips.push({
      type: 'warning',
      icon: '⚠️',
      rule: '段落过长',
      message: `有 ${longParagraphs.length} 个段落超过 300 字，建议拆分为更短段落（< 200 字/段），便于 AI 提取`,
    })
  }

  // 7. 标题跳级检测
  const headings = []
  const headingRegex = /<h([1-6])[^>]*>/gi
  let m
  while ((m = headingRegex.exec(html)) !== null) {
    headings.push(parseInt(m[1]))
  }
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      tips.push({
        type: 'warning',
        icon: '⚠️',
        rule: '标题跳级',
        message: `标题层级有跳级（H${headings[i-1]} 直接到 H${headings[i]}），应保持 H1→H2→H3 递进`,
      })
      break
    }
  }

  // 8. 关键词堆砌检测
  const wordFreq = {}
  const words = text.replace(/[\s\p{P}]/gu, '').match(/.{2,4}/g) || []
  for (const w of words) {
    wordFreq[w] = (wordFreq[w] || 0) + 1
  }
  const maxFreq = Math.max(...Object.values(wordFreq))
  const density = maxFreq / Math.max(words.length, 1)
  if (density > 0.05 && text.length > 200) {
    const maxWord = Object.entries(wordFreq).find(([_, v]) => v === maxFreq)[0]
    tips.push({
      type: 'warning',
      icon: '⚠️',
      rule: '关键词堆砌',
      message: `"${maxWord}" 出现频率过高(${(density * 100).toFixed(1)}%)，关键词堆砌在 AI 搜索中反而降低可见性 -8%，建议自然写作`,
    })
  }

  return {
    tips,
    summary: {
      total: tips.length,
      suggestions: tips.filter(t => t.type === 'suggestion').length,
      warnings: tips.filter(t => t.type === 'warning').length,
    },
  }
}

// GEO 写作模板
const writingTemplates = {
  faq: {
    name: '行业问答模板（FAQ）',
    content: `## 常见问题

### {产品} 是什么？

{清晰定义，2-3句}

### {产品} 适合什么样的企业？

{目标客户描述 + 具体场景，含数据支撑}

### {产品} 的核心优势是什么？

{列举 3 个优势，每个含数据对比}

### 如何选择{品类}？

{选购指南，步骤化或对比表格}

### {产品} 的价格是多少？

{定价说明，含具体数字区间}`,
  },
  product: {
    name: '产品能力模板',
    content: `## {产品名称}

### 产品概述

{一句话定义 + 核心价值}

### 核心能力

| 能力 | 描述 | 数据指标 |
|------|------|---------|
| {能力1} | {描述} | {如：准确率 92%} |
| {能力2} | {描述} | {如：处理速度 3ms} |

### 技术参数

- {参数1}: {值}
- {参数2}: {值}

### 应用场景

1. {场景1}: {说明}
2. {场景2}: {说明}`,
  },
  solution: {
    name: '解决方案模板',
    content: `## {行业/场景} 解决方案

### 行业挑战

{行业痛点描述，含统计数据。来源：XX报告}

### 我们的方案

{方案概述 + 核心机制}

### 实施步骤

1. **{步骤1}**: {说明}
2. **{步骤2}**: {说明}
3. **{步骤3}**: {说明}

### 客户成果

> "{客户证言}" —— {客户姓名}, {职位}, {公司}

**关键指标**:
- {指标1}: 提升 {X}%
- {指标2}: 节省 {X}小时/月`,
  },
}

module.exports = { analyzeWritingTips, writingTemplates }
