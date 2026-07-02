import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LicenseService } from './license/license.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // 安全与中间件
  app.enableCors({ origin: '*', credentials: true });

  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 全局过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // License 启动校验
  const licenseService = app.get(LicenseService);
  try {
    const result = await licenseService.validateOnStartup();
    if (result.valid) {
      logger.log('License 校验通过');
    } else {
      logger.warn(`License 校验失败：${result.reason ?? '未知原因'} — 管理功能受限`);
    }
  } catch (err) {
    logger.error(`License 校验异常：${(err as Error).message}`);
  }

  // 启动监听
  const port = Number.parseInt(config.get<string>('PORT', '3000'), 10);
  await app.listen(port);
  logger.log(`SiteForge 后端已启动，监听端口 ${port}`);
  logger.log(`健康检查：http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  console.error('应用启动失败', err);
  process.exit(1);
});
