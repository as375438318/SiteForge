import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  async listForms(siteId: string) {
    return this.prisma.form.findMany({ where: { siteId }, orderBy: { createdAt: 'desc' } })
  }
  async getForm(id: string) { return this.prisma.form.findUnique({ where: { id } }) }
  async createForm(data: { siteId: string; name: string; fields?: any; settings?: any }) {
    return this.prisma.form.create({ data: { ...data, fields: data.fields || [], settings: data.settings || {} } })
  }
  async updateForm(id: string, data: any) { return this.prisma.form.update({ where: { id }, data }) }
  async deleteForm(id: string) { return this.prisma.form.delete({ where: { id } }) }
}
