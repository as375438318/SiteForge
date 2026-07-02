import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { zodPipe } from '../common/pipes/zod-validation.pipe';
import { loginSchema, registerSchema } from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';

/**
 * AuthController — 认证相关接口
 */
@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   */
  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录', description: '通过用户名密码获取 JWT access token' })
  async login(@Body(zodPipe(loginSchema)) body: unknown) {
    return this.authService.login(body as Parameters<typeof this.authService.login>[0]);
  }

  /**
   * 用户注册
   * 首个注册的用户自动成为管理员（用于首次部署初始化）
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册', description: '首个用户自动成为管理员' })
  async register(@Body(zodPipe(registerSchema)) body: unknown) {
    return this.authService.register(body as Parameters<typeof this.authService.register>[0]);
  }
}
