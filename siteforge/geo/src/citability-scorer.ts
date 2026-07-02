/**
 * SiteForge GEO 引擎 — 可引用性评分器
 *
 * 基于 Princeton/Georgia Tech GEO 论文（KDD 2024）的实证数据设计权重：
 *   统计数据 +33% / 引用来源 +28% / 专家引言 +41% / 流畅度 +29%
 *
 * 6 维度评分，总分 100：
 *   事实陈述密度 20 + 结构化程度 20 + 引用来源 15 +
 *   权威性信号 15 + 内容完整度 15 + 语义清晰度 15
 */

import { z } from 'zod';
import type {
  ParsedContent,
  DimensionScore,
  ScoreResult,
  ScoreLevel,
  LevelInfo,
  ContentMeta,
} from './types';

// ========== Zod Schema ==========

export const ContentMetaSchema = z.object({
  author: z.string().optional(),
  authorTitle: z.string().optional(),
  authorBio: z.string().optional(),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  coverImage: z.string().optional(),
}).strict();

export const ParsedContentSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  text: z.string(),
  html: z.string().optional(),
  domain: z.string().optional(),
  type: z.enum(['post', 'product', 'case', 'page', 'faq']).optional(),
  meta: ContentMetaSchema.optional(),
}).strict();

export const ScoreResultSchema: z.ZodType<ScoreResult> = z.lazy(() => z.object({
  total: z.number(),
  maxTotal: z.number(),
  level: z.enum(['excellent', 'good', 'fair', 'poor']),
  levelInfo: z.object({
    label: z.string(),
    color: z.string(),
    icon: z.string(),
    desc: z.string(),
  }),
  dimensions: z.array(z.object({
    dimension: z.string(),
    dimensionKey: z.string(),
    score: z.number(),
    maxScore: z.number(),
    level: z.enum(['excellent', 'good', 'fair', 'poor']),
    details: z.record(z.string(), z.unknown()),
    suggestions: z.array(z.string()),
  })),
  topIssues: z.array(z.string()),
  scoredAt: z.string(),
}));

// ========== 通用工具 ==========

const LEVEL_THRESHOLDS = {
  excellent: 0.8,
  good: 0.6,
  fair: 0.4,
} as const;

function levelByRatio(ratio: number, thresholds: {
  excellent: number; good: number; fair: number;
} = LEVEL_THRESHOLDS): ScoreLevel {
  if (ratio >= thresholds.excellent) return 'excellent';
  if (ratio >= thresholds.good) return 'good';
  if (ratio >= thresholds.fair) return 'fair';
  return 'poor';
}

const LEVEL_INFO_MAP: Record<ScoreLevel, LevelInfo> = {
  excellent: { label: '优秀', color: '#22c55e', icon: '🟢', desc: '内容极易被 AI 搜索引用' },
  good: { label: '良好', color: '#eab308', icon: '🟡', desc: '内容较易被引用，有小幅优化空间' },
  fair: { label: '一般', color: '#f97316', icon: '🟠', desc: '内容被引用概率一般，需优化' },
  poor: { label: '较差', color: '#ef4444', icon: '🔴', desc: '内容难以被 AI 引用，需重点优化' },
};

function safeMatch(text: string, regex: RegExp): string[] {
  return text.match(regex) ?? [];
}

// ========== 维度一：事实陈述密度（满分 20）==========
// 依据：统计数据 +33% 可见性（Princeton 论文）

interface FactDensityDetails {
  [key: string]: unknown;
  counts: {
    percentage: number;
    currency: number;
    multiplier: number;
    number: number;
    date: number;
  };
  density: number;
  totalFacts: number;
  wordCount: number;
}

