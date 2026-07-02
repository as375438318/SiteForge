import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  // ========== 内容集合 ==========
  async listCollections(siteId: string) {
    return this.prisma.collection.findMany({ where: { siteId }, orderBy: { createdAt: 'desc' } })
  }

  async createCollection(siteId: string, data: { type: string; name: string; fieldsSchema?: any }) {
    return this.prisma.collection.create({
      data: { siteId, type: data.type as any, name: data.name, slug: data.name, fieldsSchema: data.fieldsSchema || {} } as any,
    })
  }

  // ========== 内容条目 ==========
  async listContents(siteId: string, collectionId?: string, status?: string) {
    // Content 表无 siteId，通过 collection 关联查询
    const collections = await this.prisma.collection.findMany({ where: { siteId }, select: { id: true } })
    const collectionIds = collections.map(c => c.id)
    if (collectionIds.length === 0) return []

    const where: any = { collectionId: { in: collectionIds } }
    if (collectionId) where.collectionId = collectionId
    if (status) where.status = status as any
    return this.prisma.content.findMany({ where, orderBy: { updatedAt: 'desc' } })
  }

  async getContent(id: string) {
    return this.prisma.content.findUnique({ where: { id } })
  }

  async createContent(data: {
    collectionId: string
    title: string
    slug: string
    fields?: any
    status?: string
  }) {
    // Content 表只有 collectionId/slug/title/fields/status/seoMeta/geoMeta/author/publishedAt
    return this.prisma.content.create({
      data: {
        collectionId: data.collectionId,
        title: data.title,
        slug: data.slug,
        fields: data.fields || {},
        status: (data.status as any) || 'DRAFT',
      } as any,
    })
  }

  async updateContent(id: string, data: any) {
    // 只更新 Content 表有的字段
    const allowed: any = {}
    if (data.title !== undefined) allowed.title = data.title
    if (data.slug !== undefined) allowed.slug = data.slug
    if (data.fields !== undefined) allowed.fields = data.fields
    if (data.status !== undefined) allowed.status = data.status as any
    if (data.seoMeta !== undefined) allowed.seoMeta = data.seoMeta
    if (data.geoMeta !== undefined) allowed.geoMeta = data.geoMeta
    if (data.author !== undefined) allowed.author = data.author
    if (data.publishedAt !== undefined) allowed.publishedAt = data.publishedAt
    return this.prisma.content.update({ where: { id }, data: allowed })
  }

  async deleteContent(id: string) {
    return this.prisma.content.delete({ where: { id } })
  }

  // ========== 页面 ==========
  async listPages(siteId: string) {
    return this.prisma.page.findMany({ where: { siteId }, orderBy: { sortOrder: 'asc' }, include: { blocks: { orderBy: { sortOrder: 'asc' } } } })
  }

  async getPage(id: string) {
    return this.prisma.page.findUnique({ where: { id }, include: { blocks: { orderBy: { sortOrder: 'asc' } } } })
  }

  async createPage(data: {
    siteId: string
    slug: string
    title: string
    type?: string
    seoMeta?: any
  }) {
    // Page 表有 siteId/slug/title/type/seoMeta/status/sortOrder，blocks 是独立表
    return this.prisma.page.create({
      data: {
        siteId: data.siteId,
        slug: data.slug,
        title: data.title,
        type: (data.type as any) || 'CUSTOM',
        seoMeta: data.seoMeta || {},
      } as any,
    })
  }

  async updatePage(id: string, data: any) {
    const allowed: any = {}
    if (data.title !== undefined) allowed.title = data.title
    if (data.slug !== undefined) allowed.slug = data.slug
    if (data.type !== undefined) allowed.type = data.type as any
    if (data.seoMeta !== undefined) allowed.seoMeta = data.seoMeta
    if (data.status !== undefined) allowed.status = data.status as any
    if (data.sortOrder !== undefined) allowed.sortOrder = data.sortOrder
    return this.prisma.page.update({ where: { id }, data: allowed })
  }

  async deletePage(id: string) {
    return this.prisma.page.delete({ where: { id } })
  }

  // ========== 区块 ==========
  async listBlocks(pageId: string) {
    return this.prisma.block.findMany({ where: { pageId }, orderBy: { sortOrder: 'asc' } })
  }

  async createBlock(data: { pageId: string; type: string; props?: any; sortOrder?: number }) {
    return this.prisma.block.create({ data: { pageId: data.pageId, type: data.type, props: data.props || {}, sortOrder: data.sortOrder || 0 } })
  }

  async updateBlock(id: string, data: any) {
    return this.prisma.block.update({ where: { id }, data })
  }

  async deleteBlock(id: string) {
    return this.prisma.block.delete({ where: { id } })
  }

  // ========== 导航 ==========
  async getNavigation(siteId: string) {
    const nav = await this.prisma.navigation.findFirst({ where: { siteId } })
    return nav?.items || []
  }

  async updateNavigation(siteId: string, items: any[]) {
    const existing = await this.prisma.navigation.findFirst({ where: { siteId } })
    if (existing) {
      return this.prisma.navigation.update({ where: { id: existing.id }, data: { items } })
    }
    return this.prisma.navigation.create({ data: { siteId, items, location: 'main' } })
  }
}
