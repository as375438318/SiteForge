import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * HealthController — 健康检查接口
 * 用于 Docker healthcheck 和部署验证脚本
 */
@ApiTags('系统')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 简单存活检查
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '存活检查' })
  liveness() {
    return {
      status: 'ok',
      service: 'siteforge-backend',
      timestamp: new Date().toISOString(),
      version: this.config.get<string>('npm_package_version', '0.1.0'),
    };
  }

  /**
   * 就绪检查（含数据库连通性）
   */
  @Public()
  @Get('ready')
  @ApiOperation({ summary: '就绪检查', description: '含数据库连通性检查' })
  async readiness() {
    const checks: Record<string, { status: string; detail?: unknown }> = {};

    // 数据库检查
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok' };
    } catch (err) {
      checks.database = { status: 'fail', detail: (err as Error).message };
    }

    const allOk = Object.values(checks).every((c) => c.status === 'ok');
    return {
      status: allOk ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
