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
 * Cubre la Fase 8 (§Fase 8 de IMPLEMENTATION_PLAN.md): reportes de
 * movimientos con filtros y totales, reporte de saldos, exportación CSV
 * saneada contra inyección de fórmulas, y alcance por sucursal.
 */
describe('Reports (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'PruebaE2E123!';

  let orgId: string;
  let branchAId: string;
  let branchBId: string;
  let employeeAId: string;
  let chargeCategoryId: string;
  let creditCategoryId: string;

  let owner: { accessToken: string };
  let cashier: { accessToken: string };
  let branchManagerA: { accessToken: string };

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
      data: { name: `Org Reports ${suffix}`, slug: `org-reports-${suffix}` },
    });
    orgId = org.id;

    const branchA = await prisma.branch.create({
      data: { organizationId: orgId, code: 'RA', name: 'Sucursal RA' },
    });
    const branchB = await prisma.branch.create({
      data: { organizationId: orgId, code: 'RB', name: 'Sucursal RB' },
    });
    branchAId = branchA.id;
    branchBId = branchB.id;

    await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `owner.reports.${suffix}`,
        displayName: 'Owner Reports',
        role: 'OWNER_ADMIN',
        passwordHash,
        mustChangePassword: false,
      },
    });
    await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `cashier.reports.${suffix}`,
        displayName: 'Cajero Reports',
        role: 'CASHIER_RECORDER',
        passwordHash,
        mustChangePassword: false,
      },
    });
    const bmUser = await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `bm.reports.${suffix}`,
        displayName: 'Encargado RA',
        role: 'BRANCH_MANAGER',
        passwordHash,
        mustChangePassword: false,
      },
    });
    await prisma.userBranch.create({
      data: { userId: bmUser.id, branchId: branchAId },
    });

    const employeeA = await prisma.employee.create({
      data: {
        organizationId: orgId,
        employeeNumber: `RPT-${suffix}`,
        firstName: 'Reporte',
        lastName: 'Test',
        displayName: 'Reporte Test',
        primaryBranchId: branchAId,
      },
    });
    employeeAId = employeeA.id;

    const chargeCategory = await prisma.movementCategory.create({
      data: {
        organizationId: orgId,
        code: `CHG_${suffix}`,
        label: 'Cargo de prueba',
        direction: 'CHARGE',
        iconName: 'Tag',
        colorToken: 'danger',
      },
    });
    chargeCategoryId = chargeCategory.id;

    const creditCategory = await prisma.movementCategory.create({
      data: {
        organizationId: orgId,
        code: `CRD_${suffix}`,
        label: 'Abono de prueba',
        direction: 'CREDIT',
        iconName: 'Undo2',
        colorToken: 'success',
      },
    });
    creditCategoryId = creditCategory.id;

    owner = await login(`owner.reports.${suffix}`);
    cashier = await login(`cashier.reports.${suffix}`);
    branchManagerA = await login(`bm.reports.${suffix}`);
  });

  afterAll(async () => {
    await prisma.ledgerMovement.deleteMany({
      where: { organizationId: orgId },
    });
    await prisma.movementCategory.deleteMany({
      where: { organizationId: orgId },
    });
    await prisma.employee.deleteMany({ where: { organizationId: orgId } });
    await prisma.user.deleteMany({ where: { organizationId: orgId } });
    await prisma.branch.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await app.close();
  });

  it('el cajero no puede consultar reportes (403, falta report.read)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/reports/movements')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/reports/balances')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/reports/movements/export.csv')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .expect(403);
  });

  it('lista movimientos con totales correctos y saldo agregado', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        employeeId: employeeAId,
        branchId: branchAId,
        categoryId: chargeCategoryId,
        amountCents: 30000,
        concept: 'Adelanto de prueba',
        idempotencyKey: `idem-${suffix}-charge`,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        employeeId: employeeAId,
        branchId: branchAId,
        categoryId: creditCategoryId,
        amountCents: 10000,
        concept: 'Abono de prueba',
        idempotencyKey: `idem-${suffix}-credit`,
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/movements')
      .query({ employeeId: employeeAId })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(res.body.items).toHaveLength(2);
    expect(res.body.totals.chargeCents).toBe(30000);
    expect(res.body.totals.creditCents).toBe(10000);
    expect(res.body.totals.netCents).toBe(20000);

    const balances = await request(app.getHttpServer())
      .get('/api/v1/reports/balances')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const employeeBalance = (
      balances.body as Array<{ employeeId: string; balanceCents: number }>
    ).find((b) => b.employeeId === employeeAId);
    expect(employeeBalance?.balanceCents).toBe(20000);
  });

  it('exporta CSV saneado contra inyección de fórmulas', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        employeeId: employeeAId,
        branchId: branchAId,
        categoryId: chargeCategoryId,
        amountCents: 500,
        concept: '=SUM(A1:A10)',
        idempotencyKey: `idem-${suffix}-injection`,
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/movements/export.csv')
      .query({ employeeId: employeeAId })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    // Content-Type text/csv hace que supertest lo guarde como texto (res.text),
    // no como Buffer en res.body.
    const csv = res.text;
    expect(csv).toContain("'=SUM(A1:A10)");
    expect(csv).not.toContain('\n=SUM(A1:A10)');
  });

  it('el encargado de sucursal solo ve movimientos/saldos de su sucursal', async () => {
    const employeeB = await prisma.employee.create({
      data: {
        organizationId: orgId,
        employeeNumber: `RPT2-${suffix}`,
        firstName: 'Otra',
        lastName: 'Sucursal',
        displayName: 'Otra Sucursal',
        primaryBranchId: branchBId,
      },
    });
    await prisma.ledgerMovement.create({
      data: {
        organizationId: orgId,
        branchId: branchBId,
        employeeId: employeeB.id,
        categoryId: chargeCategoryId,
        direction: 'CHARGE',
        amountCents: 7000,
        concept: 'Fuera de alcance',
        occurredAt: new Date(),
        status: 'POSTED',
        createdByUserId: (
          await prisma.user.findFirstOrThrow({
            where: { username: `owner.reports.${suffix}` },
          })
        ).id,
        idempotencyKey: `idem-${suffix}-other-branch`,
      },
    });

    const movements = await request(app.getHttpServer())
      .get('/api/v1/reports/movements')
      .query({ branchId: branchBId })
      .set('Authorization', `Bearer ${branchManagerA.accessToken}`)
      .expect(200);
    expect(movements.body.items).toHaveLength(0);

    const balances = await request(app.getHttpServer())
      .get('/api/v1/reports/balances')
      .set('Authorization', `Bearer ${branchManagerA.accessToken}`)
      .expect(200);
    const ids = (balances.body as Array<{ employeeId: string }>).map(
      (b) => b.employeeId,
    );
    expect(ids).not.toContain(employeeB.id);
  });
});
