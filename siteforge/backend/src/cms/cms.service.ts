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
    return this.prisma.collection.create({ data: { siteId, slug: data.name, ...data, fieldsSchema: data.fieldsSchema || {} } as any })
  }

  // ========== 内容条目 ==========
  async listContents(siteId: string, collectionId?: string, status?: string) {
    const where: any = { siteId }
    if (collectionId) where.collectionId = collectionId
    if (status) where.status = status
    return this.prisma.content.findMany({ where, orderBy: { updatedAt: 'desc' } })
  }

  async getContent(id: string) {
    return this.prisma.content.findUnique({ where: { id } })
  }

  async createContent(data: {
    siteId: string
    collectionId: string
    title: string
    slug: string
    summary?: string
    fields?: any
    status?: string
    coverImage?: string
    meta?: any
  }) {
    return this.prisma.content.create({ data: { ...data, status: (data.status as any) || 'DRAFT' } })
  }

  async updateContent(id: string, data: any) {
    return this.prisma.content.update({ where: { id }, data })
  }

  async deleteContent(id: string) {
    return this.prisma.content.delete({ where: { id } })
  }

  // ========== 页面 ==========
  async listPages(siteId: string) {
    return this.prisma.page.findMany({ where: { siteId }, orderBy: { createdAt: 'asc' } })
  }

  async getPage(id: string) {
    return this.prisma.page.findUnique({ where: { id } })
  }

  async createPage(data: {
    siteId: string
    url: string
    title: string
    type?: string
    blocks?: any
    seoMeta?: any
  }) {
    return this.prisma.page.create({ data: { slug: data.url, ...data, blocks: data.blocks || [], seoMeta: data.seoMeta || {} } as any })
  }

  async updatePage(id: string, data: any) {
    return this.prisma.page.update({ where: { id }, data })
  }

  async deletePage(id: string) {
    return this.prisma.page.delete({ where: { id } })
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
