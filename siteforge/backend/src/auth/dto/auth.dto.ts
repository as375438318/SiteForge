import { z } from 'zod';

/**
 * 登录请求 schema
 */
export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(64),
  password: z.string().min(1, '密码不能为空').max(128),
});

/**
 * 注册请求 schema
 */
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, '用户名至少 3 位')
      .max(64, '用户名最多 64 位')
      .regex(/^[a-zA-Z0-9_]+$/, '用户名仅允许字母数字与下划线'),
    password: z
      .string()
      .min(8, '密码至少 8 位')
      .max(128, '密码最多 128 位')
      .regex(/[A-Za-z]/, '密码必须包含字母')
      .regex(/[0-9]/, '密码必须包含数字'),
    email: z.string().email('邮箱格式不正确'),
  });

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
