import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Cubre la Fase 3 (§Fase 3 de IMPLEMENTATION_PLAN.md): catálogo de
 * categorías de movimiento, capacidad `category.manage` restringida a
 * OWNER_ADMIN, inmutabilidad de `direction` y protección de categorías
 * "system" contra desactivación.
 */
describe('MovementCategories (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'PruebaE2E123!';

  let orgId: string;
  let owner: { accessToken: string };
  let cashier: { accessToken: string };

  async function login(usernameOrEmail: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail, password })
      .expect(200);
    return { accessToken: res.body.accessToken as string };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api', { exclude: ['health/live', 'health/ready'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    const passwordHash = await argon2.hash(password);

    const org = await prisma.organization.create({
      data: { name: `Org Categorias ${suffix}`, slug: `org-cat-${suffix}` },
    });
    orgId = org.id;

    await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `owner.cat.${suffix}`,
        displayName: 'Owner Categorias',
        role: 'OWNER_ADMIN',
        passwordHash,
        mustChangePassword: false,
      },
    });
    await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `cashier.cat.${suffix}`,
        displayName: 'Cajero Categorias',
        role: 'CASHIER_RECORDER',
        passwordHash,
        mustChangePassword: false,
      },
    });

    owner = await login(`owner.cat.${suffix}`);
    cashier = await login(`cashier.cat.${suffix}`);
  });

  afterAll(async () => {
    await prisma.movementCategory.deleteMany({
      where: { organizationId: orgId },
    });
    await prisma.user.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await app.close();
  });

  it('el cajero puede leer el catálogo (sin capacidad especial requerida)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/movement-categories')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .expect(200);
  });

  it('el cajero no puede crear categorías (403, falta category.manage)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/movement-categories')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .send({
        code: `TEST_${suffix}`,
        label: 'Prueba',
        direction: 'CHARGE',
        iconName: 'Tag',
        colorToken: 'purple',
      })
      .expect(403);
  });

  it('el owner crea una categoría y aparece en el listado', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/movement-categories')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        code: `TEST_${suffix}`,
        label: 'Categoría de prueba',
        direction: 'CHARGE',
        iconName: 'Tag',
        colorToken: 'purple',
      })
      .expect(201);
    expect(created.body.system).toBe(false);
    expect(created.body.active).toBe(true);

    const list = await request(app.getHttpServer())
      .get('/api/v1/movement-categories')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const body = list.body as Array<{ id: string }>;
    expect(body.some((c) => c.id === created.body.id)).toBe(true);
  });

  it('rechaza un código de categoría duplicado en la misma organización (409)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/movement-categories')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        code: `TEST_${suffix}`,
        label: 'Duplicada',
        direction: 'CREDIT',
        iconName: 'Tag',
        colorToken: 'purple',
      })
      .expect(409);
  });

  it('la dirección es inmutable: enviarla en PATCH se rechaza (400, forbidNonWhitelisted)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/movement-categories')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        code: `IMMUT_${suffix}`,
        label: 'Inmutable',
        direction: 'CHARGE',
        iconName: 'Tag',
        colorToken: 'purple',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/movement-categories/${created.body.id as string}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ direction: 'CREDIT' })
      .expect(400);

    const unchanged = await request(app.getHttpServer())
      .get('/api/v1/movement-categories')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const body = unchanged.body as Array<{ id: string; direction: string }>;
    const match = body.find((c) => c.id === created.body.id);
    expect(match?.direction).toBe('CHARGE');
  });

  it('desactiva y reactiva una categoría creada por el usuario', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/movement-categories')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        code: `TOGGLE_${suffix}`,
        label: 'Alternable',
        direction: 'CHARGE',
        iconName: 'Tag',
        colorToken: 'purple',
      })
      .expect(201);

    const deactivated = await request(app.getHttpServer())
      .post(
        `/api/v1/movement-categories/${created.body.id as string}/deactivate`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);
    expect(deactivated.body.active).toBe(false);

    const activeOnly = await request(app.getHttpServer())
      .get('/api/v1/movement-categories')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const activeBody = activeOnly.body as Array<{ id: string }>;
    expect(activeBody.some((c) => c.id === created.body.id)).toBe(false);

    const withInactive = await request(app.getHttpServer())
      .get('/api/v1/movement-categories')
      .query({ includeInactive: 'true' })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const withInactiveBody = withInactive.body as Array<{ id: string }>;
    expect(withInactiveBody.some((c) => c.id === created.body.id)).toBe(true);

    const reactivated = await request(app.getHttpServer())
      .post(
        `/api/v1/movement-categories/${created.body.id as string}/reactivate`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);
    expect(reactivated.body.active).toBe(true);
  });

  it('una categoría "system" no se puede desactivar (400)', async () => {
    const systemCategory = await prisma.movementCategory.create({
      data: {
        organizationId: orgId,
        code: `SYS_${suffix}`,
        label: 'Categoría del sistema',
        direction: 'CHARGE',
        iconName: 'Tag',
        colorToken: 'danger',
        system: true,
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/movement-categories/${systemCategory.id}/deactivate`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(400);
  });
});
