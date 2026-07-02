import { Controller, Post, Body } from '@nestjs/common'
import { GeoService } from './geo.service'

@Controller('api/geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Post('score')
  score(@Body() body: { text: string; html?: string; meta?: any; domain?: string }) {
    return this.geo.score({ text: body.text, html: body.html || body.text, meta: body.meta || {} })
  }

  @Post('llms-txt')
  llmsTxt(@Body() body: any) { return this.geo.generateLlmsTxt(body) }

  @Post('citation-test')
  citationTest(@Body() body: { question: string; contents: any[] }) {
    return this.geo.citationTest(body.question, body.contents)
  }
}
