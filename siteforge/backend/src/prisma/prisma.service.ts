import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — 全局 Prisma 客户端封装
 *
 * 设计要点：
 * - 继承 PrismaClient，直接注入使用
 * - 实现 OnModuleInit / OnModuleDestroy 生命周期钩子
 * - 启动时调用 $connect()，关闭时调用 $disconnect()
 * - 单例模式，通过 PrismaModule 全局导出
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma 已连接数据库');
    } catch (err) {
      this.logger.error('Prisma 数据库连接失败', (err as Error).stack);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma 已断开数据库连接');
  }
}
