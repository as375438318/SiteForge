import { Module, Controller, Post, Body, Get, Param } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'

@Controller('build')
class BuildController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async createJob(@Body() body: { siteId: string }) {
    return this.prisma.buildJob.create({ data: { siteId: body.siteId, status: 'PENDING', trigger: 'manual' } as any })
  }

  @Get(':siteId')
  async listJobs(@Param('siteId') siteId: string) {
    return this.prisma.buildJob.findMany({ where: { siteId }, orderBy: { createdAt: 'desc' }, take: 20 })
  }
}

@Module({ controllers: [BuildController] })
export class BuildModule {}
