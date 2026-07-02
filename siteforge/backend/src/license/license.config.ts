import { z } from 'zod';

/**
 * LicenseConfig — License 模块的配置 schema
 * 通过 ConfigService.forRoot 按需加载
 */
export const licenseConfigSchema = z.object({
  /**
   * RSA 公钥（PEM 格式），用于验证 License 签名
   * 在生产环境由我方 License 签发服务持有私钥，客户端仅内置公钥
   */
  rsaPublicKey: z.string().default(''),

  /**
   * RSA 私钥（PEM 格式），仅用于本地开发/测试时签发 License
   * 生产环境不配置此项
   */
  rsaPrivateKey: z.string().default(''),

  /**
   * License 强制校验开关
   * 关闭时即使 License 无效也允许管理功能（仅用于开发/演示）
   */
  strictMode: z.boolean().default(true),

  /**
   * License 到期前提醒天数
   */
  expireWarnDays: z.number().int().positive().default(7),
});

export type LicenseConfig = z.infer<typeof licenseConfigSchema>;
