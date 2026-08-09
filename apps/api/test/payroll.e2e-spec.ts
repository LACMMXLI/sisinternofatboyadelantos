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
 * Cubre la Fase 5 (§Fase 5 de IMPLEMENTATION_PLAN.md): aplicación parcial
 * arrastra el resto, dos aplicaciones simultáneas no sobregiran el lote,
 * reapertura solo con permiso elevado + motivo + auditoría.
 */
describe('Payroll (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'PruebaE2E123!';

  let orgId: string;
  let branchId: string;
  let employeeId: string;
  let chargeCategoryId: string;

  let owner: { accessToken: string };
  let cashier: { accessToken: string };

  async function login(usernameOrEmail: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail, password })
      .expect(200);
    return { accessToken: res.body.accessToken as string };
  }

  async function createChargeMovement(amountCents: number, key: string) {
    return request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        employeeId,
        branchId,
        categoryId: chargeCategoryId,
        amountCents,
        concept: 'Adelanto',
        idempotencyKey: key,
      })
      .expect(201);
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
      data: { name: `Org Payroll ${suffix}`, slug: `org-payroll-${suffix}` },
    });
    orgId = org.id;

    const branch = await prisma.branch.create({
      data: { organizationId: orgId, code: 'PA', name: 'Sucursal PA' },
    });
    branchId = branch.id;

    await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `owner.payroll.${suffix}`,
        displayName: 'Owner Payroll',
        role: 'OWNER_ADMIN',
        passwordHash,
        mustChangePassword: false,
      },
    });
    const cashierUser = await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `cashier.payroll.${suffix}`,
        displayName: 'Cajero Payroll',
        role: 'CASHIER_RECORDER',
        passwordHash,
        mustChangePassword: false,
      },
    });
    await prisma.userBranch.create({
      data: { userId: cashierUser.id, branchId },
    });

    const employee = await prisma.employee.create({
      data: {
        organizationId: orgId,
        employeeNumber: `PAY-${suffix}`,
        firstName: 'Payroll',
        lastName: 'Test',
        displayName: 'Payroll Test',
        primaryBranchId: branchId,
      },
    });
    employeeId = employee.id;

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

    // Categoría del sistema requerida por PayrollBatchesService.apply().
    await prisma.movementCategory.create({
      data: {
        organizationId: orgId,
        code: 'PAYROLL_DEDUCTION',
        label: 'Aplicado en nómina',
        direction: 'CREDIT',
        iconName: 'Receipt',
        colorToken: 'brand-800',
        system: true,
      },
    });

    owner = await login(`owner.payroll.${suffix}`);
    cashier = await login(`cashier.payroll.${suffix}`);
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { organizationId: orgId } });
    await prisma.settlementAllocation.deleteMany({
      where: { batch: { organizationId: orgId } },
    });
    await prisma.payrollBatchItem.deleteMany({
      where: { batch: { organizationId: orgId } },
    });
    await prisma.payrollBatch.deleteMany({ where: { organizationId: orgId } });
    await prisma.payrollPeriod.deleteMany({ where: { organizationId: orgId } });
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

  it('el cajero no puede crear periodos (403, falta payroll.prepare)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/payroll-periods')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .send({
        frequency: 'WEEKLY',
        startsAt: '2026-01-05T00:00:00.000Z',
        endsAt: '2026-01-12T00:00:00.000Z',
        payDate: '2026-01-13T00:00:00.000Z',
      })
      .expect(403);
  });

  it('aplicación parcial arrastra el resto; reapertura restaura el saldo con motivo y queda auditada', async () => {
    await createChargeMovement(10000, `idem-${suffix}-charge-1`);

    const period = await request(app.getHttpServer())
      .post('/api/v1/payroll-periods')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        frequency: 'WEEKLY',
        startsAt: '2026-02-02T00:00:00.000Z',
        endsAt: '2026-02-09T00:00:00.000Z',
        payDate: '2026-02-10T00:00:00.000Z',
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post('/api/v1/payroll-batches')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ periodId: period.body.id })
      .expect(201);

    const item = (
      batch.body.items as Array<{
        id: string;
        employeeId: string;
        balanceAtPrepCents: number;
      }>
    ).find((i) => i.employeeId === employeeId);
    expect(item).toBeDefined();
    expect(item?.balanceAtPrepCents).toBe(10000);

    // Aplicación parcial: solo 6000 de los 10000.
    await request(app.getHttpServer())
      .patch(
        `/api/v1/payroll-batches/${batch.body.id as string}/items/${item?.id as string}`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ plannedAmountCents: 6000 })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payroll-batches/${batch.body.id as string}/submit`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/payroll-batches/${batch.body.id as string}/lock`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);

    const applied = await request(app.getHttpServer())
      .post(`/api/v1/payroll-batches/${batch.body.id as string}/apply`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);
    expect(applied.body.status).toBe('APPLIED');
    expect(applied.body.totalAppliedCents).toBe(6000);

    const summaryAfterApply = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    // 10000 - 6000 aplicados = 4000 se arrastra, no llega a cero.
    expect(summaryAfterApply.body.balanceCents).toBe(4000);

    // El cajero no puede cerrar (403) ni reabrir (403): falta payroll.close/reopen.
    await request(app.getHttpServer())
      .post(`/api/v1/payroll-batches/${batch.body.id as string}/close`)
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/payroll-batches/${batch.body.id as string}/close`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/payroll-batches/${batch.body.id as string}/reopen`)
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .send({ reason: 'Intento no autorizado' })
      .expect(403);

    const reopened = await request(app.getHttpServer())
      .post(`/api/v1/payroll-batches/${batch.body.id as string}/reopen`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ reason: 'Monto incorrecto, se debe corregir' })
      .expect(201);
    expect(reopened.body.status).toBe('REOPENED');
    expect(reopened.body.reopenReason).toBe(
      'Monto incorrecto, se debe corregir',
    );

    const summaryAfterReopen = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    // El crédito de nómina se revierte: el saldo vuelve a los 10000 originales.
    expect(summaryAfterReopen.body.balanceCents).toBe(10000);

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        organizationId: orgId,
        action: 'payroll.reopen',
        entityId: batch.body.id as string,
      },
    });
    expect(auditEntry).not.toBeNull();
    expect(auditEntry?.reason).toBe('Monto incorrecto, se debe corregir');
  });

  it('dos aplicaciones simultáneas del mismo lote no lo sobregiran (solo una gana)', async () => {
    await createChargeMovement(5000, `idem-${suffix}-charge-2`);

    const period = await request(app.getHttpServer())
      .post('/api/v1/payroll-periods')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        frequency: 'WEEKLY',
        startsAt: '2026-03-02T00:00:00.000Z',
        endsAt: '2026-03-09T00:00:00.000Z',
        payDate: '2026-03-10T00:00:00.000Z',
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post('/api/v1/payroll-batches')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ periodId: period.body.id })
      .expect(201);
    const plannedCents = batch.body.totalPlannedCents as number;

    await request(app.getHttpServer())
      .post(`/api/v1/payroll-batches/${batch.body.id as string}/submit`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/payroll-batches/${batch.body.id as string}/lock`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/v1/payroll-batches/${batch.body.id as string}/apply`)
        .set('Authorization', `Bearer ${owner.accessToken}`),
      request(app.getHttpServer())
        .post(`/api/v1/payroll-batches/${batch.body.id as string}/apply`)
        .set('Authorization', `Bearer ${owner.accessToken}`),
    ]);

    // Exactamente una request gana (201). La otra se rechaza — 409 si llegó
    // a competir por el reclamo atómico dentro de la transacción, o 400 si
    // el proceso ya alcanzó a resolver la primera antes de que la segunda
    // hiciera su propio chequeo de estado (Node no es verdaderamente
    // concurrente; ambos casos son un rechazo correcto). Lo que realmente
    // importa —que no se aplique doble— se verifica abajo con
    // `totalAppliedCents` y con que solo exista un `LedgerMovement`.
    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses[0]).toBe(201);
    expect(statuses[1]).toBeGreaterThanOrEqual(400);

    const movements = await prisma.ledgerMovement.findMany({
      where: {
        idempotencyKey: { startsWith: `payroll:${batch.body.id as string}` },
      },
    });
    expect(movements).toHaveLength(1);

    const finalBatch = await request(app.getHttpServer())
      .get(`/api/v1/payroll-batches/${batch.body.id as string}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(finalBatch.body.status).toBe('APPLIED');
    // Si se hubiera aplicado dos veces, sería el doble de lo planeado.
    expect(finalBatch.body.totalAppliedCents).toBe(plannedCents);
  });
});
