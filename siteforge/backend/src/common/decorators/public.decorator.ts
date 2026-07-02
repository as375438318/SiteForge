import { SetMetadata } from '@nestjs/common';

/**
 * @Public() 装饰器 — 标记路由为公开访问，跳过 JWT 认证
 * 用于登录、注册、健康检查等端点
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
