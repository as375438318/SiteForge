import { Module } from '@nestjs/common'
import { SsgController } from './ssg.controller'
import { SsgService } from './ssg.service'
import { SeoService } from '../seo/seo.service'
import { GeoService } from '../geo/geo.service'

@Module({
  controllers: [SsgController],
  providers: [SsgService, SeoService, GeoService],
})
export class SsgModule {}
