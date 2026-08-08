import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma como provider de Nest. El servidor es la fuente de verdad
 * (§9): todo acceso a datos pasa por aquí, nunca se instancia PrismaClient
 * fuera de este servicio.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'warn', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conexión a PostgreSQL establecida.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
