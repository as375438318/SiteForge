/**
 * SiteForge - 区块 Schema 定义（前后端共享）
 *
 * 此文件被三处共享：
 *  - 编辑器（React 拖拽编辑器）：用于属性面板表单生成与校验
 *  - SSG（Astro 渲染）：用于渲染时 props 类型安全
 *  - 后端（NestJS）：用于入库前 props 校验
 *
 * 与原型 siteforge-prototype/src/ssg/block-renderer.js 的 16 种区块类型一一对应。
 *
 * 使用 Zod discriminatedUnion：以 `type` 字段做判别，每种区块对应独立的 props schema。
 */

import { z } from 'zod'

// ============================================================================
// 公共子 schema
// ============================================================================

/** 可空字符串（占位内容由渲染器兜底） */
const optionalString = z.string().optional()

/** 链接对象（CTA/导航等通用） */
export const linkSchema = z.object({
  label: z.string(),
  url: z.string(),
  target: z.enum(['_self', '_blank']).optional(),
})

/** SEO 元信息（页面/内容通用） */
export const seoMetaSchema = z.object({
  title: optionalString,
  description: optionalString,
  keywords: z.array(z.string()).optional(),
  canonical: optionalString,
  ogImage: optionalString,
  noindex: z.boolean().optional(),
})

// ============================================================================
// 1. Hero
// ============================================================================
export const heroPropsSchema = z.object({
  title: optionalString,
  subtitle: optionalString,
  cta: optionalString,
  ctaUrl: optionalString.default('/contact'),
  backgroundImage: optionalString,
  align: z.enum(['left', 'center', 'right']).optional().default('center'),
})
export type HeroProps = z.infer<typeof heroPropsSchema>

// ============================================================================
// 2. Feature Grid（核心优势）
// ============================================================================
export const featureItemSchema = z.object({
  icon: optionalString,
  title: optionalString,
  desc: optionalString,
})
export const featureGridPropsSchema = z.object({
  title: optionalString,
  items: z.array(featureItemSchema).default([]),
  columns: z.number().int().min(1).max(6).optional().default(3),
})
export type FeatureGridProps = z.infer<typeof featureGridPropsSchema>

// ============================================================================
// 3. Product Grid（产品网格，从 CMS 拉取）
// ============================================================================
export const productGridPropsSchema = z.object({
  title: optionalString,
  collection: z.enum(['products', 'cases', 'posts']).optional().default('products'),
  limit: z.number().int().min(1).max(50).optional().default(6),
  showPrice: z.boolean().optional().default(true),
  showCategory: z.boolean().optional().default(true),
})
export type ProductGridProps = z.infer<typeof productGridPropsSchema>

// ============================================================================
// 4. Product List（产品列表，纵向布局）
// ============================================================================
export const productListPropsSchema = z.object({
  title: optionalString,
  collection: z.enum(['products', 'cases', 'posts']).optional().default('products'),
  limit: z.number().int().min(1).max(100).optional().default(10),
  showExcerpt: z.boolean().optional().default(true),
})
export type ProductListProps = z.infer<typeof productListPropsSchema>

// ============================================================================
// 5. Case List（成功案例列表）
// ============================================================================
export const caseListPropsSchema = z.object({
  title: optionalString,
  limit: z.number().int().min(1).max(50).optional().default(6),
  showIndustry: z.boolean().optional().default(true),
  showMetrics: z.boolean().optional().default(true),
})
export type CaseListProps = z.infer<typeof caseListPropsSchema>

// ============================================================================
// 6. Page Header（页面顶部标题区）
// ============================================================================
export const pageHeaderPropsSchema = z.object({
  title: optionalString,
  subtitle: optionalString,
  backgroundImage: optionalString,
})
export type PageHeaderProps = z.infer<typeof pageHeaderPropsSchema>

// ============================================================================
// 7. Text + Image（图文混排）
// ============================================================================
export const textImagePropsSchema = z.object({
  title: optionalString,
  content: optionalString,
  image: optionalString,
  imageAlt: optionalString,
  imagePosition: z.enum(['left', 'right']).optional().default('right'),
})
export type TextImageProps = z.infer<typeof textImagePropsSchema>

