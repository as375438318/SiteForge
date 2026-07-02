import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

/**
 * 统一错误响应格式
 */
export interface ErrorResponse {
  code: string;
  message: string;
  detail?: unknown;
  timestamp: string;
  path: string;
}

/**
 * 全局异常过滤器
 * 统一捕获所有异常并返回 { code, message, detail } 格式
 *
 * 处理范围：
 * - HttpException: NestJS 标准异常
 * - ZodError: Zod 校验异常
 * - Prisma.PrismaClientKnownRequestError: 已知 Prisma 异常（如唯一约束冲突）
 * - 其他未知异常：兜底 500
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = '服务器内部错误';
    let detail: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        const rawMessage = (r.message as string | string[] | undefined) ?? exception.message;
        message = Array.isArray(rawMessage) ? rawMessage.join('; ') : rawMessage;
        code = (r.code as string | undefined) ?? exception.name;
        detail = r.detail ?? r.error;
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = '请求参数校验失败';
      detail = exception.errors;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = this.mapPrismaError(exception);
      status = mapped.status;
      code = mapped.code;
      message = mapped.message;
      detail = {
        code: exception.code,
        meta: exception.meta,
      };
    } else if (exception instanceof Error) {
      message = exception.message || '未知错误';
      code = exception.name || 'UNKNOWN_ERROR';
      detail = undefined;
    }

    const body: ErrorResponse = {
      code,
      message,
      detail,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} -> ${status} ${code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} -> ${status} ${code}: ${message}`);
    }

    response.status(status).json(body);
  }

  /**
   * 将 Prisma 已知错误映射为 HTTP 状态码与业务 code
   * 参考：https://www.prisma.io/docs/orm/reference/error-reference
   */
  private mapPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): { status: number; code: string; message: string } {
    switch (exception.code) {
      case 'P2002': // 唯一约束冲突
        return {
          status: HttpStatus.CONFLICT,
          code: 'RESOURCE_CONFLICT',
          message: '资源已存在，唯一约束冲突',
        };
      case 'P2025': { // 记录未找到
        const cause = exception.meta?.cause as string | undefined;
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'RESOURCE_NOT_FOUND',
          message: cause ?? '资源未找到',
        };
      }
      case 'P2003': // 外键约束冲突
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_VIOLATION',
          message: '外键约束冲突，关联资源不存在或被引用',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'DATABASE_ERROR',
          message: `数据库错误：${exception.code}`,
        };
    }
  }
}
