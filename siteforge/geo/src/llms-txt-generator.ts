/**
 * SiteForge GEO 引擎 — llms.txt 生成器
 *
 * 基于 llms.txt 规范（Jeremy Howard, llmld.org）：
 *   - `/llms.txt`：简洁版，控制在 2KB 以内
 *   - `/llms-full.txt`：详细版，可扩展
 *
 * 数据来源：站点配置（SiteData）+ 已发布内容 + 页面
 */

import { z } from 'zod';
import type { SiteData, SitePage, SiteContent } from './types';

// ========== Zod Schema ==========

export const SitePageSchema = z.object({
  title: z.string(),
  url: z.string(),
  summary: z.string().optional(),
  type: z
    .enum(['home', 'about', 'contact', 'faq', 'product', 'case', 'post', 'list', 'custom'])
    .optional(),
}).strict();

export const SiteContentSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['post', 'product', 'case', 'page', 'faq']),
  status: z.enum(['draft', 'published', 'archived']),
  title: z.string(),
  slug: z.string(),
  summary: z.string().optional(),
  text: z.string().optional(),
  meta: z.object({
    author: z.string().optional(),
    authorTitle: z.string().optional(),
    authorBio: z.string().optional(),
    publishedAt: z.string().optional(),
    updatedAt: z.string().optional(),
    coverImage: z.string().optional(),
  }).optional(),
  fields: z.record(z.string(), z.string()).optional(),
}).strict();

export const SiteDataSchema = z.object({
  name: z.string(),
  domain: z.string(),
  description: z.string().optional(),
  about: z.string().optional(),
  industry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  geoDescription: z.string().optional(),
  pages: z.array(SitePageSchema).optional(),
  contents: z.array(SiteContentSchema).optional(),
}).strict();

// ========== 工具 ==========

/** 简洁版硬上限 2KB（按规范） */
const LLMS_TXT_MAX_BYTES = 2048;

function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '');
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.substring(0, max)}...` : text;
}

function publishedContents(site: SiteData, type: 'post' | 'product' | 'case'): SiteContent[] {
  return (site.contents ?? []).filter((c) => c.type === type && c.status === 'published');
}

function findFaqPages(pages: SitePage[] | undefined): SitePage[] {
  return (pages ?? []).filter((p) => p.type === 'faq');
}

function absoluteUrl(domain: string, path: string): string {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `https://${domain}${safePath}`;
}

// ========== 简洁版 llms.txt ==========

/**
 * 生成 llms.txt（简洁版，≤2KB）
 *
 * 结构遵循 Jeremy Howard 规范：
 *   # 站点标题
 *   > 站点简介
 *   ## 主要内容
 *   - 标题: URL - 摘要
 *   ## 核心资源
 *   - 文章标题: URL - 摘要
 *   ## 补充说明
 *   企业核心能力描述
 */
export function generateLlmsTxt(site: SiteData): string {
  const parsed = SiteDataSchema.parse(site);
  const lines: string[] = [];

  // 标题
  lines.push(`# ${parsed.name}`);
  lines.push('');

  // 简介
  lines.push(`> ${parsed.description || '企业官方网站'}`);
  lines.push('');

  // 主要内容（页面）
  lines.push('## 主要内容');
  lines.push('');

  const pages = parsed.pages ?? [];
  for (const page of pages) {
    lines.push(
      `- ${page.title}: ${absoluteUrl(parsed.domain, page.url)} - ${page.summary || ''}`.trim(),
    );
  }

  // 核心资源（最新 5 篇已发布文章）
  const posts = publishedContents(parsed, 'post').slice(0, 5);
  if (posts.length > 0) {
    lines.push('');
    lines.push('## 核心资源');
    lines.push('');
    for (const post of posts) {
      const summary = truncate(post.summary || '', 80);
      lines.push(
        `- ${post.title}: ${absoluteUrl(parsed.domain, `/posts/${post.slug}`)} - ${summary}`.trim(),
      );
    }
  }

  // FAQ 入口
  const faqPages = findFaqPages(pages);
  if (faqPages.length > 0) {
    if (!lines.some((l) => l === '## 核心资源')) {
      lines.push('');
      lines.push('## 核心资源');
      lines.push('');
    }
    lines.push(
      `- 常见问答: ${absoluteUrl(parsed.domain, '/faq')} - 常见问题解答`,
    );
  }

  // 补充说明
  lines.push('');
  lines.push('## 补充说明');
  lines.push('');
  lines.push(parsed.geoDescription || parsed.description || `${parsed.name} 致力于为客户提供专业的产品和服务。`);

  const result = lines.join('\n');

  // 严格控制在 2KB 以内（按 UTF-8 字节计算）
  const buf = Buffer.from(result, 'utf8');
  if (buf.length > LLMS_TXT_MAX_BYTES) {
    return truncateToBytes(result, LLMS_TXT_MAX_BYTES);
  }
  return result;
}

