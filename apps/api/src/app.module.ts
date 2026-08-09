import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CapabilityGuard } from './common/guards/capability.guard';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { BranchesModule } from './branches/branches.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { MovementCategoriesModule } from './movement-categories/movement-categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    BranchesModule,
    UsersModule,
    EmployeesModule,
    MovementCategoriesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Orden importa: primero autentica (JwtAuthGuard), luego autoriza por
    // capacidad (CapabilityGuard). @Public() se evalúa dentro de ambos.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CapabilityGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
