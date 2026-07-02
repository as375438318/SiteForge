import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { zodPipe } from '../common/pipes/zod-validation.pipe';
import { createSiteSchema, updateSiteSchema } from './dto/sites.dto';

/**
 * SitesController — 站点管理接口
 * 所有接口需要 JWT 认证（由全局 JwtAuthGuard 守护）
 */
@ApiTags('站点管理')
@ApiBearerAuth()
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @ApiOperation({ summary: '创建站点' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(zodPipe(createSiteSchema)) body: unknown) {
    return this.sitesService.create(body as Parameters<typeof this.sitesService.create>[0]);
  }

  @Get()
  @ApiOperation({ summary: '查询站点列表' })
  findAll() {
    return this.sitesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单个站点' })
  findOne(@Param('id') id: string) {
    return this.sitesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新站点' })
  update(
    @Param('id') id: string,
    @Body(zodPipe(updateSiteSchema)) body: unknown,
  ) {
    return this.sitesService.update(id, body as Parameters<typeof this.sitesService.update>[1]);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除站点（级联删除关联数据）' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.sitesService.remove(id);
  }
}