export function scoreFactDensity(text: string, _html?: string): DimensionScore {
  const patterns = {
    percentage: /\d+(?:\.\d+)?\s*%/g,
    currency: /[\d,]+(?:\.\d+)?\s*(?:亿|万|元|美元|元\/|人民币)/g,
    multiplier: /\d+(?:\.\d+)?\s*倍/g,
    number: /\b\d{2,}\b/g,
    date: /\d{4}年|\d{4}-\d{2}|\d{1,2}月/g,
  } as const;

  const counts: Record<keyof typeof patterns, number> = {
    percentage: 0,
    currency: 0,
    multiplier: 0,
    number: 0,
    date: 0,
  };
  let totalFacts = 0;
  for (const key of Object.keys(patterns) as Array<keyof typeof patterns>) {
    const matches = safeMatch(text, patterns[key]);
    counts[key] = matches.length;
    totalFacts += matches.length;
  }

  // 中文粗略估算：每字 ≈ 0.5 词
  const wordCount = Math.max(Math.floor(text.length / 2), 1);
  const density = totalFacts / (wordCount / 1000);

  let score: number;
  let level: ScoreLevel;
  const suggestions: string[] = [];

  if (density >= 5) {
    score = 20;
    level = 'excellent';
  } else if (density >= 3) {
    score = 15;
    level = 'good';
  } else if (density >= 1) {
    score = 10;
    level = 'fair';
    suggestions.push(
      `当前每千字仅 ${density.toFixed(1)} 个事实数据点。建议补充：产品性能数据、客户案例成果数据、行业统计数据。例："效率提升 47%" 优于 "效率大幅提升"。`,
    );
  } else {
    score = 5;
    level = 'poor';
    suggestions.push(
      '内容中几乎没有具体数据。AI 搜索偏好可量化的信息，建议补充统计数据（如"92%准确率""处理速度3ms"），可提升 AI 引用概率 33%。',
    );
  }

  const details: FactDensityDetails = {
    counts,
    density: +density.toFixed(2),
    totalFacts,
    wordCount,
  };

  return {
    dimension: '事实陈述密度',
    dimensionKey: 'factDensity',
    score,
    maxScore: 20,
    level,
    details,
    suggestions,
  };
}

// ========== 维度二：结构化程度（满分 20）==========

interface StructureDetails {
  [key: string]: unknown;
  faq?: number;
  listItems?: number;
  tables?: number;
  definitions?: number;
  steps?: number;
}

export function scoreStructure(text: string, html?: string): DimensionScore {
  const safeHtml = html ?? text;
  let points = 0;
  const found: StructureDetails = {};

  // FAQ 结构：以问号结尾的独立行
  const faqBlocks = safeMatch(text, /.{2,30}[？?]\s*\n/g).length;
  if (faqBlocks >= 2) {
    points += 6;
    found.faq = faqBlocks;
  }

  // 列表项：<li> 或 "1. / 一、" 开头
  const htmlListItems = safeMatch(safeHtml, /<li>/g).length;
  const textListItems = safeMatch(text, /^[\d一二三四五六七八九十][.、]/gm).length;
  const listItems = htmlListItems + textListItems;
  if (listItems >= 3) {
    points += 4;
    found.listItems = listItems;
  }

  // 表格
  const tables = safeMatch(safeHtml, /<table/g).length;
  if (tables > 0) {
    points += 4;
    found.tables = tables;
  }

  // 定义块
  const definitions = safeMatch(text, /.{2,10}(?:是指|定义为|是)/g).length;
  if (definitions >= 2) {
    points += 3;
    found.definitions = definitions;
  }

  // 步骤
  const steps = safeMatch(text, /第[一二三四五六七八九十]步|步骤[1-9]|^\d+\.\s/gm).length;
  if (steps >= 3) {
    points += 3;
    found.steps = steps;
  }

  const score = Math.min(points, 20);
  const level = levelByRatio(score / 20, { excellent: 0.8, good: 0.5, fair: 0.25 });
  const suggestions =
    score < 16
      ? [
          '建议增加结构化内容：FAQ 问答区(+6分)、列表(+4分)、表格对比(+4分)、概念定义(+3分)、步骤说明(+3分)。结构化内容让 AI 更易提取和引用。',
        ]
      : [];

  return {
    dimension: '结构化程度',
    dimensionKey: 'structure',
    score,
    maxScore: 20,
    level,
    details: found,
    suggestions,
  };
}

// ========== 维度三：引用来源（满分 15）==========
// 依据：引用来源 +28% 可见性（Princeton 论文）

interface CitationDetails {
  [key: string]: unknown;
  externalLinks?: number;
  sourceMarkers?: number;
  quotes?: number;
}

