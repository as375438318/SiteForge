import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { CmsService } from './cms.service'

@Controller('cms')
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  // 内容集合
  @Get('collections/:siteId')
  listCollections(@Param('siteId') siteId: string) { return this.cms.listCollections(siteId) }
  @Post('collections')
  createCollection(@Body() body: any) { return this.cms.createCollection(body.siteId, body) }

  // 内容
  @Get('contents/:siteId')
  listContents(@Param('siteId') siteId: string, @Query('collectionId') cid?: string, @Query('status') status?: string) {
    return this.cms.listContents(siteId, cid, status)
  }
  @Get('content/:id')
  getContent(@Param('id') id: string) { return this.cms.getContent(id) }
  @Post('content')
  createContent(@Body() body: any) { return this.cms.createContent(body) }
  @Put('content/:id')
  updateContent(@Param('id') id: string, @Body() body: any) { return this.cms.updateContent(id, body) }
  @Delete('content/:id')
  deleteContent(@Param('id') id: string) { return this.cms.deleteContent(id) }

  // 页面
  @Get('pages/:siteId')
  listPages(@Param('siteId') siteId: string) { return this.cms.listPages(siteId) }
  @Get('page/:id')
  getPage(@Param('id') id: string) { return this.cms.getPage(id) }
  @Post('page')
  createPage(@Body() body: any) { return this.cms.createPage(body) }
  @Put('page/:id')
  updatePage(@Param('id') id: string, @Body() body: any) { return this.cms.updatePage(id, body) }
  @Delete('page/:id')
  deletePage(@Param('id') id: string) { return this.cms.deletePage(id) }

  // 导航
  @Get('navigation/:siteId')
  getNavigation(@Param('siteId') siteId: string) { return this.cms.getNavigation(siteId) }
  @Put('navigation/:siteId')
  updateNavigation(@Param('siteId') siteId: string, @Body() body: { items: any[] }) {
    return this.cms.updateNavigation(siteId, body.items)
  }
}
