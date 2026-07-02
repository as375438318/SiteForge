/**
 * SiteForge SEO Engine - Schema.org JSON-LD 生成器
 */
import type { SiteInfo, PageInfo, ContentInfo, SchemaOutput } from './types'

export function generateSchema(
  site: SiteInfo,
  page?: PageInfo,
  content?: ContentInfo,
): string[] {
  const schemas: SchemaOutput[] = []

  // 1. 全站 Organization schema
  schemas.push({
    type: 'Organization',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      url: `https://${site.domain}`,
      logo: site.logo || '',
      description: site.description || '',
      ...(site.socialLinks?.length ? { sameAs: site.socialLinks } : {}),
      ...(site.phone ? { telephone: site.phone } : {}),
      ...(site.email ? { email: site.email } : {}),
      ...(site.address
        ? { address: { '@type': 'PostalAddress', addressLocality: site.address } }
        : {}),
    },
    scriptTag: '',
  })

  // 2. 内容级 schema
  if (content) {
    if (content.type === 'product') {
      schemas.push({
        type: 'Product',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: content.title,
          description: content.summary || '',
          brand: { '@type': 'Brand', name: site.name },
          image: content.coverImage || '',
        },
        scriptTag: '',
      })
    } else if (content.type === 'post' || content.type === 'case') {
      const articleSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: content.title,
        image: content.coverImage || '',
        publisher: {
          '@type': 'Organization',
          name: site.name,
          logo: { '@type': 'ImageObject', url: site.logo || '' },
        },
      }
      if (content.meta) {
        if (content.meta.author) {
          const author: Record<string, unknown> = {
            '@type': 'Person',
            name: content.meta.author,
          }
          if (content.meta.authorTitle) author['jobTitle'] = content.meta.authorTitle
          if (content.meta.authorBio) author['description'] = content.meta.authorBio
          articleSchema['author'] = author
        }
        if (content.meta.publishedAt) articleSchema['datePublished'] = content.meta.publishedAt
        if (content.meta.updatedAt) articleSchema['dateModified'] = content.meta.updatedAt
      }
      schemas.push({
        type: 'Article',
        jsonLd: articleSchema,
        scriptTag: '',
      })
    }
  }

  // 3. FAQ schema
  if (page?.faqs && page.faqs.length > 0) {
    schemas.push({
      type: 'FAQPage',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      scriptTag: '',
    })
  }

  // 4. Breadcrumb schema
  if (page?.breadcrumbs && page.breadcrumbs.length > 0) {
    schemas.push({
      type: 'BreadcrumbList',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: page.breadcrumbs.map((bc, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: bc.name,
          item: `https://${site.domain}${bc.url}`,
        })),
      },
      scriptTag: '',
    })
  }

  // 5. LocalBusiness schema
  if (site.address && site.phone) {
    schemas.push({
      type: 'LocalBusiness',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: site.name,
        address: { '@type': 'PostalAddress', addressLocality: site.address },
        telephone: site.phone,
        ...(site.email ? { email: site.email } : {}),
      },
      scriptTag: '',
    })
  }

  // 转换为 script 标签
  return schemas.map(
    (s) =>
      `<script type="application/ld+json">\n${JSON.stringify(s.jsonLd, null, 2)}\n</script>`,
  )
}