// ============================================================================
// 8. Team（团队成员）
// ============================================================================
export const teamMemberSchema = z.object({
  name: optionalString,
  title: optionalString,
  avatar: optionalString,
  bio: optionalString,
})
export const teamPropsSchema = z.object({
  title: optionalString,
  members: z.array(teamMemberSchema).default([]),
})
export type TeamProps = z.infer<typeof teamPropsSchema>

// ============================================================================
// 9. CTA（行动召唤）
// ============================================================================
export const ctaPropsSchema = z.object({
  title: optionalString,
  subtitle: optionalString,
  button: optionalString.default('立即咨询'),
  buttonUrl: optionalString.default('/contact'),
})
export type CtaProps = z.infer<typeof ctaPropsSchema>

// ============================================================================
// 10. Contact Info（联系方式展示）
// ============================================================================
export const contactInfoPropsSchema = z.object({
  title: optionalString.default('联系我们'),
  phone: optionalString,
  email: optionalString,
  address: optionalString,
  wechat: optionalString,
  workingHours: optionalString,
})
export type ContactInfoProps = z.infer<typeof contactInfoPropsSchema>

// ============================================================================
// 11. Form（在线咨询表单）
// ============================================================================
export const formFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio']),
  required: z.boolean().optional().default(false),
  placeholder: optionalString,
  options: z.array(z.string()).optional(),
})
export const formPropsSchema = z.object({
  title: optionalString.default('在线咨询'),
  action: optionalString.default('/api/leads/submit'),
  method: z.enum(['POST', 'GET']).optional().default('POST'),
  fields: z.array(formFieldSchema).optional(),
  submitLabel: optionalString.default('提交咨询'),
})
export type FormProps = z.infer<typeof formPropsSchema>

// ============================================================================
// 12. Stats（数据统计）
// ============================================================================
export const statItemSchema = z.object({
  number: optionalString,
  label: optionalString,
  suffix: optionalString,
})
export const statsPropsSchema = z.object({
  title: optionalString,
  items: z.array(statItemSchema).default([]),
})
export type StatsProps = z.infer<typeof statsPropsSchema>

// ============================================================================
// 13. FAQ（常见问题）
// ============================================================================
export const faqItemSchema = z.object({
  question: optionalString,
  answer: optionalString,
})
export const faqPropsSchema = z.object({
  title: optionalString.default('常见问题'),
  items: z.array(faqItemSchema).default([]),
})
export type FaqProps = z.infer<typeof faqPropsSchema>

// ============================================================================
// 14. Testimonial（客户评价）
// ============================================================================
export const testimonialPropsSchema = z.object({
  quote: optionalString,
  author: optionalString,
  authorTitle: optionalString,
  avatar: optionalString,
  company: optionalString,
})
export type TestimonialProps = z.infer<typeof testimonialPropsSchema>

// ============================================================================
// 15. Map（地图）
// ============================================================================
export const mapPropsSchema = z.object({
  title: optionalString.default('地图'),
  address: optionalString,
  embedUrl: optionalString,
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})
export type MapProps = z.infer<typeof mapPropsSchema>

// ============================================================================
// 16. Footer（页脚）
// ============================================================================
export const footerNavLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
})
export const footerPropsSchema = z.object({
  companyName: optionalString,
  description: optionalString,
  phone: optionalString,
  email: optionalString,
  address: optionalString,
  icp: optionalString,
  navLinks: z.array(footerNavLinkSchema).optional(),
  socialLinks: z
    .array(z.object({ platform: z.string(), url: z.string() }))
    .optional(),
})
export type FooterProps = z.infer<typeof footerPropsSchema>

// ============================================================================
// 区块类型常量与判别联合
// ============================================================================

/** 全部区块类型字面量 */
export const BLOCK_TYPES = [
  'hero',
  'feature_grid',
  'product_grid',
  'product_list',
  'case_list',
  'page_header',
  'text_image',
  'team',
  'cta',
  'contact_info',
  'form',
  'stats',
  'faq',
  'testimonial',
  'map',
  'footer',
] as const
export type BlockType = (typeof BLOCK_TYPES)[number]

