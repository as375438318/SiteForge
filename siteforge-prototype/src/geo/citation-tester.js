/**
 * SiteForge - AI 引用模拟测试
 * 模拟 AI 搜索引擎的 RAG 流程：检索 → 生成 → 引用判断
 * 有 API Key 时调用第三方 LLM，无 Key 时用规则模拟
 */

const { scoreCitability } = require('./citability-scorer')

// BM25 风格的关键词检索（简化版，用 PostgreSQL FTS 的替代）
function retrieveRelevantContents(question, contents, topK = 5) {
  const questionWords = extractKeywords(question)
  const scored = contents.map(content => {
    const text = (content.title + ' ' + (content.summary || '') + ' ' + content.text).toLowerCase()
    let score = 0
    for (const word of questionWords) {
      const regex = new RegExp(word, 'gi')
      const matches = text.match(regex) || []
      score += matches.length
    }
    // 标题匹配加权
    if (questionWords.some(w => content.title.toLowerCase().includes(w))) {
      score *= 1.5
    }
    return { ...content, relevanceScore: score }
  })

  return scored
    .filter(c => c.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK)
}

function extractKeywords(text) {
  // 简化版关键词提取：去停用词，取 2-4 字片段
  const stopwords = ['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那']
  const words = text.replace(/[\s\p{P}]/gu, '').match(/.{2,4}/g) || []
  return [...new Set(words.filter(w => !stopwords.some(s => w.includes(s)) && w.length >= 2))].slice(0, 10)
}

// 规则版引用模拟（无 API Key 时）
function simulateCitationRuleBased(question, retrievedContents) {
  if (retrievedContents.length === 0) {
    return {
      wouldCite: false,
      citationProbability: 'low',
      simulatedAnswer: '（内容库中未找到与问题相关的内容。配置 LLM API Key 可获得更精准的 AI 引用模拟。）',
      citedSnippets: [],
      reason: '未检索到与用户问题相关的内容。建议增加与该问题主题相关的内容。',
      missingInfo: `内容库中缺少关于"${question}"主题的内容。建议创建相关文章或 FAQ。`,
      suggestions: [
        `创建一篇关于"${question}"的文章`,
        '在产品页添加相关 FAQ',
        '确保内容含具体数据和引用来源',
      ],
      retrievedCount: 0,
      disclaimer: '此为基于规则的模拟测试，非真实 AI 搜索结果预测。配置 LLM API Key 可获得更精准的模拟。',
    }
  }

  // 对检索到的内容做可引用性评分
  const scoredContents = retrievedContents.map(c => {
    const score = scoreCitability({ text: c.text, html: c.text, meta: c.meta || {} })
    return { ...c, citabilityScore: score.total, citabilityLevel: score.level }
  })

  const topContent = scoredContents[0]
  const goodContents = scoredContents.filter(c => c.citabilityScore >= 60)

  let wouldCite, probability, answer, reason

  if (goodContents.length > 0 && topContent.citabilityScore >= 80) {
    wouldCite = true
    probability = 'high'
    answer = `基于 ${topContent.title} 的内容，${topContent.summary || topContent.text.substring(0, 200)}...`
    reason = `检索到 ${scoredContents.length} 篇相关内容，其中 ${goodContents.length} 篇可引用性评分 ≥ 60 分。最高评分内容 "${topContent.title}" 评分 ${topContent.citabilityScore} 分，内容质量高，很可能被 AI 搜索引用。`
  } else if (goodContents.length > 0) {
    wouldCite = true
    probability = 'medium'
    answer = `根据 ${topContent.title}，${topContent.summary || topContent.text.substring(0, 150)}...`
    reason = `检索到 ${scoredContents.length} 篇相关内容，最高评分 ${topContent.citabilityScore} 分。内容可能被引用，但可引用性评分有提升空间。`
  } else {
    wouldCite = false
    probability = 'low'
    answer = `（检索到相关内容但可引用性评分较低，配置 API Key 可获得完整模拟回答）`
    reason = `检索到 ${scoredContents.length} 篇相关内容，但最高评分仅 ${topContent.citabilityScore} 分（< 60）。内容质量不足以被 AI 引用，需要优化。`
  }

  const citedSnippets = scoredContents
    .filter(c => c.citabilityScore >= 60)
    .map(c => ({ title: c.title, score: c.citabilityScore, snippet: (c.summary || c.text).substring(0, 150) }))

  return {
    wouldCite,
    citationProbability: probability,
    simulatedAnswer: answer,
    citedSnippets,
    reason,
    missingInfo: topContent.citabilityScore < 60
      ? `最高评分内容 "${topContent.title}" 的可引用性评分为 ${topContent.citabilityScore}，建议：${topContent.citabilityScore < 40 ? '补充数据、FAQ、作者信息' : '优化内容结构和引用来源'}`
      : '',
    suggestions: [
      topContent.citabilityScore < 60 ? `优化 "${topContent.title}" 的可引用性评分至 60 分以上` : '保持当前内容质量',
      '增加更多与该问题相关的内容',
      '确保内容含具体数据和引用来源',
    ],
    retrievedCount: scoredContents.length,
    retrievedContents: scoredContents.map(c => ({ title: c.title, score: c.citabilityScore, level: c.citabilityLevel, relevance: c.relevanceScore })),
    disclaimer: '此为基于规则的模拟测试，非真实 AI 搜索结果预测。配置 LLM API Key（千问/DeepSeek/智谱）可获得更精准的 AI 引用模拟。',
  }
}

