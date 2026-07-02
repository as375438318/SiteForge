import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSiteDto, UpdateSiteDto } from './dto/sites.dto';

/**
 * SitesService — 站点 CRUD 业务逻辑
 */
@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建站点
   * 域名唯一，重复时抛 409
   */
  async create(input: CreateSiteDto) {
    try {
      return await this.prisma.site.create({
        data: {
          domain: input.domain,
          name: input.name,
          themeConfig: (input.themeConfig ?? {}) as Prisma.InputJsonValue,
          seoConfig: (input.seoConfig ?? {}) as Prisma.InputJsonValue,
          geoConfig: (input.geoConfig ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'SITE_DOMAIN_EXISTS',
          message: `站点域名已存在：${input.domain}`,
        });
      }
      throw err;
    }
  }

  /**
   * 查询站点列表
   */
  async findAll() {
    return this.prisma.site.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 查询单个站点
   */
  async findOne(id: string) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) {
      throw new NotFoundException({
        code: 'SITE_NOT_FOUND',
        message: `站点未找到：${id}`,
      });
    }
    return site;
  }

  /**
   * 更新站点
   */
  async update(id: string, input: UpdateSiteDto) {
    await this.findOne(id);
    try {
      return await this.prisma.site.update({
        where: { id },
        data: {
          ...(input.domain !== undefined && { domain: input.domain }),
          ...(input.name !== undefined && { name: input.name }),
          ...(input.themeConfig !== undefined && {
            themeConfig: input.themeConfig as Prisma.InputJsonValue,
          }),
          ...(input.seoConfig !== undefined && {
            seoConfig: input.seoConfig as Prisma.InputJsonValue,
          }),
          ...(input.geoConfig !== undefined && {
            geoConfig: input.geoConfig as Prisma.InputJsonValue,
          }),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'SITE_DOMAIN_EXISTS',
          message: `站点域名已存在：${input.domain}`,
        });
      }
      throw err;
    }
  }

  /**
   * 删除站点（级联删除所有关联数据）
   */
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.site.delete({ where: { id } });
    return { id, deleted: true };
  }
}
