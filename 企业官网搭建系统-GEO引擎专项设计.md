# 企业官网搭建系统 — GEO 引擎专项设计文档

| 字段 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 产品代号 | SiteForge |
| 关联文档 | [PRD v2.0](./企业官网搭建系统-PRD.md)、[技术架构方案](./企业官网搭建系统-技术架构方案.md)、[MVP 任务拆解](./企业官网搭建系统-MVP开发任务拆解.md) |
| 撰写日期 | 2025-07 |
| 撰写人 | 产品通 |
| 覆盖任务 | SF-GEO-01 ~ SF-GEO-06 |

> 本文档把 GEO 引擎细化到"工程师拿到就能写代码"的颗粒度。所有评分规则、生成模板、Prompt 工程均为最终实现依据。

---

## 目录

1. [设计目标与理论基础](#1-设计目标与理论基础)
2. [GEO 引擎总体架构](#2-geo-引擎总体架构)
3. [llms.txt 生成器（SF-GEO-01）](#3-llmstxt-生成器sf-geo-01)
4. [可引用性评分器（SF-GEO-02）](#4-可引用性评分器sf-geo-02)
5. [AI 友好写作辅助（SF-GEO-03）](#5-ai-友好写作辅助sf-geo-03)
6. [权威信号注入与语义化校验（SF-GEO-04）](#6-权威信号注入与语义化校验sf-geo-04)
7. [LLM 适配层（SF-GEO-05）](#7-llm-适配层sf-geo-05)
8. [AI 引用模拟测试（SF-GEO-06）](#8-ai-引用模拟测试sf-geo-06)
9. [降级策略与错误处理](#9-降级策略与错误处理)
10. [数据结构定义](#10-数据结构定义)

---

## 1. 设计目标与理论基础

### 1.1 设计目标

GEO 引擎要回答企业主的一个核心问题：

> **"我的官网内容，能不能被 ChatGPT / Perplexity / 文心一言 / 豆包这些 AI 搜索引用？"**

并且给出可操作的改进方向。

### 1.2 理论基础：AI 搜索如何决定引用谁

AI 搜索引擎（ChatGPT Search、Perplexity、Google AI Overviews 等）基于 **RAG（检索增强生成）** 架构工作，分四步：

```
用户提问 → ① 查询理解 → ② 检索（向量+BM25） → ③ 重排序 → ④ 生成+引用
```

**LLM 在第④步决定引用谁的 5 个关键因素**（来源：Princeton/Georgia Tech GEO 论文，KDD 2024）：

| 因素 | 说明 | 优化策略 |
|------|------|---------|
| 事实密度 | 含具体数据/统计的内容更易被引用 | 统计数据 +33% 可见性 |
| 来源权威度 | 有明确作者身份/机构背书的内容优先 | 专家引言 +41% 可见性 |
| 信息独特性 | 独家数据/原创分析更有引用价值 | 独特用词、原创研究 |
| 内容结构化 | 清晰标题层级/FAQ/表格更易检索提取 | 结构化 Q&A、列表 |
| 语义一致性 | 回答与用户查询的语义匹配度 | 自然语言写作、FAQ |

> **关键发现**：Princeton 论文证实，传统 SEO 的关键词堆砌在 GEO 中反而**降低 8%** 可见性。GEO 的本质是"赢得信任"而非"争排名"。

### 1.3 产品策略

基于上述理论，GEO 引擎的产品策略：

```
结构化内容 → 一致提及 → 权威集群 → 跨平台可引用性
```

**双模式实现**：
- **规则引擎模式**（内置零依赖）：基于 Princeton 论文的 9 大策略，用确定性规则检测内容并评分
- **LLM 增强模式**（用户自配 API）：用大模型做引用模拟测试和智能建议，规则引擎无法替代的"主观判断"部分

---

## 2. GEO 引擎总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         GEO 引擎                                  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              规则引擎层（内置，零依赖，始终可用）             │  │
│  │                                                             │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐│  │
│  │  │ llms.txt   │ │可引用性    │ │写作辅助    │ │权威信号 ││  │
│  │  │ 生成器     │ │评分器      │ │(规则版)    │ │注入器   ││  │
│  │  │ SF-GEO-01  │ │SF-GEO-02   │ │SF-GEO-03   │ │SF-GEO-04││  │
│  │  └────────────┘ └────────────┘ └────────────┘ └─────────┘│  │
│  │  ┌────────────┐                                              │  │
│  │  │语义化校验器│                                              │  │
│  │  │SF-GEO-04   │                                              │  │
│  │  └────────────┘                                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                有 API Key？│                                      │
│                ├─ 否 → 仅规则引擎，基础功能可用                    │
│                └─ 是 ↓                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           LLM 增强层（用户自配第三方 API）                    │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │          LLM 适配器 SF-GEO-05                         │ │  │
│  │  │  千问 / DeepSeek / 智谱 / OpenAI 统一接口             │ │  │
│  │  └──────────────────────┬───────────────────────────────┘ │  │
│  │                         │                                  │  │
│  │  ┌──────────────────────┴───────────────────────────────┐│  │
│  │  │  AI 引用模拟测试 SF-GEO-06                            ││  │
│  │  │  + 智能写作建议 + FAQ 自动生成 + 内容优化草案          ││  │
│  │  └──────────────────────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. llms.txt 生成器（SF-GEO-01）

### 3.1 规范依据

基于 [llms.txt 规范](https://llmld.org/spec/llms-txt-v1)（Jeremy Howard 提出，Stripe/Cloudflare/Anthropic/Vercel/Supabase 等已采用）。

**核心规则**：
- 文件位置：`/llms.txt`（简洁版）+ `/llms-full.txt`（详细版），域名根目录
- 格式：Markdown 风格纯文本，AI 与人类均可读
- `llms.txt` 控制在 2KB 以内，`llms-full.txt` 可扩展

### 3.2 llms.txt 生成模板

**数据来源**：从站点配置（site 表）+ 已发布内容（contents 表）+ 页面（pages 表）自动提取。

```markdown
# {site.name}

> {site.description | 站点一句话简介，从站点设置提取}

## 主要内容

- {产品集合名称}: https://{domain}/products - {产品数量}个产品，{顶级产品标题列举前3个}
- {案例集合名称}: https://{domain}/cases - {案例数量}个成功案例
- 关于我们: https://{domain}/about - {企业简介前100字}
- 联系方式: https://{domain}/contact - {电话} {邮箱}

## 核心资源

{遍历最新5篇已发布文章}
- {文章标题}: https://{domain}/posts/{slug} - {文章摘要前80字}

{如果存在 FAQ 页面}
- 常见问答: https://{domain}/faq - {FAQ 问题数量}个常见问题

## 补充说明

{site.geo_description | 企业核心能力描述，2-3句}
{若配置了 API Key，此段由 LLM 基于全站内容生成；否则用站点描述截取}
```

### 3.3 llms-full.txt 生成模板

```markdown
# {site.name} — 完整内容指南

> {site.description}

## 企业概况

{site.about | 关于页面的完整文本，去除HTML标签}

**成立时间**: {site.founded_year}
**所属行业**: {site.industry}
**联系方式**: {site.phone} | {site.email} | {site.address}

## 产品与服务

{遍历全部已发布产品}
### {product.title}

{product.summary}

{product.fields 中标注为"规格"/"参数"的自定义字段及其值}

[查看详情](https://{domain}/products/{product.slug})

## 成功案例

{遍历全部已发布案例}
### {case.title}

**客户**: {case.customer}
**行业**: {case.industry}
**挑战**: {case.challenge | 前200字}
**方案**: {case.solution | 前200字}
**成果**: {case.result | 前200字}

[查看详情](https://{domain}/cases/{case.slug})

## 专业文章

{遍历全部已发布文章}
### {post.title}

**作者**: {post.author} ({post.author_title})
**发布时间**: {post.published_at}

{post.summary}

[阅读全文](https://{domain}/posts/{post.slug})

## 常见问答

{如果存在 FAQ 区块，遍历问答对}
### {question}

{answer}

## 联系我们

- 电话: {site.phone}
- 邮箱: {site.email}
- 地址: {site.address}
- 网站: https://{domain}
```

### 3.4 生成时机与更新策略

| 触发事件 | 操作 |
|----------|------|
| 站点发布 | 自动重新生成 llms.txt + llms-full.txt |
| 内容增删改 | 标记为"待更新"，下次发布时刷新 |
| 用户手动编辑 | 保存用户版本，标记 `manual_override: true`，后续自动生成不覆盖（除非用户点"重新生成"） |

### 3.5 实现接口

```typescript
// services/llms-txt-generator.service.ts

interface LlmsTxtGenerator {
  /**
   * 生成 llms.txt（简洁版）
   * @param siteId 站点ID
   * @param useLLM 是否用 LLM 生成"补充说明"段落（需 API Key）
   */
  generate(siteId: string, useLLM?: boolean): Promise<string>

  /** 生成 llms-full.txt（详细版） */
  generateFull(siteId: string): Promise<string>

  /** 写入文件到站点输出目录 */
  writeToSite(siteId: string): Promise<void>
}
```

---

## 4. 可引用性评分器（SF-GEO-02）

### 4.1 评分模型

对每篇内容从 6 个维度评分，总分 100。**权重依据 Princeton GEO 论文的实证数据**：

| 维度 | 满分 | 权重依据 | 对应 GEO 策略 |
|------|------|---------|--------------|
| 事实陈述密度 | 20 | 统计数据 +33% 可见性（Princeton） | Statistics Addition |
| 结构化程度 | 20 | 结构化内容在 RAG 重排序中优先 | 内容结构化 |
| 引用来源 | 15 | 引用来源 +28% 可见性（Princeton） | Cite Sources |
| 权威性信号 | 15 | 专家引言 +41% 可见性（Princeton） | Quotation Addition + 权威度 |
| 内容完整度 | 15 | 信息独特性与覆盖度 | 独特用词 + 流畅度 |
| 语义清晰度 | 15 | 流畅度 +29% 可见性（Princeton） | Fluency Optimization |

### 4.2 维度一：事实陈述密度（满分 20）

**检测目标**：内容中是否包含具体的统计数据、数字、百分比、时间节点。AI 搜索偏好可量化的信息。

**检测规则**：

```typescript
function scoreFactDensity(content: ParsedContent): DimensionScore {
  const text = content.plainText
  const patterns = {
    // 数字 + 单位（如 "47%"、"1900亿美元"、"3.5倍"）
    percentage: /\d+(\.\d+)?\s*%/g,
    currency: /[\d,]+(\.\d+)?\s*(亿|万|元|美元|元\/|人民币)/g,
    multiplier: /\d+(\.\d+)?\s*倍/g,
    // 具体数字（年份、数量）
    number: /\b\d{2,}\b/g,
    // 时间节点
    date: /\d{4}年|\d{4}-\d{2}|\d{1,2}月/g,
  }

  const counts = {}
  let totalFacts = 0
  for (const [key, regex] of Object.entries(patterns)) {
    const matches = text.match(regex) || []
    counts[key] = matches.length
    totalFacts += matches.length
  }

  // 评分：按每千字的事实密度
  const wordCount = text.length / 2 // 中文粗略估算
  const density = totalFacts / (wordCount / 1000) // 每千字事实数

  let score: number
  let level: 'excellent' | 'good' | 'fair' | 'poor'
  if (density >= 5) { score = 20; level = 'excellent' }
  else if (density >= 3) { score = 15; level = 'good' }
  else if (density >= 1) { score = 10; level = 'fair' }
  else { score = 5; level = 'poor' }

  return {
    dimension: 'factDensity',
    score,
    level,
    details: { counts, density, totalFacts, wordCount },
    suggestions: density < 3
      ? [`当前每千字仅 ${density.toFixed(1)} 个事实数据点。建议补充：产品性能数据、客户案例成果数据、行业统计数据。例："效率提升 47%"优于"效率大幅提升"。`]
      : []
  }
}
```

**评分标准**：

| 每千字事实数 | 得分 | 等级 |
|-------------|------|------|
| ≥ 5 | 20 | excellent |
| 3-4 | 15 | good |
| 1-2 | 10 | fair |
| 0 | 5 | poor |

---

### 4.3 维度二：结构化程度（满分 20）

**检测目标**：内容是否使用了 AI 易于提取的结构化格式（FAQ、列表、表格、定义块）。

**检测规则**：

```typescript
function scoreStructure(content: ParsedContent): DimensionScore {
  let structurePoints = 0
  const found = {}

  // FAQ 结构（问答对）
  const faqBlocks = detectFAQBlocks(content.html) // 检测 <details> 或 Q&A 模式
  if (faqBlocks > 0) { structurePoints += 6; found.faq = faqBlocks }

  // 列表（ul/ol）
  const listItems = countListItems(content.html)
  if (listItems >= 3) { structurePoints += 4; found.listItems = listItems }

  // 表格
  const tables = countTables(content.html)
  if (tables > 0) { structurePoints += 4; found.tables = tables }

  // 定义/概念块（"XX 是指...""XX 定义为..."）
  const definitions = content.plainText.match(/.{2,10}是指|.{2,10}定义为|.{2,10}是/g) || []
  if (definitions.length >= 2) { structurePoints += 3; found.definitions = definitions.length }

  // 步骤/流程（"第一步""步骤1""1. 2. 3."有序结构）
  const steps = content.plainText.match(/第[一二三四五六七八九十]步|步骤[1-9]|^\d+\.\s/gm) || []
  if (steps.length >= 3) { structurePoints += 3; found.steps = steps.length }

  const score = Math.min(structurePoints, 20)

  return {
    dimension: 'structure',
    score,
    level: score >= 16 ? 'excellent' : score >= 10 ? 'good' : score >= 5 ? 'fair' : 'poor',
    details: found,
    suggestions: score < 16
      ? [`建议增加结构化内容：FAQ 问答区（+6分）、列表（+4分）、表格对比（+4分）、概念定义（+3分）、步骤说明（+3分）。结构化内容让 AI 更易提取和引用。`]
      : []
  }
}
```

**评分标准**：

| 结构元素 | 分值 |
|----------|------|
| FAQ 问答块（≥1 组） | +6 |
| 列表项（≥3 项） | +4 |
| 表格（≥1 个） | +4 |
| 定义/概念块（≥2 处） | +3 |
| 步骤/流程（≥3 步） | +3 |
| **满分上限** | 20 |

---

### 4.4 维度三：引用来源（满分 15）

**检测目标**：内容是否标注了数据来源、外部权威引用。引用来源 +28% 可见性（Princeton）。

**检测规则**：

```typescript
function scoreCitations(content: ParsedContent): DimensionScore {
  let points = 0
  const found = {}

  // 外部链接（排除站内导航链接）
  const externalLinks = content.html.match(/<a[^>]*href="https?:\/\/(?!{domain})[^"]*"/g) || []
  if (externalLinks.length >= 3) { points += 6; found.externalLinks = externalLinks.length }
  else if (externalLinks.length >= 1) { points += 3; found.externalLinks = externalLinks.length }

  // "来源：""引自""据XX报道"等引用标记
  const sourceMarkers = content.plainText.match(/来源[：:]|引自|据.{2,10}报道|参考[：:]|数据来源/g) || []
  if (sourceMarkers.length >= 2) { points += 5; found.sourceMarkers = sourceMarkers.length }
  else if (sourceMarkers.length >= 1) { points += 3; found.sourceMarkers = sourceMarkers.length }

  // 专家引言（引号内引用 + 人物身份标注）
  const quotes = content.plainText.match(/["""].{10,}["""].*?(表示|认为|指出|说|表示)/g) || []
  if (quotes.length >= 1) { points += 4; found.quotes = quotes.length }

  const score = Math.min(points, 15)

  return {
    dimension: 'citations',
    score,
    level: score >= 12 ? 'excellent' : score >= 8 ? 'good' : score >= 4 ? 'fair' : 'poor',
    details: found,
    suggestions: score < 12
      ? [`建议增加引用来源：标注数据出处（"来源：XX报告"）、添加外部权威链接、引用专家观点并注明身份。引用来源可提升 AI 引用概率 28%。`]
      : []
  }
}
```

---

### 4.5 维度四：权威性信号（满分 15）

**检测目标**：内容是否包含作者署名、发布/更新时间、作者身份等权威信号。专家引言 +41% 可见性（Princeton）。

**检测规则**：

```typescript
function scoreAuthority(content: ParsedContent): DimensionScore {
  let points = 0
  const found = {}

  // 作者署名
  if (content.author && content.author.trim()) { points += 4; found.author = true }

  // 作者身份/头衔
  if (content.authorTitle && content.authorTitle.trim()) { points += 3; found.authorTitle = true }

  // 发布时间
  if (content.publishedAt) { points += 3; found.publishedAt = true }

  // 更新时间（且与发布时间不同）
  if (content.updatedAt && content.updatedAt !== content.publishedAt) {
    points += 2; found.updatedAt = true
  }

  // 作者简介（About 页面或 author bio）
  if (content.authorBio && content.authorBio.length > 20) { points += 3; found.authorBio = true }

  const score = Math.min(points, 15)

  return {
    dimension: 'authority',
    score,
    level: score >= 12 ? 'excellent' : score >= 8 ? 'good' : score >= 4 ? 'fair' : 'poor',
    details: found,
    suggestions: score < 12
      ? [`建议补充权威信号：填写作者姓名（+4）、作者头衔/身份（+3，如"高级工程师"）、发布时间（+3）、更新时间（+2）、作者简介（+3）。权威信号可提升 AI 引用概率最高 41%。`]
      : []
  }
}
```

---

### 4.6 维度五：内容完整度（满分 15）

**检测目标**：内容字数、主题覆盖深度、信息独特性。AI 偏好信息充分的原创内容。

**检测规则**：

```typescript
function scoreCompleteness(content: ParsedContent): DimensionScore {
  const text = content.plainText
  const wordCount = text.length

  let points = 0

  // 字数评分
  if (wordCount >= 1500) points += 6
  else if (wordCount >= 800) points += 4
  else if (wordCount >= 300) points += 2
  else points += 0

  // 段落数（信息组织）
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 30)
  if (paragraphs.length >= 5) points += 3
  else if (paragraphs.length >= 3) points += 2
  else if (paragraphs.length >= 1) points += 1

  // 媒体丰富度（图片/视频说明信息完整度）
  const images = countImages(content.html)
  if (images >= 3) points += 2
  else if (images >= 1) points += 1

  // 独特用词比例（去停用词后，非常用词占比）
  const uniqueRatio = calculateUniqueWordRatio(text)
  if (uniqueRatio > 0.4) points += 4
  else if (uniqueRatio > 0.25) points += 2
  else points += 0

  const score = Math.min(points, 15)

  return {
    dimension: 'completeness',
    score,
    level: score >= 12 ? 'excellent' : score >= 8 ? 'good' : score >= 4 ? 'fair' : 'poor',
    details: { wordCount, paragraphs: paragraphs.length, images, uniqueRatio },
    suggestions: wordCount < 800
      ? [`当前内容 ${wordCount} 字，建议扩展至 800 字以上，覆盖核心问题。长内容给 AI 更多可提取的信息。`]
      : []
  }
}
```

---

### 4.7 维度六：语义清晰度（满分 15）

**检测目标**：标题层级、段落结构、关键词一致性。流畅度 +29% 可见性（Princeton）。

**检测规则**：

```typescript
function scoreSemantic(content: ParsedContent): DimensionScore {
  let points = 0
  const issues = []

  // H1 唯一性
  const h1Count = (content.html.match(/<h1[^>]*>/g) || []).length
  if (h1Count === 1) { points += 3 }
  else if (h1Count === 0) { issues.push('缺少 H1 标题') }
  else { issues.push(`有 ${h1Count} 个 H1，应仅 1 个`) }

  // 标题层级不跳级（H1→H2→H3）
  const headings = extractHeadings(content.html) // [{level:1,text:''},{level:2,text:''}...]
  const hasSkip = checkHeadingSkip(headings) // 检测是否跳级
  if (!hasSkip) { points += 3 }
  else { issues.push('标题层级有跳级（如 H1 直接到 H3）') }

  // 有 H2 小标题分段
  const h2Count = (content.html.match(/<h2[^>]*>/g) || []).length
  if (h2Count >= 2) { points += 3 }
  else if (h2Count >= 1) { points += 2 }
  else { issues.push('建议增加 H2 小标题组织内容') }

  // 段落平均长度（过长段落不利阅读和 AI 提取）
  const avgParaLen = calculateAvgParagraphLength(content.plainText)
  if (avgParaLen > 0 && avgParaLen <= 200) { points += 3 }
  else { issues.push(`段落平均 ${Math.round(avgParaLen)} 字，建议每段不超过 200 字`) }

  // 关键词一致性（标题与正文的关键词重叠度）
  const consistency = calculateKeywordConsistency(content.title, content.plainText)
  if (consistency > 0.6) { points += 3 }
  else { issues.push('标题关键词与正文内容一致性较低') }

  const score = Math.min(points, 15)

  return {
    dimension: 'semanticClarity',
    score,
    level: score >= 12 ? 'excellent' : score >= 8 ? 'good' : score >= 4 ? 'fair' : 'poor',
    details: { h1Count, h2Count, avgParaLen, consistency, issues },
    suggestions: issues.length > 0 ? issues : []
  }
}
```

---

### 4.8 综合评分与报告输出

```typescript
function scoreCitability(content: ParsedContent): CitabilityReport {
  const dimensions = [
    scoreFactDensity(content),      // /20
    scoreStructure(content),         // /20
    scoreCitations(content),         // /15
    scoreAuthority(content),         // /15
    scoreCompleteness(content),      // /15
    scoreSemantic(content),          // /15
  ]

  const total = dimensions.reduce((sum, d) => sum + d.score, 0) // /100

  return {
    contentId: content.id,
    total,                      // 0-100
    level: total >= 80 ? 'excellent' : total >= 60 ? 'good' : total >= 40 ? 'fair' : 'poor',
    dimensions,
    topIssues: dimensions
      .filter(d => d.level === 'poor' || d.level === 'fair')
      .sort((a, b) => (maxScore[a.dimension] - a.score) - (maxScore[b.dimension] - b.score))
      .slice(0, 3)
      .flatMap(d => d.suggestions),
    scoredAt: new Date(),
  }
}
```

**评分等级与建议**：

| 总分 | 等级 | 含义 | 产品展示 |
|------|------|------|---------|
| 80-100 | excellent | 内容极易被 AI 引用 | 🟢 绿色 |
| 60-79 | good | 内容较易被引用，有小幅优化空间 | 🟡 黄色 |
| 40-59 | fair | 内容被引用概率一般，需优化 | 🟠 橙色 |
| 0-39 | poor | 内容难以被 AI 引用，需重点优化 | 🔴 红色 |

---

## 5. AI 友好写作辅助（SF-GEO-03）

### 5.1 规则版检测规则（无 API Key 时）

在 TipTap 富文本编辑器中，通过 ProseMirror 插件实时检测内容，触发提示。

| 检测规则 | 触发条件 | 提示文案 | 提示类型 |
|----------|---------|---------|---------|
| 无数据 | 产品/案例描述段落中 0 个数字 | 💡 补充性能数据或成果数据可提升 AI 引用概率。例："效率提升 47%"优于"效率大幅提升" | suggestion |
| 无小标题 | 连续文字 > 300 字且无 H2/H3 | 💡 添加 H2 小标题让 AI 更易提取关键信息 | suggestion |
| 无 FAQ | 内容类型为产品/案例且无 FAQ 区块 | 💡 添加常见问答区块，AI 搜索偏好 Q&A 结构 | suggestion |
| 无引用 | 段落含数据但无来源标注 | 💡 标注数据来源增强权威性。例：添加"来源：XX报告" | suggestion |
| 无作者 | 文章类型内容未填写作者 | 💡 填写作者姓名和身份，权威信号可提升 AI 引用 41% | suggestion |
| 段落过长 | 单段落 > 300 字 | 💡 拆分为更短段落（建议 < 200 字/段），便于 AI 提取 | warning |
| 标题跳级 | H1 后直接出现 H3 | ⚠️ 标题层级不应跳级，保持 H1→H2→H3 | warning |
| 关键词堆砌 | 同一关键词密度 > 5% | ⚠️ 关键词堆砌在 AI 搜索中反而降低可见性，建议自然写作 | warning |

### 5.2 GEO 写作模板

提供 3 个内置模板，用户可一键插入到编辑器：

#### 模板一：行业问答模板（FAQ）

```markdown
## 常见问题

### {行业} {核心问题} 是什么？

{清晰定义，2-3句。例："CRM（客户关系管理）是一种管理企业与客户之间关系的系统..."}

### {产品/服务} 适合什么样的企业？

{目标客户描述 + 具体场景。含数据支撑。}

### {产品/服务} 的核心优势是什么？

{列举 3 个优势，每个含数据对比。}

### 如何选择{品类}？

{选购指南，步骤化或对比表格。}

### {产品/服务} 的价格是多少？

{定价说明，含具体数字区间。}
```

#### 模板二：产品能力模板

```markdown
## {产品名称}

### 产品概述

{一句话定义 + 核心价值。}

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
2. {场景2}: {说明}
```

#### 模板三：解决方案模板

```markdown
## {行业/场景} 解决方案

### 行业挑战

{行业痛点描述，含统计数据。来源：XX报告}

### 我们的方案

{方案概述 + 核心机制。}

### 实施步骤

1. **{步骤1}**: {说明}
2. **{步骤2}**: {说明}
3. **{步骤3}**: {说明}

### 客户成果

> "{客户证言}" —— {客户姓名}, {职位}, {公司}

**关键指标**:
- {指标1}: 提升 {X}%
- {指标2}: 节省 {X}小时/月
```

### 5.3 LLM 增强版（有 API Key 时）

当用户配置了 API Key，写作辅助升级为智能模式：

| 功能 | 规则版 | LLM 增强版 |
|------|--------|-----------|
| 优化建议 | 通用提示（"补充数据"） | 基于具体内容生成改写建议（"建议将'效率很高'改为'处理速度达 3ms，较传统方案提升 47%'"） |
| FAQ 生成 | 无 | 基于内容自动生成 3-5 个潜在问题草案 |
| 内容扩展 | 无 | 建议缺失的信息维度（"建议补充行业数据""建议增加竞品对比"） |

**FAQ 自动生成 Prompt**：

```
你是 GEO 优化专家。以下是一篇企业官网内容，请基于内容生成 3-5 个潜在用户可能提问的问题，
这些问题应该是 AI 搜索引擎用户可能搜索的、与内容主题相关的自然语言问题。
只输出问题，每行一个，不要输出答案。

内容标题：{title}
内容正文：{content}
```

---

## 6. 权威信号注入与语义化校验（SF-GEO-04）

### 6.1 权威信号注入模板

在 SSG 构建时，自动为内容页注入以下信号：

#### HTML Meta 标签

```html
<!-- 作者权威信号 -->
<meta name="author" content="{author}, {authorTitle}">
<meta name="article:author" content="{author}">
<meta name="article:published_time" content="{publishedAt ISO8601}">
<meta name="article:modified_time" content="{updatedAt ISO8601}">

<!-- 引用来源标记（如有外部引用） -->
<meta name="citation_author" content="{引用作者}">
<meta name="citation_title" content="{引用标题}">
<meta name="citation_publication_date" content="{引用日期}">
<meta name="citation_online_date" content="{访问日期}">
```

#### JSON-LD Schema 注入

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{title}",
  "author": {
    "@type": "Person",
    "name": "{author}",
    "jobTitle": "{authorTitle}",
    "description": "{authorBio}"
  },
  "datePublished": "{publishedAt ISO8601}",
  "dateModified": "{updatedAt ISO8601}",
  "image": "{coverImage}",
  "publisher": {
    "@type": "Organization",
    "name": "{siteName}",
    "logo": "{siteLogo}"
  },
  "mainEntityOfPage": "{canonicalURL}",
  "citation": [
    { "@id": "{外部引用URL1}" },
    { "@id": "{外部引用URL2}" }
  ]
}
```

**产品页额外注入**：

```json
{
  "@type": "Product",
  "name": "{productName}",
  "description": "{summary}",
  "brand": { "@type": "Brand", "name": "{siteName}" },
  "image": "{productImage}"
}
```

**FAQ 区块额外注入**：

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{question}",
      "acceptedAnswer": { "@type": "Answer", "text": "{answer}" }
    }
  ]
}
```

### 6.2 语义化校验规则

在 SSG 构建后，对输出 HTML 做校验：

| 校验项 | 规则 | 严重级别 | 处理 |
|--------|------|---------|------|
| H1 唯一 | 每页恰好 1 个 `<h1>` | error | 构建警告 + SEO 体检报告标记 |
| 标题层级 | H1→H2→H3 不跳级 | warning | 体检报告标记 |
| article 标签 | 内容页有 `<article>` 包裹 | warning | 模板保证 |
| section 标签 | 主要内容分区用 `<section>` | info | 模板保证 |
| nav 标签 | 导航用 `<nav>` | warning | 模板保证 |
| alt 文本 | 所有 `<img>` 有 alt 属性 | warning | 体检报告标记 |
| 时间标记 | 文章页有 `<time datetime="">` | warning | 模板注入 |

---

## 7. LLM 适配层（SF-GEO-05）

### 7.1 接口设计

```typescript
// services/llm-adapter.service.ts

interface LLMProvider {
  name: 'qwen' | 'deepseek' | 'zhipu' | 'openai' | 'custom'
  baseURL: string
  apiKey: string
  model: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatResult {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

class LLMAdapter {
  private provider: LLMProvider | null

  /** 检查是否已配置 API Key */
  isConfigured(): boolean

  /** 连通性测试 */
  async testConnection(): Promise<{ success: boolean; message: string }>

  /** 统一聊天接口（兼容 OpenAI 格式） */
  async chat(messages: ChatMessage[], options?: {
    temperature?: number
    maxTokens?: number
  }): Promise<ChatResult>

  /** 记录用量 */
  private logUsage(provider: string, usage: TokenUsage): void
}
```

### 7.2 服务商预置配置

```typescript
const PROVIDER_PRESETS = {
  qwen: {
    name: '阿里千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
    pricePerMillion: { input: 0.004, output: 0.012 }, // 元/千token
  },
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    pricePerMillion: { input: 0.001, output: 0.002 },
  },
  zhipu: {
    name: '智谱 GLM',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    models: ['glm-4', 'glm-4-flash', 'glm-4-air'],
    pricePerMillion: { input: 0.001, output: 0.001 },
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
    pricePerMillion: { input: 0.15, output: 0.6 }, // 美元
  },
}
```

### 7.3 用量统计

```typescript
interface UsageRecord {
  id: string
  siteId: string
  provider: string
  model: string
  feature: 'citation_test' | 'writing_suggestion' | 'faq_generation' | 'content_optimize'
  promptTokens: number
  completionTokens: number
  estimatedCost: number  // 按服务商定价计算，人民币
  createdAt: Date
}

// 后台用量统计看板
// - 按日/周/月统计调用次数与费用
// - 按功能维度统计（引用测试/写作建议/FAQ生成）
// - 费用预警：当月费用超阈值时提示
```

### 7.4 降级策略

```
API 调用流程:
  │
  ├─ 检查 isConfigured()
  │    └─ false → 走规则引擎模式，返回降级结果 + 提示"配置 API Key 解锁"
  │
  ├─ 调用 LLM API
  │    ├─ 成功 → 返回结果 + 记录用量
  │    │
  │    ├─ 401 (Key 无效) → 提示"API Key 无效，请检查" + 降级
  │    ├─ 429 (限频) → 指数退避重试 3 次 → 仍失败则降级
  │    ├─ 402 (余额不足) → 提示"API 余额不足，请充值" + 降级
  │    └─ 500/超时 → 重试 2 次 → 降级 + 提示"服务暂时不可用"
  │
  └─ 降级结果 = 规则引擎的输出 + 错误提示
```

---

## 8. AI 引用模拟测试（SF-GEO-06）

### 8.1 工作原理

模拟 AI 搜索引擎的 RAG 流程：检索 → 生成 → 引用判断。

```
用户输入问题
  │
  ├─ ① BM25 检索本站全部已发布内容，召回 Top-5 相关片段（PostgreSQL FTS，零成本）
  │
  ├─ ② 组装 Prompt，发给 LLM API
  │
  ├─ ③ LLM 返回：模拟回答 + 是否引用了本站内容 + 引用片段
  │
  ├─ ④ 解析 LLM 返回，判断引用概率
  │
  └─ ⑤ 输出报告
```

### 8.2 BM25 检索实现

```typescript
async function retrieveRelevantContent(
  siteId: string,
  question: string,
  topK = 5
): Promise<ContentSnippet[]> {
  // 使用 PostgreSQL 全文检索
  const snippets = await prisma.$queryRaw`
    SELECT
      id, title, slug,
      ts_headline('simple', content_text, plainto_tsquery('simple', ${question}),
        'MaxWords=100, MinWords=20') as snippet,
      ts_rank_cd(content_tsv, plainto_tsquery('simple', ${question})) as rank
    FROM contents
    WHERE site_id = ${siteId}
      AND status = 'published'
      AND content_tsv @@ plainto_tsquery('simple', ${question})
    ORDER BY rank DESC
    LIMIT ${topK}
  `
  return snippets
}
```

> **无 API Key 时的降级**：仅返回 BM25 检索结果 + 规则判断（"检索到 N 篇相关内容，配置 API Key 可模拟 AI 是否引用"）。

### 8.3 Prompt 工程

#### System Prompt

```
你是一个 AI 搜索引擎模拟器。你的任务是模拟 ChatGPT Search / Perplexity 等 AI 搜索引擎的
检索增强生成（RAG）流程，判断给定网站内容是否会被引用。

你会收到：
1. 用户的问题
2. 从某企业官网检索到的相关内容片段

你需要：
1. 基于这些内容片段，模拟 AI 搜索引擎生成回答
2. 判断你的回答中是否引用了该网站的内容
3. 给出引用概率评估

请严格按 JSON 格式输出，不要输出其他内容。
```

#### User Prompt 模板

```
用户问题：{question}

某企业官网（{siteName}）检索到的相关内容片段：

---片段1---
标题：{title1}
内容：{snippet1}
---

---片段2---
标题：{title2}
内容：{snippet2}
---

（...最多5个片段...）

请基于以上信息，模拟 AI 搜索引擎的回答流程，并按以下 JSON 格式输出：

{
  "wouldCite": true/false,
  "citationProbability": "high" | "medium" | "low",
  "simulatedAnswer": "你模拟生成的回答内容",
  "citedSnippets": [1, 2],
  "citedContent": "你引用的具体内容原文",
  "reason": "判断依据：为什么引用/不引用",
  "missingInfo": "如果未引用或引用概率低，说明内容缺少什么信息",
  "suggestions": ["优化建议1", "优化建议2"]
}
```

#### 输出解析

```typescript
interface CitationTestResult {
  question: string
  wouldCite: boolean
  citationProbability: 'high' | 'medium' | 'low'
  simulatedAnswer: string          // LLM 模拟的回答
  citedSnippets: number[]          // 引用了哪些片段（索引）
  citedContent: string             // 引用的具体内容
  reason: string                   // 引用/不引用的原因
  missingInfo: string              // 缺失的信息
  suggestions: string[]            // 优化建议
  retrievedSnippets: ContentSnippet[] // 检索到的全部片段
  cost: { tokens: number, fee: number } // 本次消耗
  disclaimer: string               // 免责声明
}
```

### 8.4 引用概率判定逻辑

| LLM 返回 `wouldCite` | `citationProbability` | 展示 | 含义 |
|---------------------|----------------------|------|------|
| true | high | 🟢 很可能被引用 | LLM 引用了本站内容并生成完整回答 |
| true | medium | 🟡 可能被引用 | LLM 部分引用，但指出信息不足 |
| false | low | 🔴 不太可能被引用 | LLM 表示内容与问题不相关或信息不足 |

### 8.5 对比测试

支持"优化前 vs 优化后"对比：

```
1. 用户对内容做优化前测试 → 记录结果 A
2. 用户根据建议修改内容并重新发布
3. 对修改后内容做测试 → 记录结果 B
4. 展示 A vs B 对比：引用概率变化、评分变化、新增/减少的引用片段
```

### 8.6 免责声明（强制显示）

> ⚠️ 此为模拟测试，基于 RAG 流程的近似判断，**非真实 AI 搜索引擎的预测结果**。实际 AI 搜索（ChatGPT、Perplexity、文心一言等）的引用行为受各平台算法、训练数据、实时索引等多种因素影响。本测试仅用于辅助评估内容的可引用性，不保证实际效果。

---

## 9. 降级策略与错误处理

### 9.1 功能降级矩阵

| 功能 | 无 API Key | API 正常 | API 异常 |
|------|-----------|---------|---------|
| llms.txt 生成 | ✅ 规则生成（补充说明用站点描述截取） | ✅ LLM 生成补充说明 | ✅ 规则生成 |
| 可引用性评分 | ✅ 全功能（纯规则） | ✅ 全功能（可选 LLM 增强部分维度） | ✅ 全功能 |
| 写作辅助 | ✅ 规则提示 | ✅ 智能建议 + FAQ 生成 | ✅ 规则提示 |
| 权威信号注入 | ✅ 全功能（纯模板） | ✅ 全功能 | ✅ 全功能 |
| AI 引用模拟测试 | ⚠️ 仅返回检索结果 | ✅ 完整模拟 | ⚠️ 降级为检索结果 + 提示 |

### 9.2 错误处理

```typescript
// 统一错误处理
class LLMError extends Error {
  constructor(
    public type: 'NOT_CONFIGURED' | 'INVALID_KEY' | 'RATE_LIMIT' | 'INSUFFICIENT_BALANCE' | 'TIMEOUT' | 'SERVER_ERROR',
    message: string,
  ) { super(message) }
}

// 错误对应的用户提示
const ERROR_MESSAGES: Record<string, string> = {
  NOT_CONFIGURED: '尚未配置 LLM API Key，当前使用规则引擎模式。配置 Key 后可解锁 AI 智能分析。',
  INVALID_KEY: 'API Key 无效，请检查配置。当前已降级为规则引擎模式。',
  RATE_LIMIT: 'API 调用频率过高，请稍后重试。当前已降级为规则引擎模式。',
  INSUFFICIENT_BALANCE: 'API 余额不足，请充值后使用。当前已降级为规则引擎模式。',
  TIMEOUT: 'AI 分析请求超时，请稍后重试。当前已降级为规则引擎模式。',
  SERVER_ERROR: 'AI 服务暂时不可用，请稍后重试。当前已降级为规则引擎模式。',
}
```

---

## 10. 数据结构定义

### 10.1 geo_scores 表

```typescript
interface GeoScore {
  id: string
  contentId: string          // 关联 contents 表
  siteId: string
  total: number               // 0-100
  level: 'excellent' | 'good' | 'fair' | 'poor'
  dimensions: {
    factDensity: DimensionScore
    structure: DimensionScore
    citations: DimensionScore
    authority: DimensionScore
    completeness: DimensionScore
    semanticClarity: DimensionScore
  }
  topIssues: string[]         // Top 3 优化建议
  scoredAt: Date
}
```

### 10.2 geo_test_results 表（AI 引用模拟测试记录）

```typescript
interface GeoTestResult {
  id: string
  siteId: string
  question: string
  wouldCite: boolean
  citationProbability: 'high' | 'medium' | 'low'
  simulatedAnswer: string
  citedSnippets: number[]
  citedContent: string
  reason: string
  missingInfo: string
  suggestions: string[]
  retrievedSnippetIds: string[]
  llmProvider: string
  llmModel: string
  cost: { tokens: number, fee: number }
  createdAt: Date
}
```

### 10.3 llm_usage 表（用量统计）

```typescript
interface LLMUsage {
  id: string
  siteId: string
  provider: string
  model: string
  feature: 'citation_test' | 'writing_suggestion' | 'faq_generation' | 'content_optimize' | 'llms_txt_enhance'
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost: number      // 人民币
  status: 'success' | 'failed' | 'degraded'
  createdAt: Date
}
```

### 10.4 llm_config 表（API 配置）

```typescript
interface LLMConfig {
  id: string
  siteId: string
  provider: 'qwen' | 'deepseek' | 'zhipu' | 'openai' | 'custom'
  baseURL: string
  apiKey: string              // 加密存储
  model: string
  enabled: boolean
  monthlyBudgetAlert: number  // 月费用预警阈值（元）
  createdAt: Date
  updatedAt: Date
}
```

---

## 附录：GEO 优化 Checklist（面向用户的最终展示）

在后台 GEO 面板展示，让用户一目了然：

### 内容层面

- [ ] 每篇内容含具体统计数据（每千字 ≥ 3 个数据点）
- [ ] 关键页面有 FAQ 问答区块
- [ ] 数据标注了来源（"来源：XX报告"）
- [ ] 文章有作者署名 + 身份 + 发布时间
- [ ] 内容 ≥ 800 字，信息充分
- [ ] 有 H2 小标题分段
- [ ] 无关键词堆砌

### 技术层面

- [ ] 已生成 llms.txt + llms-full.txt
- [ ] robots.txt 放行 AI 爬虫（GPTBot/ClaudeBot/PerplexityBot 等）
- [ ] 内容页有 Schema.org 结构化数据
- [ ] HTML 语义化标签正确使用
- [ ] 全站可引用性评分均 ≥ 60

### 验证层面

- [ ] AI 引用模拟测试通过（需配置 API Key）
- [ ] 对比测试显示优化后引用概率提升

---

*本文档为 v1.0，需与工程团队评审后定稿。评审重点：评分规则的检测准确性、Prompt 工程的输出稳定性、BM25 检索的中文效果。*
