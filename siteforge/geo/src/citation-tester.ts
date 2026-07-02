/**
 * SiteForge GEO 引擎 — AI 引用模拟测试
 *
 * 模拟 AI 搜索引擎的 RAG 流程：检索 → 生成 → 引用判断。
 * - 无 API Key：规则版模拟（基于可引用性评分）
 * - 有 API Key：LLM 版模拟（基于 Prompt 工程）
 */

import { z } from 'zod';
import type {
  CitationTestResult,
  CitationProbability,
  RetrievedContent,
  ParsedContent,
} from './types';
import { scoreCitability } from './citability-scorer';
import type { LLMAdapter } from './llm-adapter';

// ========== Zod Schema ==========

export const ContentSnippetInputSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  text: z.string(),
  meta: z
    .object({
      author: z.string().optional(),
      authorTitle: z.string().optional(),
      authorBio: z.string().optional(),
      publishedAt: z.string().optional(),
      updatedAt: z.string().optional(),
      coverImage: z.string().optional(),
    })
    .optional(),
}).strict();

export type ContentSnippetInput = z.infer<typeof ContentSnippetInputSchema>;

// ========== 关键词提取（BM25 风格简化版） ==========

const STOPWORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人',
  '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去',
  '你', '会', '着', '没有', '看', '好', '自己', '这', '那',
]);

function extractKeywords(text: string): string[] {
  // 去标点空白，按 2-4 字滑窗切片
  const cleaned = text.replace(/[\s\p{P}]/gu, '');
  const words = cleaned.match(/.{2,4}/g) ?? [];
  const filtered = words.filter((w) => {
    if (w.length < 2) return false;
    for (const s of STOPWORDS) {
      if (w.includes(s)) return false;
    }
    return true;
  });
  // 去重保留顺序
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const w of filtered) {
    if (!seen.has(w)) {
      seen.add(w);
      unique.push(w);
    }
    if (unique.length >= 10) break;
  }
  return unique;
}

/**
 * BM25 风格检索（简化版，用 PostgreSQL FTS 的替代）
 *
 * 检索逻辑：
 *   - 对问题提取关键词
 *   - 在每篇内容的 title+summary+text 中匹配
 *   - 标题命中加权 1.5x
 *   - 返回相关性 > 0 的 Top-K
 *
 * @param question 用户问题
 * @param contents 内容库
 * @param topK 返回数量，默认 5
 */
