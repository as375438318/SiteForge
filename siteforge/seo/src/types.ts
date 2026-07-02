/**
 * SiteForge SEO Engine - 类型定义
 */
import { z } from 'zod'

// ========== Zod Schemas ==========

export const SeoMetaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  canonical: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
})

export const PageInfoSchema = z.object({
  url: z.string(),
  title: z.string(),
  type: z.string().optional(),
  html: z.string().optional(),
  seoMeta: SeoMetaSchema.optional(),
  blocks: z.array(z.any()).optional(),
  updatedAt: z.string().optional(),
  priority: z.string().optional(),
  changefreq: z.string().optional(),
  breadcrumbs: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  schemaInjected: z.boolean().optional(),
})

export const SiteInfoSchema = z.object({
  name: z.string(),
  domain: z.string(),
  description: z.string().optional(),
  logo: z.string().optional(),
  ssl: z.boolean().optional(),
  sitemapGenerated: z.boolean().optional(),
  robotsGenerated: z.boolean().optional(),
  allowAiCrawlers: z.boolean().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z.array(z.string()).optional(),
  industry: z.string().optional(),
})

// ========== Types ==========

export type SeoMeta = z.infer<typeof SeoMetaSchema>
export type PageInfo = z.infer<typeof PageInfoSchema>
export type SiteInfo = z.infer<typeof SiteInfoSchema>

export interface ContentInfo {
  type: 'product' | 'case' | 'post'
  title: string
  summary?: string
  slug: string
  coverImage?: string
  status: string
  updatedAt?: string
  fields?: Record<string, unknown>
  meta?: {
    author?: string
    authorTitle?: string
    authorBio?: string
    publishedAt?: string
    updatedAt?: string
  }
}

export type SchemaType =
  | 'Organization'
  | 'Product'
  | 'Article'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'LocalBusiness'
  | 'AboutPage'

export interface SchemaOutput {
  type: string
  jsonLd: Record<string, unknown>
  scriptTag: string
}

export type HealthSeverity = 'error' | 'warning' | 'info'

export interface HealthIssue {
  page: string
  severity: HealthSeverity
  check: string
  message: string
  autoFix: boolean
}

export type HealthLevel = 'excellent' | 'good' | 'fair' | 'poor'

export interface HealthCheckResult {
  score: number
  level: HealthLevel
  totalChecks: number
  passedChecks: number
  issues: HealthIssue[]
  checkedAt: string
}

export interface TdkResult {
  title: string
  description: string
  keywords?: string
}

export interface OgTags {
  'og:title': string
  'og:description': string
  'og:url': string
  'og:type': string
  'og:image'?: string
}

// AI 爬虫白名单（GEO 关键设计）
export const AI_CRAWLER_WHITELIST = [
  { agent: 'GPTBot', platform: 'ChatGPT' },
  { agent: 'OAI-SearchBot', platform: 'ChatGPT Search' },
  { agent: 'ChatGPT-User', platform: 'ChatGPT' },
  { agent: 'ClaudeBot', platform: 'Claude' },
  { agent: 'Claude-SearchBot', platform: 'Claude Search' },
  { agent: 'CCBot', platform: 'Common Crawl' },
  { agent: 'Google-Extended', platform: 'Google AI' },
  { agent: 'PerplexityBot', platform: 'Perplexity' },
  { agent: 'Applebot-Extended', platform: 'Apple Intelligence' },
] as const
