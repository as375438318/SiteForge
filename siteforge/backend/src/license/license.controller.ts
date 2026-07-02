import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LicenseService } from './license.service';
import { activateLicenseSchema } from './license.dto';
import { zodPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';

/**
 * LicenseController — License 授权管理接口
 */
@ApiTags('License 授权')
@Controller('license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  /**
   * 获取当前机器码（用于提交给我方 License 签发服务）
   * 此接口对外公开，因为机器码本身不是机密
   */
  @Public()
  @Get('machine-id')
  @ApiOperation({ summary: '获取当前机器码', description: '用于提交给我方 License 签发服务' })
  getMachineId() {
    return this.licenseService.getMachineFingerprint();
  }

  /**
   * 查询 License 当前状态
   */
  @Get('status')
  @ApiOperation({ summary: '查询 License 状态' })
  getStatus() {
    return this.licenseService.getStatus();
  }

  /**
   * 激活 License（提交 License 文件）
   */
  @Post('activate')
  @ApiOperation({ summary: '激活 License', description: '提交 License 文件，验证签名/机器码/有效期' })
  activate(@Body(zodPipe(activateLicenseSchema)) body: unknown) {
    const input = body as { licenseFile: string };
    return this.licenseService.activate(input.licenseFile);
  }
}
