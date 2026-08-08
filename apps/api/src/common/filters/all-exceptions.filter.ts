import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  requestId?: string;
}

/**
 * Filtro global de excepciones (§9, §11). Respuesta consistente en todos los
 * endpoints, sin exponer detalles internos ni secretos en el mensaje.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, code, message, fieldErrors } =
      this.resolveError(exception);

    const body: ApiErrorBody = {
      statusCode,
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
      requestId: request.requestId,
    };

    if (statusCode >= 500) {
      this.logger.error(
        `[${request.requestId}] ${request.method} ${request.url} -> ${statusCode} ${code}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json(body);
  }

  private resolveError(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const payloadObj = this.isRecord(payload) ? payload : undefined;
      const rawMessage = payloadObj?.message;
      const fieldErrors = this.extractFieldErrors(rawMessage);
      const rawCode = payloadObj?.code;

      return {
        statusCode: status,
        code:
          typeof rawCode === 'string' ? rawCode : this.defaultCodeFor(status),
        message:
          this.extractMessage(rawMessage) ??
          exception.message ??
          'Ocurrió un error.',
        fieldErrors,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message:
        'Ocurrió un error inesperado. Intenta de nuevo en unos momentos.',
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private extractMessage(rawMessage: unknown): string | undefined {
    if (typeof rawMessage === 'string') return rawMessage;
    if (Array.isArray(rawMessage)) {
      const first = (rawMessage as unknown[]).find(
        (m): m is string => typeof m === 'string',
      );
      return first;
    }
    return undefined;
  }

  private extractFieldErrors(
    rawMessage: unknown,
  ): Record<string, string> | undefined {
    if (!Array.isArray(rawMessage)) return undefined;
    const entries = (rawMessage as unknown[])
      .filter((m): m is string => typeof m === 'string')
      .map((m) => {
        const [field, ...rest] = m.split(' ');
        return [field, rest.join(' ') || m] as const;
      });
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  private defaultCodeFor(status: number): string {
    const knownCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    };
    return knownCodes[status] ?? 'INTERNAL_ERROR';
  }
}
