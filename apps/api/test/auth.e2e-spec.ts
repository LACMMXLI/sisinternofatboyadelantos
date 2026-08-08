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
 * Cubre §5 y §13 del prompt maestro: login real, RBAC por capacidad,
 * aislamiento de sucursal y de organización, y rotación/revocación de
 * refresh tokens. Los fixtures se crean con un sufijo único y se limpian
 * en `afterAll` para no ensuciar el seed de desarrollo.
 *
 * Los logins se concentran en `beforeAll` y se reutilizan entre pruebas de
 * solo-lectura para no chocar con el rate limit de /auth/login (8/min) —
 * ese límite es una característica de seguridad real, no algo a debilitar
 * solo para que los tests pasen.
 */
describe('Auth + RBAC (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'PruebaE2E123!';
  let orgAId: string;
  let orgBId: string;
  let branchAId: string;
  let ownerAUsername: string;
  let cashierAUsername: string;
  let ownerBUsername: string;

  let ownerA: { accessToken: string; cookie: string };
  let cashierA: { accessToken: string; cookie: string };
  let ownerB: { accessToken: string; cookie: string };

  async function login(usernameOrEmail: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail, password })
      .expect(200);
    const setCookie = res.headers['set-cookie'];
    const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    return {
      accessToken: res.body.accessToken as string,
      cookie: cookie as string,
    };
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

    const orgA = await prisma.organization.create({
      data: { name: `Org A ${suffix}`, slug: `org-a-${suffix}` },
    });
    const orgB = await prisma.organization.create({
      data: { name: `Org B ${suffix}`, slug: `org-b-${suffix}` },
    });
    orgAId = orgA.id;
    orgBId = orgB.id;

    const branchA = await prisma.branch.create({
      data: { organizationId: orgAId, code: 'A1', name: 'Sucursal A1' },
    });
    await prisma.branch.create({
      data: { organizationId: orgAId, code: 'A2', name: 'Sucursal A2' },
    });
    branchAId = branchA.id;

    ownerAUsername = `owner.a.${suffix}`;
    cashierAUsername = `cashier.a.${suffix}`;
    ownerBUsername = `owner.b.${suffix}`;

    await prisma.user.create({
      data: {
        organizationId: orgAId,
        username: ownerAUsername,
        displayName: 'Owner A',
        role: 'OWNER_ADMIN',
        passwordHash,
        mustChangePassword: false,
      },
    });

    const cashierUser = await prisma.user.create({
      data: {
        organizationId: orgAId,
        username: cashierAUsername,
        displayName: 'Cashier A',
        role: 'CASHIER_RECORDER',
        passwordHash,
        mustChangePassword: false,
      },
    });
    await prisma.userBranch.create({
      data: { userId: cashierUser.id, branchId: branchAId },
    });

    await prisma.user.create({
      data: {
        organizationId: orgBId,
        username: ownerBUsername,
        displayName: 'Owner B',
        role: 'OWNER_ADMIN',
        passwordHash,
        mustChangePassword: false,
      },
    });

    // Un único login por usuario, reutilizado en las pruebas de solo lectura.
    ownerA = await login(ownerAUsername);
    cashierA = await login(cashierAUsername);
    ownerB = await login(ownerBUsername);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.branch.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [orgAId, orgBId] } },
    });
    await app.close();
  });

  it('rechaza credenciales incorrectas con mensaje genérico', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: ownerAUsername, password: 'incorrecta' })
      .expect(401);
    expect(res.body.message).toBe('Usuario o contraseña incorrectos.');
  });

  it('expone el rol y la organización correctos en /auth/me', async () => {
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${ownerA.accessToken}`)
      .expect(200);
    expect(me.body.role).toBe('OWNER_ADMIN');
    expect(me.body.organizationId).toBe(orgAId);
  });

  it('rechaza requests sin token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('el cajero no puede listar usuarios (403, falta capacidad user.manage)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .expect(403);
  });

  it('el cajero solo ve las sucursales que tiene asignadas', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/branches')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(branchAId);
  });

  it('el owner ve todas las sucursales de su organización (alcance total)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/branches')
      .set('Authorization', `Bearer ${ownerA.accessToken}`)
      .expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('aísla organizaciones: el owner de B no ve el negocio de A ni sus sucursales', async () => {
    const org = await request(app.getHttpServer())
      .get('/api/v1/organizations/current')
      .set('Authorization', `Bearer ${ownerB.accessToken}`)
      .expect(200);
    expect(org.body.id).toBe(orgBId);
    expect(org.body.id).not.toBe(orgAId);

    const branches = await request(app.getHttpServer())
      .get('/api/v1/branches')
      .set('Authorization', `Bearer ${ownerB.accessToken}`)
      .expect(200);
    expect(branches.body).toHaveLength(0);
  });

  it('rota el refresh token y revoca el anterior; logout invalida la sesión', async () => {
    const refreshed = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', ownerA.cookie)
      .expect(200);
    const newCookie = refreshed.headers['set-cookie'];
    const rotatedCookie = (
      Array.isArray(newCookie) ? newCookie[0] : newCookie
    ) as string;

    // El token viejo ya no sirve (fue revocado en la rotación).
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', ownerA.cookie)
      .expect(401);

    // El nuevo token sí sirve.
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotatedCookie)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', rotatedCookie)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotatedCookie)
      .expect(401);
  });
});