/**
 * 按 UTF-8 字节截断到 maxBytes，不破坏行完整性
 */
function truncateToBytes(text: string, maxBytes: number): string {
  const lines = text.split('\n');
  let acc = '';
  for (const line of lines) {
    const candidate = acc ? `${acc}\n${line}` : line;
    if (Buffer.from(candidate, 'utf8').length > maxBytes) {
      // 截到当前行停止
      break;
    }
    acc = candidate;
  }
  return acc;
}

// ========== 详细版 llms-full.txt ==========

/**
 * 生成 llms-full.txt（详细版）
 *
 * 包含企业概况、产品服务、成功案例、专业文章、联系方式等完整信息。
 */
export function generateLlmsFullTxt(site: SiteData): string {
  const parsed = SiteDataSchema.parse(site);
  const lines: string[] = [];

  lines.push(`# ${parsed.name} — 完整内容指南`);
  lines.push('');
  lines.push(`> ${parsed.description || '企业官方网站'}`);
  lines.push('');

  // 企业概况
  lines.push('## 企业概况');
  lines.push('');
  if (parsed.about) {
    lines.push(stripHtml(parsed.about));
    lines.push('');
  }

  const info: string[] = [];
  if (parsed.industry) info.push(`**所属行业**: ${parsed.industry}`);
  if (parsed.phone) info.push(`**联系电话**: ${parsed.phone}`);
  if (parsed.email) info.push(`**邮箱**: ${parsed.email}`);
  if (parsed.address) info.push(`**地址**: ${parsed.address}`);
  if (info.length > 0) {
    lines.push(info.join('  '));
    lines.push('');
  }

  // 产品与服务
  const products = publishedContents(parsed, 'product');
  if (products.length > 0) {
    lines.push('## 产品与服务');
    lines.push('');
    for (const product of products) {
      lines.push(`### ${product.title}`);
      lines.push('');
      lines.push(product.summary || '');
      lines.push('');
      if (product.fields) {
        for (const [key, value] of Object.entries(product.fields)) {
          lines.push(`- ${key}: ${value}`);
        }
        lines.push('');
      }
      lines.push(`[查看详情](${absoluteUrl(parsed.domain, `/products/${product.slug}`)})`);
      lines.push('');
    }
  }

  // 成功案例
  const cases = publishedContents(parsed, 'case');
  if (cases.length > 0) {
    lines.push('## 成功案例');
    lines.push('');
    for (const item of cases) {
      lines.push(`### ${item.title}`);
      lines.push('');
      if (item.fields) {
        const f = item.fields;
        if (f.customer) lines.push(`**客户**: ${f.customer}`);
        if (f.industry) lines.push(`**行业**: ${f.industry}`);
        if (f.challenge) lines.push(`**挑战**: ${truncate(f.challenge, 200)}`);
        if (f.solution) lines.push(`**方案**: ${truncate(f.solution, 200)}`);
        if (f.result) lines.push(`**成果**: ${truncate(f.result, 200)}`);
      }
      lines.push('');
      lines.push(`[查看详情](${absoluteUrl(parsed.domain, `/cases/${item.slug}`)})`);
      lines.push('');
    }
  }

  // 专业文章
  const posts = publishedContents(parsed, 'post');
  if (posts.length > 0) {
    lines.push('## 专业文章');
    lines.push('');
    for (const post of posts) {
      lines.push(`### ${post.title}`);
      lines.push('');
      if (post.meta) {
        const m = post.meta;
        if (m.author) {
          const title = m.authorTitle ? ` (${m.authorTitle})` : '';
          lines.push(`**作者**: ${m.author}${title}`);
        }
        if (m.publishedAt) {
          lines.push(`**发布时间**: ${m.publishedAt}`);
        }
      }
      if (post.summary) {
        lines.push('');
        lines.push(post.summary);
      }
      lines.push('');
      lines.push(`[阅读全文](${absoluteUrl(parsed.domain, `/posts/${post.slug}`)})`);
      lines.push('');
    }
  }

  // 联系方式
  lines.push('## 联系我们');
  lines.push('');
  if (parsed.phone) lines.push(`- 电话: ${parsed.phone}`);
  if (parsed.email) lines.push(`- 邮箱: ${parsed.email}`);
  if (parsed.address) lines.push(`- 地址: ${parsed.address}`);
  lines.push(`- 网站: https://${parsed.domain}`);

  return lines.join('\n');
}
