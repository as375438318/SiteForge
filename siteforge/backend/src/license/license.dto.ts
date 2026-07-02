import { z } from 'zod';

/**
 * License 文件数据结构 schema
 * 与架构方案 4.8 节 License 文件结构对齐
 */
export const licenseDataSchema = z.object({
  licenseId: z.string().min(1),
  machineId: z.string().min(1),
  domain: z.string().min(1),
  edition: z.enum(['standard', 'professional', 'enterprise']),
  issuedAt: z.string().min(1),
  expireAt: z.string().min(1),
  features: z.array(z.string()).default([]),
  maxSites: z.number().int().positive().default(1),
});

/**
 * 激活 License 请求 schema（提交机器码 + 订单号 + 由云端签发的 license 文件）
 */
export const activateLicenseSchema = z.object({
  machineId: z.string().min(8, '机器码无效'),
  licenseFile: z.string().min(1, 'License 文件不能为空'),
  // licenseFile 为 base64 编码的 JSON+签名结构：
  // { data: licenseData, signature: <base64 RSA-SHA256 签名> }
});

export type LicenseData = z.infer<typeof licenseDataSchema>;
export type ActivateLicenseDto = z.infer<typeof activateLicenseSchema>;

/**
 * License 文件完整结构（含签名）
 */
export interface LicenseFile {
  data: LicenseData;
  signature: string; // base64 编码的 RSA-SHA256 签名
}
