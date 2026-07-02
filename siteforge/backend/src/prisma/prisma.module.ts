import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule — 全局 Prisma 服务模块
 * 通过 @Global() 装饰，所有模块均可直接注入 PrismaService，无需重复 import
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
