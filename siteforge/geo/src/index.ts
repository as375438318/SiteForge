/**
 * SiteForge GEO 引擎 — 统一导出
 *
 * 面向 AI 搜索引擎（ChatGPT/Perplexity/文心一言/豆包）的生成式引擎优化模块。
 * 可被 NestJS 后端或其他 Node.js 项目导入。
 *
 * 模块清单：
 *   - citability-scorer：6 维度可引用性评分器
 *   - llms-txt-generator：llms.txt / llms-full.txt 生成器
 *   - writing-assistant：AI 友好写作辅助
 *   - llm-adapter：LLM 适配层（千问/DeepSeek/智谱/OpenAI）
 *   - citation-tester：AI 引用模拟测试
 *   - authority-signals：权威信号注入
 *   - types：所有接口和类型定义
 */

// 类型定义
export * from './types';

// 可引用性评分器
export {
  scoreCitability,
  scoreFactDensity,
  scoreStructure,
  scoreCitations,
  scoreAuthority,
  scoreCompleteness,
  scoreSemantic,
  ParsedContentSchema,
  ContentMetaSchema,
  ScoreResultSchema,
} from './citability-scorer';

// llms.txt 生成器
export {
  generateLlmsTxt,
  generateLlmsFullTxt,
  SiteDataSchema,
  SitePageSchema,
  SiteContentSchema,
} from './llms-txt-generator';

// 写作辅助
export {
  analyzeWritingTips,
  writingTemplates,
  WritingInputSchema,
} from './writing-assistant';
export type { WritingInput } from './writing-assistant';

// LLM 适配层
export {
  LLMAdapter,
  PROVIDER_PRESETS,
  ERROR_MESSAGES,
  ChatMessageSchema,
  ChatOptionsSchema,
} from './llm-adapter';

// AI 引用模拟测试
export {
  retrieveRelevantContents,
  simulateCitationRuleBased,
  simulateCitationLLM,
  CITATION_SYSTEM_PROMPT,
  buildCitationUserPrompt,
  ContentSnippetInputSchema,
} from './citation-tester';
export type { ContentSnippetInput } from './citation-tester';

// 权威信号注入
export {
  generateMetaTags,
  generateArticleSchema,
  generateProductSchema,
  generateFaqSchema,
  renderJsonLd,
  generateJsonLdSet,
  AuthorityMetaSchema,
} from './authority-signals';
