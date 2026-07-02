/**
 * SiteForge GEO 引擎 — 权威信号注入
 *
 * 在 SSG 构建时为内容页注入：
 *   - HTML Meta 标签（author/article:published_time/article:modified_time 等）
 *   - JSON-LD Schema（Article / Product / FAQPage）
 *
 * 依据：专家引言 +41% 可见性（Princeton GEO 论文 KDD 2024）
 */

import { z } from 'zod';
import type { AuthorityMeta, MetaTag, MetaTagSet, ArticleSchema, JsonLdSet } from './types';

// ========== Zod Schema ==========

export const AuthorityMetaSchema = z.object({
  title: z.string(),
  author: z.string().optional(),
  authorTitle: z.string().optional(),
  authorBio: z.string().optional(),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  coverImage: z.string().optional(),
  siteName: z.string().optional(),
  siteLogo: z.string().optional(),
  canonicalURL: z.string().optional(),
  citations: z.array(z.string()).optional(),
}).strict();

// ========== Meta 标签生成 ==========

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 生成权威信号 meta 标签集合
 *
 * 包含：
 *   - author（作者 + 头衔）
 *   - article:author
 *   - article:published_time
 *   - article:modified_time
 *   - citation_* 系列（如有外部引用）
 */
export function generateMetaTags(meta: AuthorityMeta): MetaTagSet {
  const parsed = AuthorityMetaSchema.parse(meta);
  const tags: MetaTag[] = [];

  // 作者权威信号
  if (parsed.author) {
    const authorWithTitle = parsed.authorTitle
      ? `${parsed.author}, ${parsed.authorTitle}`
      : parsed.author;
    tags.push({ name: 'author', content: authorWithTitle });
    tags.push({ name: 'article:author', content: parsed.author });
  }

  // 发布时间
  if (parsed.publishedAt) {
    tags.push({ name: 'article:published_time', content: parsed.publishedAt });
  }

  // 更新时间
  if (parsed.updatedAt) {
    tags.push({ name: 'article:modified_time', content: parsed.updatedAt });
  }

  // 外部引用标记（citation_* 系列）
  if (parsed.citations && parsed.citations.length > 0) {
    tags.push({ name: 'citation_title', content: parsed.title });
    if (parsed.publishedAt) {
      tags.push({ name: 'citation_publication_date', content: parsed.publishedAt });
    }
    tags.push({
      name: 'citation_online_date',
      content: parsed.updatedAt || parsed.publishedAt || new Date().toISOString(),
    });
  }

  const html = tags
    .map((t) => `<meta name="${escapeHtmlAttribute(t.name)}" content="${escapeHtmlAttribute(t.content)}" />`)
    .join('\n');

  return { tags, html };
}

// ========== Article JSON-LD Schema 生成 ==========

/**
 * 生成 Article JSON-LD Schema
 *
 * 依据 schema.org/Article 规范，注入：
 *   - headline（标题）
 *   - author（Person，含 jobTitle、description）
 *   - datePublished / dateModified
 *   - image
 *   - publisher（Organization，含 logo）
 *   - mainEntityOfPage（规范化 URL）
 *   - citation（外部引用 URL 列表）
 */
export function generateArticleSchema(meta: AuthorityMeta): ArticleSchema {
  const parsed = AuthorityMetaSchema.parse(meta);

  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: parsed.title,
  };

  // 作者
  if (parsed.author) {
    const author: Record<string, unknown> = {
      '@type': 'Person',
      name: parsed.author,
    };
    if (parsed.authorTitle) author.jobTitle = parsed.authorTitle;
    if (parsed.authorBio) author.description = parsed.authorBio;
    schema.author = author;
  }

  // 时间
  if (parsed.publishedAt) schema.datePublished = parsed.publishedAt;
  if (parsed.updatedAt) schema.dateModified = parsed.updatedAt;

  // 封面图
  if (parsed.coverImage) schema.image = parsed.coverImage;

  // 发布者
  if (parsed.siteName) {
    const publisher: Record<string, unknown> = {
      '@type': 'Organization',
      name: parsed.siteName,
    };
    if (parsed.siteLogo) {
      publisher.logo = {
        '@type': 'ImageObject',
        url: parsed.siteLogo,
      };
    }
    schema.publisher = publisher;
  }

  // 规范化 URL
  if (parsed.canonicalURL) {
    schema.mainEntityOfPage = {
      '@type': 'WebPage',
      '@id': parsed.canonicalURL,
    };
  }

  // 外部引用
  if (parsed.citations && parsed.citations.length > 0) {
    schema.citation = parsed.citations.map((url) => ({ '@id': url }));
  }

  return schema;
}

/**
 * 生成 Product JSON-LD Schema
 *
 * 用于产品页，依据 schema.org/Product 规范。
 */
export function generateProductSchema(input: {
  name: string;
  description?: string;
  siteName?: string;
  image?: string;
}): ArticleSchema {
  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
  };
  if (input.description) schema.description = input.description;
  if (input.image) schema.image = input.image;
  if (input.siteName) {
    schema.brand = { '@type': 'Brand', name: input.siteName };
  }
  return schema;
}

/**
 * 生成 FAQPage JSON-LD Schema
 *
 * 用于 FAQ 区块，依据 schema.org/FAQPage 规范。
 */
export function generateFaqSchema(
  faqs: Array<{ question: string; answer: string }>,
): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

// ========== JSON-LD 集合生成 ==========

/**
 * 将多个 Schema 渲染为 HTML <script type="application/ld+json"> 字符串
 */
export function renderJsonLd(schemas: ArticleSchema[]): JsonLdSet {
  const html = schemas
    .map((s) => {
      const json = JSON.stringify(s);
      return `<script type="application/ld+json">\n${json}\n</script>`;
    })
    .join('\n');
  return { schemas, html };
}

/**
 * 一站式：从 AuthorityMeta 生成完整 JSON-LD 集合（Article + 可选 Product/FAQ）
 */
export function generateJsonLdSet(input: {
  meta: AuthorityMeta;
  product?: { name: string; description?: string; image?: string };
  faqs?: Array<{ question: string; answer: string }>;
  siteName?: string;
}): JsonLdSet {
  const schemas: ArticleSchema[] = [generateArticleSchema(input.meta)];

  if (input.product) {
    schemas.push(
      generateProductSchema({
        name: input.product.name,
        description: input.product.description,
        image: input.product.image,
        siteName: input.siteName,
      }),
    );
  }

  if (input.faqs && input.faqs.length > 0) {
    schemas.push(generateFaqSchema(input.faqs));
  }

  return renderJsonLd(schemas);
}