/** 区块判别联合 schema：以 `type` 为判别字段 */
export const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hero'), props: heroPropsSchema }),
  z.object({ type: z.literal('feature_grid'), props: featureGridPropsSchema }),
  z.object({ type: z.literal('product_grid'), props: productGridPropsSchema }),
  z.object({ type: z.literal('product_list'), props: productListPropsSchema }),
  z.object({ type: z.literal('case_list'), props: caseListPropsSchema }),
  z.object({ type: z.literal('page_header'), props: pageHeaderPropsSchema }),
  z.object({ type: z.literal('text_image'), props: textImagePropsSchema }),
  z.object({ type: z.literal('team'), props: teamPropsSchema }),
  z.object({ type: z.literal('cta'), props: ctaPropsSchema }),
  z.object({ type: z.literal('contact_info'), props: contactInfoPropsSchema }),
  z.object({ type: z.literal('form'), props: formPropsSchema }),
  z.object({ type: z.literal('stats'), props: statsPropsSchema }),
  z.object({ type: z.literal('faq'), props: faqPropsSchema }),
  z.object({ type: z.literal('testimonial'), props: testimonialPropsSchema }),
  z.object({ type: z.literal('map'), props: mapPropsSchema }),
  z.object({ type: z.literal('footer'), props: footerPropsSchema }),
])
export type Block = z.infer<typeof blockSchema>

/** 区块实例（含 sortOrder / id 等运行时元信息） */
export const blockInstanceSchema = z.object({
  id: z.string(),
  type: z.enum(BLOCK_TYPES),
  props: z.record(z.unknown()).default({}),
  sortOrder: z.number().default(0),
})
export type BlockInstance = z.infer<typeof blockInstanceSchema>

/** 页面 schema（blocks 序列 + SEO 元信息） */
export const pageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  url: z.string(),
  title: z.string(),
  blocks: z.array(blockInstanceSchema).default([]),
  seoMeta: seoMetaSchema.optional(),
  changefreq: z
    .enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])
    .optional()
    .default('weekly'),
  priority: z.number().min(0).max(1).optional().default(0.8),
  updatedAt: z.string().optional(),
})
export type Page = z.infer<typeof pageSchema>

/** 站点数据 schema */
export const siteDataSchema = z.object({
  name: z.string(),
  domain: z.string(),
  description: z.string().optional(),
  logo: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z.array(z.string()).optional(),
  navigation: z.array(linkSchema).default([]),
  pages: z.array(pageSchema).default([]),
  contents: z
    .array(
      z.object({
        type: z.enum(['product', 'case', 'post']),
        slug: z.string(),
        title: z.string(),
        summary: z.string().optional(),
        coverImage: z.string().optional(),
        status: z.enum(['draft', 'published']).default('draft'),
        updatedAt: z.string().optional(),
        meta: z
          .object({
            author: z.string().optional(),
            authorTitle: z.string().optional(),
            publishedAt: z.string().optional(),
            updatedAt: z.string().optional(),
          })
          .optional(),
      }),
    )
    .default([]),
  allowAiCrawlers: z.boolean().default(true),
})
export type SiteData = z.infer<typeof siteDataSchema>

/** 校验工具：将 BlockInstance.props 与对应类型的 props schema 校验 */
export function validateBlockProps(block: BlockInstance): unknown {
  const propsSchemaMap: Record<BlockType, z.ZodTypeAny> = {
    hero: heroPropsSchema,
    feature_grid: featureGridPropsSchema,
    product_grid: productGridPropsSchema,
    product_list: productListPropsSchema,
    case_list: caseListPropsSchema,
    page_header: pageHeaderPropsSchema,
    text_image: textImagePropsSchema,
    team: teamPropsSchema,
    cta: ctaPropsSchema,
    contact_info: contactInfoPropsSchema,
    form: formPropsSchema,
    stats: statsPropsSchema,
    faq: faqPropsSchema,
    testimonial: testimonialPropsSchema,
    map: mapPropsSchema,
    footer: footerPropsSchema,
  }
  const schema = propsSchemaMap[block.type]
  return schema.parse(block.props ?? {})
}
