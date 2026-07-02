import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/**
 * JwtAuthGuard — JWT 认证守卫
 *
 * 用法：
 *   1. 全局应用（推荐，在 app.module 中通过 APP_GUARD 注册）
 *   2. Controller/方法级：@UseGuards(JwtAuthGuard)
 *
 * 配合 @Public() 装饰器可跳过认证（用于登录/注册/健康检查等公开端点）
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
