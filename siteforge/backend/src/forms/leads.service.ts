import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async listLeads(siteId: string, filters?: { formId?: string; status?: string }) {
    const where: any = { siteId }
    if (filters?.formId) where.formId = filters.formId
    if (filters?.status) where.status = filters.status
    return this.prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  async getLead(id: string) { return this.prisma.lead.findUnique({ where: { id } }) }

  async createLead(data: {
    siteId: string
    formId: string
    data: any
    sourcePage?: string
    ip?: string
  }) {
    return this.prisma.lead.create({ data: { ...data, status: 'PENDING' } as any })
  }

  async updateLeadStatus(id: string, status: string) {
    return this.prisma.lead.update({ where: { id }, data: { status: status as any } })
  }

  async deleteLead(id: string) { return this.prisma.lead.delete({ where: { id } }) }

  async exportLeads(siteId: string) {
    const leads = await this.prisma.lead.findMany({ where: { siteId }, orderBy: { createdAt: 'desc' } })
    const headers = ['提交时间', '姓名', '电话', '邮箱', '来源页面', '表单', '状态']
    const rows = leads.map((l: any) => [
      l.createdAt.toISOString(), l.data?.name || '', l.data?.phone || '', l.data?.email || '',
      l.sourcePage || '', l.data?.formName || '', l.status,
    ])
    return { headers, rows }
  }
}
