import { Module } from '@nestjs/common';
import { LicenseController } from './license.controller';
import { LicenseService } from './license.service';

/**
 * LicenseModule — License 授权管理模块
 *
 * 实现：
 * - 机器码生成（CPU + MAC + 磁盘序列号 → SHA256）
 * - RSA-SHA256 签名验证
 * - License 激活与状态查询
 */
@Module({
  controllers: [LicenseController],
  providers: [LicenseService],
  exports: [LicenseService],
})
export class LicenseModule {}
