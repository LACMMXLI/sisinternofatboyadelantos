import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<AppConfig, true>);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: config.get('corsOrigins', { infer: true }),
    credentials: true,
  });

  // /health/live y /health/ready quedan fuera de /api/v1: son para el
  // orquestador (Docker/Coolify), no forman parte del contrato versionado.
  app.setGlobalPrefix('api', { exclude: ['health/live', 'health/ready'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const nodeEnv = config.get('nodeEnv', { infer: true });
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Libreta de Nóminas API')
      .setDescription(
        'API de registro de adelantos, consumos y descuentos de empleados. No calcula sueldo, ISR, IMSS ni timbrado.',
      )
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get('port', { infer: true });
  await app.listen(port);
  logger.log(
    `Libreta de Nóminas API escuchando en el puerto ${port} (${nodeEnv}).`,
  );
}

void bootstrap();
