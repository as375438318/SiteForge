/**
 * SiteForge GEO 引擎 — 类型定义
 *
 * 所有跨模块共享的接口和类型集中在此文件，方便外部导入和类型推导。
 */

// ========== 通用 ==========

/** 评分等级 */
export type ScoreLevel = 'excellent' | 'good' | 'fair' | 'poor';

/** 引用概率 */
export type CitationProbability = 'high' | 'medium' | 'low';

/** 内容类型 */
export type ContentType = 'post' | 'product' | 'case' | 'page' | 'faq';

// ========== 可引用性评分器 ==========

/** 输入：待评分内容（纯文本 + HTML + 元信息） */
export interface ParsedContent {
  /** 内容 ID（可选，用于追踪） */
  id?: string;
  /** 标题 */
  title?: string;
  /** 纯文本（用于事实密度等检测） */
  text: string;
  /** HTML（用于结构化检测），缺省时回退到 text */
  html?: string;
  /** 站点域名（用于过滤站内链接） */
  domain?: string;
  /** 内容类型 */
  type?: ContentType;
  /** 元信息（作者、时间等权威信号） */
  meta?: ContentMeta;
}

/** 内容元信息（权威信号来源） */
export interface ContentMeta {
  author?: string;
  authorTitle?: string;
  authorBio?: string;
  publishedAt?: string;
  updatedAt?: string;
  coverImage?: string;
}

/** 单维度评分细节 */
export interface DimensionScore {
  /** 维度中文名 */
  dimension: string;
  /** 维度英文 key */
  dimensionKey: string;
  /** 得分 */
  score: number;
  /** 满分 */
  maxScore: number;
  /** 等级 */
  level: ScoreLevel;
  /** 检测细节（统计数、命中的元素等） */
  details: Record<string, unknown>;
  /** 优化建议 */
  suggestions: string[];
}

/** 等级展示信息 */
export interface LevelInfo {
  label: string;
  color: string;
  icon: string;
  desc: string;
}

/** 综合评分报告 */
export interface ScoreResult {
  /** 总分 0-100 */
  total: number;
  /** 满分 */
  maxTotal: number;
  /** 综合等级 */
  level: ScoreLevel;
  /** 等级展示信息 */
  levelInfo: LevelInfo;
  /** 各维度评分 */
  dimensions: DimensionScore[];
  /** Top 3 优化建议（来自薄弱维度） */
  topIssues: string[];
  /** 评分时间 ISO8601 */
  scoredAt: string;
}

// ========== llms.txt 生成器 ==========

/** 站点页面（导航/落地页） */
export interface SitePage {
  title: string;
  url: string;
  summary?: string;
  type?: 'home' | 'about' | 'contact' | 'faq' | 'product' | 'case' | 'post' | 'list' | 'custom';
}

/** 站点内容（产品/案例/文章） */
export interface SiteContent {
  id?: string;
  type: ContentType;
  status: 'draft' | 'published' | 'archived';
  title: string;
  slug: string;
  summary?: string;
  text?: string;
  meta?: ContentMeta;
  /** 自定义字段（产品规格、案例客户等） */
  fields?: Record<string, string>;
}

/** llms.txt 生成器输入：站点数据 */
export interface SiteData {
  /** 站点名称 */
  name: string;
  /** 站点域名（不带协议） */
  domain: string;
  /** 站点描述 */
  description?: string;
  /** 关于页面 HTML 或纯文本 */
  about?: string;
  /** 所属行业 */
  industry?: string;
  /** 联系电话 */
  phone?: string;
  /** 联系邮箱 */
  email?: string;
  /** 地址 */
  address?: string;
  /** GEO 专属描述（用于 llms.txt 补充说明） */
  geoDescription?: string;
  /** 站点导航/落地页 */
  pages?: SitePage[];
  /** 站点内容（产品/案例/文章） */
  contents?: SiteContent[];
}

// ========== 写作辅助 ==========

export type WritingTipType = 'suggestion' | 'warning';

/** 写作提示 */
export interface WritingTip {
  /** 提示类型 */
  type: WritingTipType;
  /** 图标 */
  icon: string;
  /** 规则名 */
  rule: string;
  /** 提示文案 */
  message: string;
}

/** 写作检测结果 */
export interface WritingAnalysis {
  /** 全部提示 */
  tips: WritingTip[];
  /** 汇总统计 */
  summary: {
    total: number;
    suggestions: number;
    warnings: number;
  };
}

/** GEO 写作模板 key */
export type WritingTemplateKey = 'faq' | 'product' | 'solution';

/** GEO 写作模板 */
export interface WritingTemplate {
  name: string;
  content: string;
}

/** 写作模板表 */
export type WritingTemplates = Record<WritingTemplateKey, WritingTemplate>;

