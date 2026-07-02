import { Controller, Post, Body } from '@nestjs/common'
import { SsgService } from './ssg.service'

@Controller('ssg')
export class SsgController {
  constructor(private readonly ssg: SsgService) {}

  @Post('generate')
  generate(@Body() body: any) { return this.ssg.generateSite(body) }

  @Post('preview-page')
  preview(@Body() body: { site: any; page: any }) { return { html: this.ssg.generatePage(body.site, body.page) } }
}
