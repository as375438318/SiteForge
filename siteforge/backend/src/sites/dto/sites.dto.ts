import { z } from 'zod';

/**
 * 创建站点请求 schema
 */
export const createSiteSchema = z.object({
  domain: z
    .string()
    .min(1, '域名不能为空')
    .max(253, '域名过长')
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      '域名格式不正确，应为 example.com 或 www.example.com',
    ),
  name: z.string().min(1, '站点名称不能为空').max(128),
  themeConfig: z.record(z.unknown()).optional().default({}),
  seoConfig: z.record(z.unknown()).optional().default({}),
  geoConfig: z.record(z.unknown()).optional().default({}),
});

/**
 * 更新站点请求 schema
 */
export const updateSiteSchema = createSiteSchema.partial();

export type CreateSiteDto = z.infer<typeof createSiteSchema>;
export type UpdateSiteDto = z.infer<typeof updateSiteSchema>;
