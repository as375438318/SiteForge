import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT Payload 结构
 */
export interface JwtPayload {
  sub: string; // userId
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * JwtStrategy — 解析 Authorization: Bearer <token> 并验证
 *
 * 验证流程：
 * 1. 从 Authorization Header 提取 Bearer token
 * 2. 用 JWT_SECRET 验证签名 + 过期时间
 * 3. 返回解码后的 payload，挂到 request.user 上
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('环境变量 JWT_SECRET 未配置，无法启动 JWT 策略');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Passport 验证通过后调用，返回值挂到 request.user
   */
  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
