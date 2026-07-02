import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * Zod 校验管道
 * 基于 Zod schema 对请求体/查询/参数进行校验
 *
 * 用法：
 *   @Post()
 *   @UsePipes(new ZodValidationPipe(createSiteSchema))
 *   create(@Body() body: CreateSiteDto) { ... }
 *
 * 或作为全局管道：
 *   app.useGlobalPipes(new ZodValidationPipe())
 *   （需要 controller 通过 @Body 装饰器配合 schema 元数据）
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    // 若构造时未传 schema，则不校验（兼容全局使用场景）
    if (!this.schema) {
      return value;
    }

    // 只校验 body / query / param，跳过自定义管道元数据
    if (
      metadata.type !== 'body' &&
      metadata.type !== 'query' &&
      metadata.type !== 'param'
    ) {
      return value;
    }

    // undefined / null 直接抛错（除非 schema 显式允许）
    if (value === undefined || value === null) {
      const result = this.schema.safeParse(value);
      if (!result.success) {
        throw this.buildException(result.error);
      }
      return result.data;
    }

    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw this.buildException(result.error);
    }
    return result.data;
  }

  private buildException(error: ZodError): BadRequestException {
    return new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: '请求参数校验失败',
      detail: error.errors,
    });
  }
}

/**
 * 工厂函数：创建带 schema 的 ZodValidationPipe 实例
 * 用于在 Controller 上更清晰地声明：
 *   @UsePipes(zodPipe(createSiteSchema))
 */
export function zodPipe(schema: ZodSchema): ZodValidationPipe {
  return new ZodValidationPipe(schema);
}