export function retrieveRelevantContents(
  question: string,
  contents: ContentSnippetInput[],
  topK = 5,
): RetrievedContent[] {
  const questionWords = extractKeywords(question);

  const scored: RetrievedContent[] = contents.map((content) => {
    const parsed = ContentSnippetInputSchema.parse(content);
    const fullText = `${parsed.title} ${parsed.summary || ''} ${parsed.text}`.toLowerCase();
    let score = 0;
    for (const word of questionWords) {
      const regex = new RegExp(escapeRegex(word), 'gi');
      const matches = fullText.match(regex);
      score += matches ? matches.length : 0;
    }
    // 标题匹配加权
    if (questionWords.some((w) => parsed.title.toLowerCase().includes(w.toLowerCase()))) {
      score *= 1.5;
    }
    return {
      id: parsed.id,
      title: parsed.title,
      slug: parsed.slug,
      summary: parsed.summary,
      text: parsed.text,
      meta: parsed.meta,
      relevanceScore: score,
    };
  });

  return scored
    .filter((c) => c.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========== 规则版引用模拟 ==========

const DISCLAIMER_RULE =
  '此为基于规则的模拟测试，非真实 AI 搜索结果预测。配置 LLM API Key（千问/DeepSeek/智谱）可获得更精准的 AI 引用模拟。';

const DISCLAIMER_LLM =
  '此为 LLM 模拟测试，非真实 AI 搜索结果预测。实际 AI 搜索结果受各平台算法、训练数据等多种因素影响。';

/**
 * 规则版引用模拟（无 API Key 时使用）
 *
 * 判定逻辑：
 *   - 检索结果为空 → low，不引用
 *   - Top 内容评分 ≥ 80 → high，引用
 *   - 有内容评分 ≥ 60 → medium，可能引用
 *   - 否则 → low，不引用
 */
export function simulateCitationRuleBased(
  question: string,
  retrievedContents: RetrievedContent[],
): CitationTestResult {
  if (retrievedContents.length === 0) {
    return {
      question,
      wouldCite: false,
      citationProbability: 'low',
      simulatedAnswer:
        '（内容库中未找到与问题相关的内容。配置 LLM API Key 可获得更精准的 AI 引用模拟。）',
      citedSnippets: [],
      reason: '未检索到与用户问题相关的内容。建议增加与该问题主题相关的内容。',
      missingInfo: `内容库中缺少关于"${question}"主题的内容。建议创建相关文章或 FAQ。`,
      suggestions: [
        `创建一篇关于"${question}"的文章`,
        '在产品页添加相关 FAQ',
        '确保内容含具体数据和引用来源',
      ],
      retrievedCount: 0,
      disclaimer: DISCLAIMER_RULE,
    };
  }

  // 对检索到的内容做可引用性评分
  const scoredContents: RetrievedContent[] = retrievedContents.map((c) => {
    const content: ParsedContent = {
      title: c.title,
      text: c.text,
      html: c.text,
      meta: c.meta ?? {},
    };
    const score = scoreCitability(content);
    return {
      ...c,
      citabilityScore: score.total,
      citabilityLevel: score.level,
    };
  });

  const topContent = scoredContents[0]!;
  const goodContents = scoredContents.filter((c) => (c.citabilityScore ?? 0) >= 60);

  let wouldCite: boolean;
  let probability: CitationProbability;
  let answer: string;
  let reason: string;

  if (goodContents.length > 0 && (topContent.citabilityScore ?? 0) >= 80) {
    wouldCite = true;
    probability = 'high';
    answer = `基于 ${topContent.title} 的内容，${topContent.summary || topContent.text.substring(0, 200)}...`;
    reason = `检索到 ${scoredContents.length} 篇相关内容，其中 ${goodContents.length} 篇可引用性评分 ≥ 60 分。最高评分内容 "${topContent.title}" 评分 ${topContent.citabilityScore} 分，内容质量高，很可能被 AI 搜索引用。`;
  } else if (goodContents.length > 0) {
    wouldCite = true;
    probability = 'medium';
    answer = `根据 ${topContent.title}，${topContent.summary || topContent.text.substring(0, 150)}...`;
    reason = `检索到 ${scoredContents.length} 篇相关内容，最高评分 ${topContent.citabilityScore} 分。内容可能被引用，但可引用性评分有提升空间。`;
  } else {
    wouldCite = false;
    probability = 'low';
    answer = `（检索到相关内容但可引用性评分较低，配置 API Key 可获得完整模拟回答）`;
    reason = `检索到 ${scoredContents.length} 篇相关内容，但最高评分仅 ${topContent.citabilityScore} 分（< 60）。内容质量不足以被 AI 引用，需要优化。`;
  }

  const citedSnippets = scoredContents
    .filter((c) => (c.citabilityScore ?? 0) >= 60)
    .map((c) => ({
      title: c.title,
      score: c.citabilityScore,
      snippet: (c.summary || c.text).substring(0, 150),
    }));

  const topScore = topContent.citabilityScore ?? 0;

  return {
    question,
    wouldCite,
    citationProbability: probability,
    simulatedAnswer: answer,
    citedSnippets,
    reason,
    missingInfo:
      topScore < 60
        ? `最高评分内容 "${topContent.title}" 的可引用性评分为 ${topScore}，建议：${topScore < 40 ? '补充数据、FAQ、作者信息' : '优化内容结构和引用来源'}`
        : '',
    suggestions: [
      topScore < 60
        ? `优化 "${topContent.title}" 的可引用性评分至 60 分以上`
        : '保持当前内容质量',
      '增加更多与该问题相关的内容',
      '确保内容含具体数据和引用来源',
    ],
    retrievedCount: scoredContents.length,
    retrievedContents: scoredContents.map((c) => ({
      title: c.title,
      score: c.citabilityScore,
      level: c.citabilityLevel,
      relevance: c.relevanceScore,
    })),
    disclaimer: DISCLAIMER_RULE,
  };
}

// ========== LLM 版引用模拟 ==========

/**
 * System Prompt：定义 AI 搜索引擎模拟器角色
 */
export const CITATION_SYSTEM_PROMPT = `你是一个 AI 搜索引擎模拟器。你的任务是模拟 ChatGPT Search / Perplexity 等 AI 搜索引擎的检索增强生成（RAG）流程，判断给定网站内容是否会被引用。

你会收到：
1. 用户的问题
2. 从某企业官网检索到的相关内容片段

你需要：
1. 基于这些内容片段，模拟 AI 搜索引擎生成回答
2. 判断你的回答中是否引用了该网站的内容
3. 给出引用概率评估

请严格按 JSON 格式输出，不要输出其他内容。`;

/**
 * 构造 User Prompt
 */
export function buildCitationUserPrompt(
  question: string,
  retrievedContents: RetrievedContent[],
): string {
  const snippets = retrievedContents
    .slice(0, 5)
    .map((c, i) => {
      const content = (c.summary || c.text || '').substring(0, 500);
      return `---片段${i + 1}---\n标题：${c.title}\n内容：${content}\n---`;
    })
    .join('\n\n');

  return `用户问题：${question}

某企业官网检索到的相关内容片段：

${snippets}

请基于以上信息，模拟 AI 搜索引擎的回答流程，并按以下 JSON 格式输出：

{
  "wouldCite": true/false,
  "citationProbability": "high" | "medium" | "low",
  "simulatedAnswer": "你模拟生成的回答内容",
  "citedSnippets": [{"title": "片段标题", "snippet": "引用内容"}],
  "reason": "判断依据：为什么引用/不引用",
  "missingInfo": "如果未引用或引用概率低，说明内容缺少什么信息",
  "suggestions": ["优化建议1", "优化建议2"]
}`;
}

interface LLMParsedResult {
  wouldCite?: boolean;
  citationProbability?: CitationProbability;
  simulatedAnswer?: string;
  citedSnippets?: Array<{ title?: string; snippet?: string }>;
  reason?: string;
  missingInfo?: string;
  suggestions?: string[];
}

/**
 * LLM 版引用模拟（有 API Key 时使用）
 *
 * 自动降级：
 *   - 未配置 → 规则模式
 *   - 调用失败 → 规则模式 + degraded=true
 */
export async function simulateCitationLLM(
  question: string,
  retrievedContents: RetrievedContent[],
  llmAdapter: LLMAdapter | null,
): Promise<CitationTestResult> {
  if (!llmAdapter || !llmAdapter.isConfigured()) {
    return simulateCitationRuleBased(question, retrievedContents);
  }

  const userPrompt = buildCitationUserPrompt(question, retrievedContents);

  try {
    const result = await llmAdapter.chat(
      [
        { role: 'system', content: CITATION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 1500, retries: 1, timeoutMs: 45_000 },
    );

    // 解析 JSON（容忍前后多余文本）
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM 返回内容中未找到 JSON 对象');
    }
    const parsed = JSON.parse(jsonMatch[0]) as LLMParsedResult;

    const provider = llmAdapter.getProvider();
    const citedSnippets = (parsed.citedSnippets ?? []).map((s) => ({
      title: s.title ?? '',
      snippet: s.snippet ?? '',
    }));

    return {
      question,
      wouldCite: !!parsed.wouldCite,
      citationProbability: parsed.citationProbability ?? 'low',
      simulatedAnswer: parsed.simulatedAnswer ?? '',
      citedSnippets,
      reason: parsed.reason ?? '',
      missingInfo: parsed.missingInfo ?? '',
      suggestions: parsed.suggestions ?? [],
      retrievedCount: retrievedContents.length,
      retrievedContents: retrievedContents.map((c) => ({
        title: c.title,
        relevance: c.relevanceScore,
      })),
      llmProvider: provider?.name,
      llmModel: provider?.model,
      cost: result.usage,
      disclaimer: DISCLAIMER_LLM,
    };
  } catch (err) {
    // 降级到规则模式
    const ruleResult = simulateCitationRuleBased(question, retrievedContents);
    return {
      ...ruleResult,
      degraded: true,
      degradeReason: err instanceof Error ? err.message : String(err),
    };
  }
}