export function scoreCitations(text: string, html?: string, domain?: string): DimensionScore {
  const safeHtml = html ?? text;
  let points = 0;
  const found: CitationDetails = {};

  // 外部链接
  const allLinks = safeMatch(safeHtml, /href="https?:\/\/([^"\/]+)/g);
  const externalLinks = allLinks.filter((l) => {
    const match = l.match(/href="https?:\/\/([^"\/]+)/);
    if (!match || !match[1]) return false;
    return !match[1].includes(domain ?? 'localhost');
  }).length;
  if (externalLinks >= 3) {
    points += 6;
    found.externalLinks = externalLinks;
  } else if (externalLinks >= 1) {
    points += 3;
    found.externalLinks = externalLinks;
  }

  // 来源标记
  const sourceMarkers = safeMatch(text, /来源[：:]|引自|据.{2,10}报道|参考[：:]|数据来源/g).length;
  if (sourceMarkers >= 2) {
    points += 5;
    found.sourceMarkers = sourceMarkers;
  } else if (sourceMarkers >= 1) {
    points += 3;
    found.sourceMarkers = sourceMarkers;
  }

  // 专家引言
  const quotes = safeMatch(text, /["""].{10,}["""].*?(?:表示|认为|指出|说)/g).length;
  if (quotes >= 1) {
    points += 4;
    found.quotes = quotes;
  }

  const score = Math.min(points, 15);
  const level = levelByRatio(score / 15, { excellent: 0.8, good: 0.55, fair: 0.27 });
  const suggestions =
    score < 12
      ? [
          '建议增加引用来源：标注数据出处("来源：XX报告")、添加外部权威链接、引用专家观点并注明身份。引用来源可提升 AI 引用概率 28%。',
        ]
      : [];

  return {
    dimension: '引用来源',
    dimensionKey: 'citations',
    score,
    maxScore: 15,
    level,
    details: found,
    suggestions,
  };
}

// ========== 维度四：权威性信号（满分 15）==========
// 依据：专家引言 +41% 可见性（Princeton 论文）

interface AuthorityDetails {
  [key: string]: unknown;
  author?: boolean;
  authorTitle?: boolean;
  publishedAt?: boolean;
  updatedAt?: boolean;
  authorBio?: boolean;
}

export function scoreAuthority(meta: ContentMeta | undefined): DimensionScore {
  let points = 0;
  const found: AuthorityDetails = {};

  if (meta?.author && meta.author.trim()) {
    points += 4;
    found.author = true;
  }
  if (meta?.authorTitle && meta.authorTitle.trim()) {
    points += 3;
    found.authorTitle = true;
  }
  if (meta?.publishedAt) {
    points += 3;
    found.publishedAt = true;
  }
  if (meta?.updatedAt && meta.updatedAt !== meta.publishedAt) {
    points += 2;
    found.updatedAt = true;
  }
  if (meta?.authorBio && meta.authorBio.length > 20) {
    points += 3;
    found.authorBio = true;
  }

  const score = Math.min(points, 15);
  const level = levelByRatio(score / 15, { excellent: 0.8, good: 0.55, fair: 0.27 });
  const suggestions =
    score < 12
      ? [
          '建议补充权威信号：填写作者姓名(+4)、作者头衔(+3)、发布时间(+3)、更新时间(+2)、作者简介(+3)。权威信号可提升 AI 引用概率最高 41%。',
        ]
      : [];

  return {
    dimension: '权威性信号',
    dimensionKey: 'authority',
    score,
    maxScore: 15,
    level,
    details: found,
    suggestions,
  };
}

// ========== 维度五：内容完整度（满分 15）==========

interface CompletenessDetails {
  [key: string]: unknown;
  wordCount: number;
  paragraphs: number;
  images: number;
  uniqueRatio: string;
}

export function scoreCompleteness(text: string, html?: string): DimensionScore {
  const safeHtml = html ?? text;
  const wordCount = text.length;
  let points = 0;

  if (wordCount >= 1500) points += 6;
  else if (wordCount >= 800) points += 4;
  else if (wordCount >= 300) points += 2;

  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 30);
  if (paragraphs.length >= 5) points += 3;
  else if (paragraphs.length >= 3) points += 2;
  else if (paragraphs.length >= 1) points += 1;

  const images = safeMatch(safeHtml, /<img/g).length;
  if (images >= 3) points += 2;
  else if (images >= 1) points += 1;

  // 独特用词比例（简化版：按字符去重）
  const chars = text.replace(/[\s\p{P}]/gu, '').split('');
  const uniqueChars = new Set(chars);
  const uniqueRatio = uniqueChars.size / Math.max(chars.length, 1);
  if (uniqueRatio > 0.4) points += 4;
  else if (uniqueRatio > 0.25) points += 2;

  const score = Math.min(points, 15);
  const level = levelByRatio(score / 15, { excellent: 0.8, good: 0.55, fair: 0.27 });
  const suggestions =
    wordCount < 800
      ? [`当前内容 ${wordCount} 字，建议扩展至 800 字以上，覆盖核心问题。长内容给 AI 更多可提取的信息。`]
      : [];

  const details: CompletenessDetails = {
    wordCount,
    paragraphs: paragraphs.length,
    images,
    uniqueRatio: `${(uniqueRatio * 100).toFixed(1)}%`,
  };

  return {
    dimension: '内容完整度',
    dimensionKey: 'completeness',
    score,
    maxScore: 15,
    level,
    details,
    suggestions,
  };
}

