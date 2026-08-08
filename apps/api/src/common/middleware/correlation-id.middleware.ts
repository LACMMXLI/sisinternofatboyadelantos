import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-request-id';

declare module 'express' {
  interface Request {
    requestId: string;
  }
}

/**
 * Identificador de correlación por request (§9). Se reutiliza el header
 * entrante si el cliente/proxy ya lo trae, o se genera uno nuevo. Se expone
 * en la respuesta y se adjunta a logs/errores/auditoría.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.header(CORRELATION_ID_HEADER);
    const requestId =
      incoming && incoming.trim().length > 0 ? incoming : randomUUID();
    req.requestId = requestId;
    res.setHeader(CORRELATION_ID_HEADER, requestId);
    next();
  }
}
