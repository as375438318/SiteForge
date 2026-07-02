/**
 * SiteForge - Astro Content Collections 配置
 *
 * 与架构方案 4.2 节对应：
 *   CMS 内容类型 → Astro Collection → 路由
 *   产品   → products → /products/<slug>
 *   案例   → cases    → /cases/<slug>
 *   文章   → posts     → /posts/<slug>
 *   页面   → pages     → /<slug>
 *
 * 内容来源：编辑器保存到本地 Markdown 文件（src/content/<collection>/）
 */

import { defineCollection, z } from 'astro:content'

// 公共 frontmatter 字段
const baseFields = {
  title: z.string(),
  summary: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  tags: z.array(z.string()).default([]),
}

// products 集合
const productsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFields,
    price: z.string().optional(),
    category: z.string().optional(),
    specifications: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .optional(),
    gallery: z.array(z.string()).optional(),
  }),
})

// cases 集合
const casesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFields,
    industry: z.string().optional(),
    client: z.string().optional(),
    metrics: z.string().optional(),
    challenge: z.string().optional(),
    solution: z.string().optional(),
    results: z.string().optional(),
  }),
})

// posts 集合
const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFields,
    author: z.string().optional(),
    authorTitle: z.string().optional(),
    category: z.string().optional(),
  }),
})

// pages 集合（页面 = 区块序列）
const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFields,
    // 页面由区块序列构成，blocks 字段保存区块 JSON 配置
    blocks: z
      .array(
        z.object({
          id: z.string(),
          type: z.string(),
          props: z.record(z.unknown()).default({}),
          sortOrder: z.number().default(0),
        }),
      )
      .default([]),
    // SEO 元信息
    seoMeta: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        canonical: z.string().optional(),
        ogImage: z.string().optional(),
        noindex: z.boolean().optional(),
      })
      .optional(),
    // sitemap 配置
    changefreq: z
      .enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])
      .optional()
      .default('weekly'),
    priority: z.number().min(0).max(1).optional().default(0.8),
  }),
})

export const collections = {
  products: productsCollection,
  cases: casesCollection,
  posts: postsCollection,
  pages: pagesCollection,
}
