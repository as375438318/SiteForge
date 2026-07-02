import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SitesModule } from './sites/sites.module';
import { LicenseModule } from './license/license.module';
import { HealthModule } from './health/health.module';
import { CmsModule } from './cms/cms.module';
import { FormsModule } from './forms/forms.module';
import { SeoModule } from './seo/seo.module';
import { GeoModule } from './geo/geo.module';
import { SsgModule } from './ssg/ssg.module';
import { MediaModule } from './media/media.module';
import { TemplatesModule } from './templates/templates.module';
import { BuildModule } from './build/build.module';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    SitesModule,
    LicenseModule,
    HealthModule,
    CmsModule,
    FormsModule,
    SeoModule,
    GeoModule,
    SsgModule,
    MediaModule,
    TemplatesModule,
    BuildModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