// LLM 版引用模拟（有 API Key 时）
async function simulateCitationLLM(question, retrievedContents, llmAdapter) {
  if (!llmAdapter || !llmAdapter.isConfigured()) {
    return simulateCitationRuleBased(question, retrievedContents)
  }

  const snippets = retrievedContents.slice(0, 5).map((c, i) => {
    return `---片段${i + 1}---\n标题：${c.title}\n内容：${(c.summary || c.text || '').substring(0, 500)}\n---`
  }).join('\n\n')

  const systemPrompt = `你是一个 AI 搜索引擎模拟器。你的任务是模拟 ChatGPT Search / Perplexity 等 AI 搜索引擎的检索增强生成（RAG）流程，判断给定网站内容是否会被引用。

你会收到：
1. 用户的问题
2. 从某企业官网检索到的相关内容片段

你需要：
1. 基于这些内容片段，模拟 AI 搜索引擎生成回答
2. 判断你的回答中是否引用了该网站的内容
3. 给出引用概率评估

请严格按 JSON 格式输出，不要输出其他内容。`

  const userPrompt = `用户问题：${question}

某企业官网检索到的相关内容片段：

${snippets}

请基于以上信息，模拟 AI 搜索引擎的回答流程，并按以下 JSON 格式输出：

{
  "wouldCite": true/false,
  "citationProbability": "high" | "medium" | "low",
  "simulatedAnswer": "你模拟生成的回答内容",
  "citedSnippets": [1, 2],
  "reason": "判断依据：为什么引用/不引用",
  "missingInfo": "如果未引用或引用概率低，说明内容缺少什么信息",
  "suggestions": ["优化建议1", "优化建议2"]
}`

  try {
    const result = await llmAdapter.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.3, maxTokens: 1500 })

    // 解析 JSON
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        ...parsed,
        retrievedCount: retrievedContents.length,
        retrievedContents: retrievedContents.map((c, i) => ({ title: c.title, relevance: c.relevanceScore })),
        llmProvider: llmAdapter.provider?.name,
        llmModel: llmAdapter.provider?.model,
        cost: result.usage,
        disclaimer: '此为 LLM 模拟测试，非真实 AI 搜索结果预测。实际 AI 搜索结果受各平台算法、训练数据等多种因素影响。',
      }
    }
    throw new Error('LLM 返回格式异常')
  } catch (err) {
    console.error('LLM 引用模拟失败，降级为规则模式:', err.message)
    const ruleResult = simulateCitationRuleBased(question, retrievedContents)
    ruleResult.degraded = true
    ruleResult.degradeReason = err.message
    return ruleResult
  }
}

module.exports = { simulateCitationRuleBased, simulateCitationLLM, retrieveRelevantContents }
