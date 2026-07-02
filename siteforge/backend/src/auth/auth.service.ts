import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  loginSchema,
  registerSchema,
  type LoginDto,
  type RegisterDto,
} from './dto/auth.dto';

/**
 * AuthService — 认证业务逻辑
 *
 * 职责：
 * - 用户注册（密码 bcrypt 哈希）
 * - 用户登录（验证密码，签发 JWT）
 * - 校验密码强度
 */
@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 注册新用户
   * 若数据库中尚无用户，则首个用户强制为 ADMIN 角色（用于首次初始化）
   */
  async register(input: RegisterDto): Promise<{ id: string; username: string; role: string }> {
    const parsed = registerSchema.parse(input);

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: parsed.username }, { email: parsed.email }],
      },
    });
    if (existing) {
      throw new UnauthorizedException({
        code: 'USER_EXISTS',
        message: '用户名或邮箱已存在',
      });
    }

    const passwordHash = await bcrypt.hash(parsed.password, this.BCRYPT_ROUNDS);
    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'EDITOR'; // 首个用户为管理员

    const user = await this.prisma.user.create({
      data: {
        username: parsed.username,
        email: parsed.email,
        passwordHash,
        role,
      },
    });

    return { id: user.id, username: user.username, role: user.role };
  }

  /**
   * 用户登录，返回 JWT access token
   */
  async login(input: LoginDto): Promise<{ accessToken: string; user: { id: string; username: string; role: string } }> {
    const parsed = loginSchema.parse(input);

    const user = await this.prisma.user.findUnique({
      where: { username: parsed.username },
    });
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: '用户名或密码错误',
      });
    }

    const ok = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: '用户名或密码错误',
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '24h'),
    });

    return {
      accessToken,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }

  /**
   * 根据 userId 查询用户（供 JwtStrategy 使用）
   */
  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true },
    });
  }
}
