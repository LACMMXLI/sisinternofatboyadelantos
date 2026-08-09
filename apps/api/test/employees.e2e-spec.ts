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
 * Cubre la Fase 3 (§Fase 3 de IMPLEMENTATION_PLAN.md): alta/edición/baja
 * lógica de empleados, sucursales múltiples, búsqueda tolerante, filtro por
 * sucursal/estado y aislamiento de alcance para el cajero.
 */
describe('Employees (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'PruebaE2E123!';

  let orgId: string;
  let branchAId: string;
  let branchBId: string;
  let owner: { accessToken: string };
  let cashierA: { accessToken: string };

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
      data: { name: `Org Empleados ${suffix}`, slug: `org-emp-${suffix}` },
    });
    orgId = org.id;

    const branchA = await prisma.branch.create({
      data: { organizationId: orgId, code: 'EA', name: 'Sucursal EA' },
    });
    const branchB = await prisma.branch.create({
      data: { organizationId: orgId, code: 'EB', name: 'Sucursal EB' },
    });
    branchAId = branchA.id;
    branchBId = branchB.id;

    await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `owner.emp.${suffix}`,
        displayName: 'Owner Empleados',
        role: 'OWNER_ADMIN',
        passwordHash,
        mustChangePassword: false,
      },
    });

    const cashierUser = await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `cashier.emp.${suffix}`,
        displayName: 'Cajero Empleados',
        role: 'CASHIER_RECORDER',
        passwordHash,
        mustChangePassword: false,
      },
    });
    await prisma.userBranch.create({
      data: { userId: cashierUser.id, branchId: branchAId },
    });

    owner = await login(`owner.emp.${suffix}`);
    cashierA = await login(`cashier.emp.${suffix}`);
  });

  afterAll(async () => {
    await prisma.employee.deleteMany({ where: { organizationId: orgId } });
    await prisma.user.deleteMany({ where: { organizationId: orgId } });
    await prisma.branch.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await app.close();
  });

  it('el cajero no puede crear empleados (403, falta employee.manage)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeNumber: `E-${suffix}-X`,
        firstName: 'Prueba',
        lastName: 'Rechazada',
        primaryBranchId: branchAId,
      })
      .expect(403);
  });

  it('el owner crea un empleado con sucursal principal y adicional', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        employeeNumber: `E-${suffix}-1`,
        firstName: 'Renata',
        lastName: 'Cifuentes',
        primaryBranchId: branchAId,
        additionalBranchIds: [branchBId],
      })
      .expect(201);

    expect(res.body.displayName).toBe('Renata Cifuentes');
    expect(res.body.primaryBranch.id).toBe(branchAId);
    expect(res.body.additionalBranches).toHaveLength(1);
  });

  it('rechaza un número de empleado duplicado en la misma organización (409)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        employeeNumber: `E-${suffix}-1`,
        firstName: 'Otra',
        lastName: 'Persona',
        primaryBranchId: branchAId,
      })
      .expect(409);
  });

  it('rechaza una sucursal que no pertenece a la organización (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        employeeNumber: `E-${suffix}-2`,
        firstName: 'Marco',
        lastName: 'Delgado',
        primaryBranchId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(400);
  });

  it('búsqueda tolerante por nombre parcial (sin distinguir mayúsculas)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/employees')
      .query({ search: 'renata' })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const body = res.body as Array<{ displayName: string }>;
    expect(body.some((e) => e.displayName === 'Renata Cifuentes')).toBe(true);
  });

  it('el cajero solo ve empleados de su(s) sucursal(es) asignada(s)', async () => {
    // Renata está en branchA (accesible) y branchB (no accesible) — visible.
    const res = await request(app.getHttpServer())
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .expect(200);
    const body = res.body as Array<{
      primaryBranch: { id: string };
      additionalBranches: { branch: { id: string } }[];
    }>;
    expect(
      body.every((e) => {
        const ids = [
          e.primaryBranch.id,
          ...e.additionalBranches.map((b) => b.branch.id),
        ];
        return ids.includes(branchAId);
      }),
    ).toBe(true);
  });

  it('el cajero no puede filtrar por una sucursal fuera de su alcance (lista vacía)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/employees')
      .query({ branchId: branchBId })
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .expect(200);
    expect(res.body).toHaveLength(0);
  });

  it('da de baja lógica y reactiva un empleado', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        employeeNumber: `E-${suffix}-3`,
        firstName: 'Iván',
        lastName: 'Ortiz',
        primaryBranchId: branchAId,
      })
      .expect(201);

    const deactivated = await request(app.getHttpServer())
      .post(`/api/v1/employees/${created.body.id as string}/deactivate`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);
    expect(deactivated.body.active).toBe(false);

    const listActiveOnly = await request(app.getHttpServer())
      .get('/api/v1/employees')
      .query({ active: 'true' })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const activeBody = listActiveOnly.body as Array<{ id: string }>;
    expect(activeBody.some((e) => e.id === created.body.id)).toBe(false);

    const reactivated = await request(app.getHttpServer())
      .post(`/api/v1/employees/${created.body.id as string}/reactivate`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);
    expect(reactivated.body.active).toBe(true);
  });
});
