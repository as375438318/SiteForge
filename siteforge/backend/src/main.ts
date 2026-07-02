import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LicenseService } from './license/license.service';

/**
 * 应用启动入口
 *
 * 启动流程：
 * 1. 创建 Nest 应用
 * 2. 配置 Swagger API 文档
 * 3. 注册全局管道/过滤器
 * 4. 启动时验证 License 状态（不阻塞启动，仅记录日志）
 * 5. 监听端口
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // ===== 安全与中间件 =====
  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // ===== 全局管道 =====
  // 注：此处使用 NestJS 内置 ValidationPipe（兼容 class-validator）
  // Zod 校验由 ZodValidationPipe 在 Controller 级别按需应用
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ===== 全局过滤器 =====
  app.useGlobalFilters(new AllExceptionsFilter());

  // ===== Swagger 文档 =====
  const swaggerEnabled = config.get<string>('SWAGGER_ENABLED', 'true') === 'true';
  if (swaggerEnabled) {
    const docConfig = new DocumentBuilder()
      .setTitle('SiteForge API')
      .setDescription('AI 结构复刻 + SEO + GEO 企业官网搭建系统 — 后端 API 文档')
      .setVersion(config.get<string>('npm_package_version', '0.1.0'))
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization' },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, docConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log('Swagger 文档已挂载到 /api/docs');
  }

  // ===== License 启动校验 =====
  const licenseService = app.get(LicenseService);
  try {
    const result = await licenseService.validateOnStartup();
    if (result.valid) {
      logger.log('License 校验通过');
    } else {
      logger.warn(
        `License 校验失败：${result.reason ?? '未知原因'} — 管理功能受限，已发布静态站点保持可用`,
      );
    }
  } catch (err) {
    logger.error(`License 校验异常：${(err as Error).message}`);
  }

  // ===== 启动监听 =====
  const port = Number.parseInt(config.get<string>('PORT', '3000'), 10);
  await app.listen(port);
  logger.log(`SiteForge 后端已启动，监听端口 ${port}`);
  logger.log(`健康检查：http://localhost:${port}/health`);
  if (swaggerEnabled) {
    logger.log(`API 文档：http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('应用启动失败', err);
  process.exit(1);
});
