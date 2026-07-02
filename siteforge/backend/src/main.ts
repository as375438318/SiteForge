import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LicenseService } from './license/license.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.enableCors({ origin: '*', credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger 文档
  const docConfig = new DocumentBuilder()
    .setTitle('SiteForge API')
    .setDescription('AI 结构复刻 + SEO + GEO 企业官网搭建系统')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('api/docs', app, document);
  logger.log('Swagger 文档: /api/docs');

  // License 校验
  const licenseService = app.get(LicenseService);
  try {
    const result = await licenseService.validateOnStartup();
    if (result.valid) logger.log('License 校验通过');
    else logger.warn(`License 校验失败：${result.reason ?? '未知原因'}`);
  } catch (err) {
    logger.error(`License 校验异常：${(err as Error).message}`);
  }

  const port = Number.parseInt(config.get<string>('PORT', '3000'), 10);
  await app.listen(port);
  logger.log(`SiteForge 后端已启动: http://localhost:${port}`);
  logger.log(`健康检查: http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  console.error('应用启动失败', err);
  process.exit(1);
});