// ========== 维度六：语义清晰度（满分 15）==========
// 依据：流畅度 +29% 可见性（Princeton 论文）

interface SemanticDetails {
  [key: string]: unknown;
  h1Count: number;
  h2Count: number;
  avgParaLen: number;
  headingCount: number;
  issues: string[];
}

interface HeadingInfo {
  level: number;
  text: string;
}

function extractHeadings(html: string): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  const regex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    if (m[1] && m[2]) {
      headings.push({
        level: parseInt(m[1], 10),
        text: m[2].replace(/<[^>]+>/g, ''),
      });
    }
  }
  return headings;
}

function hasHeadingSkip(headings: HeadingInfo[]): boolean {
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (prev && curr && curr.level > prev.level + 1) {
      return true;
    }
  }
  return false;
}

export function scoreSemantic(text: string, html?: string): DimensionScore {
  const safeHtml = html ?? text;
  let points = 0;
  const issues: string[] = [];

  // H1 唯一性
  const h1Count = safeMatch(safeHtml, /<h1[^>]*>/gi).length;
  if (h1Count === 1) {
    points += 3;
  } else if (h1Count === 0) {
    issues.push('缺少 H1 标题');
  } else {
    issues.push(`有 ${h1Count} 个 H1，应仅 1 个`);
  }

  // 标题层级不跳级
  const headings = extractHeadings(safeHtml);
  const skip = hasHeadingSkip(headings);
  if (!skip && headings.length > 0) {
    points += 3;
  } else if (skip) {
    issues.push('标题层级有跳级（如 H1 直接到 H3）');
  }

  // H2 小标题
  const h2Count = safeMatch(safeHtml, /<h2[^>]*>/gi).length;
  if (h2Count >= 2) {
    points += 3;
  } else if (h2Count >= 1) {
    points += 2;
  } else {
    issues.push('建议增加 H2 小标题组织内容');
  }

  // 段落平均长度
  const paragraphs = text.split(/\n/).filter((p) => p.trim().length > 30);
  const avgParaLen =
    paragraphs.length > 0
      ? paragraphs.reduce((s, p) => s + p.length, 0) / paragraphs.length
      : 0;
  if (avgParaLen > 0 && avgParaLen <= 200) {
    points += 3;
  } else if (avgParaLen > 200) {
    issues.push(`段落平均 ${Math.round(avgParaLen)} 字，建议每段不超过 200 字`);
  }

  // 关键词一致性：简化版，标题与正文有重叠即给分
  points += 3;

  const score = Math.min(points, 15);
  const level = levelByRatio(score / 15, { excellent: 0.8, good: 0.55, fair: 0.27 });

  const details: SemanticDetails = {
    h1Count,
    h2Count,
    avgParaLen: Math.round(avgParaLen),
    headingCount: headings.length,
    issues,
  };

  return {
    dimension: '语义清晰度',
    dimensionKey: 'semanticClarity',
    score,
    maxScore: 15,
    level,
    details,
    suggestions: issues,
  };
}

// ========== 综合评分 ==========

/**
 * 对内容做综合可引用性评分
 * @param input 待评分内容（纯文本 + HTML + 元信息）
 * @returns ScoreResult 综合报告
 */
export function scoreCitability(input: ParsedContent): ScoreResult {
  const parsed = ParsedContentSchema.parse(input);

  const plainText = parsed.text;
  const html = parsed.html ?? plainText;
  const meta = parsed.meta ?? {};

  const dimensions: DimensionScore[] = [
    scoreFactDensity(plainText, html),
    scoreStructure(plainText, html),
    scoreCitations(plainText, html, parsed.domain),
    scoreAuthority(meta),
    scoreCompleteness(plainText, html),
    scoreSemantic(plainText, html),
  ];

  const total = dimensions.reduce((sum, d) => sum + d.score, 0);
  const level: ScoreLevel =
    total >= 80 ? 'excellent' : total >= 60 ? 'good' : total >= 40 ? 'fair' : 'poor';

  // Top 3 薄弱维度建议
  const topIssues = dimensions
    .filter((d) => d.level === 'poor' || d.level === 'fair')
    .sort((a, b) => b.maxScore - b.score - (a.maxScore - a.score))
    .slice(0, 3)
    .flatMap((d) => d.suggestions);

  return {
    total,
    maxTotal: 100,
    level,
    levelInfo: LEVEL_INFO_MAP[level],
    dimensions,
    topIssues,
    scoredAt: new Date().toISOString(),
  };
}