// ========== LLM 适配层 ==========

export type LLMProviderName = 'qwen' | 'deepseek' | 'zhipu' | 'openai' | 'custom';

/** 单条聊天消息 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** 聊天调用选项 */
export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  /** 超时毫秒数，默认 30s */
  timeoutMs?: number;
  /** 重试次数（针对限频/服务端错误），默认 0 */
  retries?: number;
}

/** Token 用量 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** 聊天调用结果 */
export interface ChatResult {
  content: string;
  usage: TokenUsage;
  /** 耗时毫秒 */
  duration: number;
}

/** LLM 错误类型 */
export type LLMErrorType =
  | 'NOT_CONFIGURED'
  | 'INVALID_KEY'
  | 'RATE_LIMIT'
  | 'INSUFFICIENT_BALANCE'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'PARSE_ERROR';

/** LLM 错误 */
export class LLMError extends Error {
  readonly type: LLMErrorType;
  readonly statusCode?: number;

  constructor(type: LLMErrorType, message: string, statusCode?: number) {
    super(message);
    this.name = 'LLMError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

/** 服务商预置配置 */
export interface ProviderPreset {
  /** 显示名 */
  name: string;
  /** API baseURL */
  baseURL: string;
  /** 默认模型 */
  defaultModel: string;
  /** 可选模型列表 */
  models: string[];
  /** 单价（每百万 token，人民币元；OpenAI 为美元已换算占位） */
  pricePerMillion: {
    input: number;
    output: number;
  };
}

/** 已配置的 provider 运行时实例 */
export interface LLMProvider {
  name: LLMProviderName;
  label: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

/** 连通性测试结果 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

/** 用量统计 */
export interface UsageStats {
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  records: UsageRecord[];
}

/** 单次用量记录 */
export interface UsageRecord {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: string;
}

// ========== AI 引用模拟测试 ==========

/** 检索命中的内容片段（带相关性分数） */
export interface RetrievedContent {
  id?: string;
  title: string;
  slug?: string;
  summary?: string;
  text: string;
  meta?: ContentMeta;
  /** BM25 风格相关性得分 */
  relevanceScore: number;
  /** 可引用性评分（规则版会填充） */
  citabilityScore?: number;
  citabilityLevel?: ScoreLevel;
}

/** 引用片段摘要 */
export interface CitedSnippet {
  title: string;
  score?: number;
  snippet: string;
}

/** 引用模拟测试结果 */
export interface CitationTestResult {
  /** 用户问题 */
  question: string;
  /** 是否会被 AI 引用 */
  wouldCite: boolean;
  /** 引用概率 */
  citationProbability: CitationProbability;
  /** LLM/规则模拟的回答 */
  simulatedAnswer: string;
  /** 引用片段摘要 */
  citedSnippets: CitedSnippet[];
  /** 判断依据 */
  reason: string;
  /** 缺失信息提示 */
  missingInfo: string;
  /** 优化建议 */
  suggestions: string[];
  /** 检索命中的内容数 */
  retrievedCount: number;
  /** 命中内容列表（含分数） */
  retrievedContents?: Array<{
    title: string;
    score?: number;
    level?: ScoreLevel;
    relevance: number;
  }>;
  /** LLM 来源（仅 LLM 模式） */
  llmProvider?: string;
  llmModel?: string;
  /** 调用消耗（仅 LLM 模式） */
  cost?: TokenUsage;
  /** 是否降级到规则模式 */
  degraded?: boolean;
  degradeReason?: string;
  /** 免责声明 */
  disclaimer: string;
}

// ========== 权威信号注入 ==========

/** 权威信号元信息（用于 meta 与 JSON-LD 生成） */
export interface AuthorityMeta {
  title: string;
  author?: string;
  authorTitle?: string;
  authorBio?: string;
  publishedAt?: string;
  updatedAt?: string;
  coverImage?: string;
  /** 站点名 */
  siteName?: string;
  /** 站点 logo URL */
  siteLogo?: string;
  /** 规范化 URL */
  canonicalURL?: string;
  /** 外部引用 URL 列表 */
  citations?: string[];
}

/** 生成的 meta 标签 */
export interface MetaTag {
  name: string;
  content: string;
}

/** 生成的 meta 标签集合 */
export interface MetaTagSet {
  tags: MetaTag[];
  /** 渲染为 HTML 字符串 */
  html: string;
}

/** Article JSON-LD Schema 对象 */
export interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article' | 'Product' | 'FAQPage';
  [key: string]: unknown;
}

/** 生成的 JSON-LD 集合 */
export interface JsonLdSet {
  schemas: ArticleSchema[];
  /** 渲染为 HTML <script type="application/ld+json"> 字符串 */
  html: string;
}
