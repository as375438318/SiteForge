import { Controller, Post, Body } from '@nestjs/common'
import { SeoService } from './seo.service'

@Controller('api/seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Post('generate')
  generate(@Body() body: { site: any; page?: any }) { return this.seo.generateAll(body.site, body.page) }

  @Post('health-check')
  healthCheck(@Body() body: { site: any; pages: any[] }) { return this.seo.healthCheck(body.site, body.pages) }
}
