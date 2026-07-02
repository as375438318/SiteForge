import { Module, Controller, Get, Post, Delete, Body, Param } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'

@Controller('api/media')
class MediaController {
  constructor(private prisma: PrismaService) {}
  @Get(':siteId') list(@Param('siteId') siteId: string) { return this.prisma.media.findMany({ where: { siteId } }) }
  @Post() create(@Body() body: any) { return this.prisma.media.create({ data: body }) }
  @Delete(':id') delete(@Param('id') id: string) { return this.prisma.media.delete({ where: { id } }) }
}

@Module({ controllers: [MediaController] })
export class MediaModule {}
