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
 * Cubre la Fase 4 (§Fase 4 de IMPLEMENTATION_PLAN.md): idempotencia (mismo
 * movimiento 2 veces = un efecto), reversa mantiene historial y corrige
 * saldo, saldo parcial se arrastra, pendiente/rechazado no afecta saldo
 * confirmado, aprobación/rechazo/reemplazo y aislamiento de alcance.
 */
describe('Ledger (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'PruebaE2E123!';

  let orgId: string;
  let branchAId: string;
  let branchBId: string;
  let employeeId: string;
  let chargeCategoryId: string;
  let creditCategoryId: string;
  let approvalCategoryId: string;

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
      data: { name: `Org Ledger ${suffix}`, slug: `org-ledger-${suffix}` },
    });
    orgId = org.id;

    const branchA = await prisma.branch.create({
      data: { organizationId: orgId, code: 'LA', name: 'Sucursal LA' },
    });
    const branchB = await prisma.branch.create({
      data: { organizationId: orgId, code: 'LB', name: 'Sucursal LB' },
    });
    branchAId = branchA.id;
    branchBId = branchB.id;

    await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `owner.ledger.${suffix}`,
        displayName: 'Owner Ledger',
        role: 'OWNER_ADMIN',
        passwordHash,
        mustChangePassword: false,
      },
    });
    const cashierUser = await prisma.user.create({
      data: {
        organizationId: orgId,
        username: `cashier.ledger.${suffix}`,
        displayName: 'Cajero Ledger',
        role: 'CASHIER_RECORDER',
        passwordHash,
        mustChangePassword: false,
      },
    });
    await prisma.userBranch.create({
      data: { userId: cashierUser.id, branchId: branchAId },
    });

    const employee = await prisma.employee.create({
      data: {
        organizationId: orgId,
        employeeNumber: `LDG-${suffix}`,
        firstName: 'Ledger',
        lastName: 'Test',
        displayName: 'Ledger Test',
        primaryBranchId: branchAId,
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

    const approvalCategory = await prisma.movementCategory.create({
      data: {
        organizationId: orgId,
        code: `APR_${suffix}`,
        label: 'Requiere aprobación',
        direction: 'CHARGE',
        iconName: 'Tag',
        colorToken: 'purple',
        requiresApproval: true,
      },
    });
    approvalCategoryId = approvalCategory.id;

    owner = await login(`owner.ledger.${suffix}`);
    cashierA = await login(`cashier.ledger.${suffix}`);
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { organizationId: orgId } });
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

  it('crea un cargo (POSTED) y afecta el saldo', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeId,
        branchId: branchAId,
        categoryId: chargeCategoryId,
        amountCents: 20000,
        concept: 'Adelanto',
        idempotencyKey: `idem-${suffix}-1`,
      })
      .expect(201);
    expect(res.body.status).toBe('POSTED');
    expect(res.body.direction).toBe('CHARGE');

    const summary = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(summary.body.balanceCents).toBe(20000);
  });

  it('idempotencia: repetir la misma llave no duplica el efecto', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeId,
        branchId: branchAId,
        categoryId: chargeCategoryId,
        amountCents: 9999,
        concept: 'Repetido con otro monto',
        idempotencyKey: `idem-${suffix}-dup`,
      })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeId,
        branchId: branchAId,
        categoryId: chargeCategoryId,
        amountCents: 500000, // distinto a propósito: debe ignorarse
        concept: 'Otro concepto',
        idempotencyKey: `idem-${suffix}-dup`,
      })
      .expect(201);

    expect(second.body.id).toBe(first.body.id);
    expect(second.body.amountCents).toBe(9999);

    const list = await request(app.getHttpServer())
      .get('/api/v1/movements')
      .query({ employeeId, status: 'POSTED' })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const matches = (list.body as Array<{ idempotencyKey: string }>).filter(
      (m) => m.idempotencyKey === `idem-${suffix}-dup`,
    );
    expect(matches).toHaveLength(1);
  });

  it('saldo parcial se arrastra: un abono menor al saldo lo reduce sin llegar a cero', async () => {
    const before = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeId,
        branchId: branchAId,
        categoryId: creditCategoryId,
        amountCents: 5000,
        concept: 'Abono parcial',
        idempotencyKey: `idem-${suffix}-partial-credit`,
      })
      .expect(201);

    const after = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(after.body.balanceCents).toBe(before.body.balanceCents - 5000);
    expect(after.body.balanceCents).toBeGreaterThan(0);
  });

  it('pendiente de aprobación no afecta el saldo confirmado', async () => {
    const before = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const pending = await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeId,
        branchId: branchAId,
        categoryId: approvalCategoryId,
        amountCents: 3000,
        concept: 'Requiere aprobación',
        idempotencyKey: `idem-${suffix}-pending-1`,
      })
      .expect(201);
    expect(pending.body.status).toBe('PENDING_APPROVAL');

    const after = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(after.body.balanceCents).toBe(before.body.balanceCents);
    expect(after.body.pendingApprovalCents).toBe(3000);
  });

  it('el cajero no puede aprobar (403, falta movement.approve)', async () => {
    const pending = await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeId,
        branchId: branchAId,
        categoryId: approvalCategoryId,
        amountCents: 1500,
        concept: 'Otra pendiente',
        idempotencyKey: `idem-${suffix}-pending-forbidden`,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/movements/${pending.body.id as string}/approve`)
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .expect(403);
  });

  it('rechazado no afecta el saldo confirmado', async () => {
    const before = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const pending = await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeId,
        branchId: branchAId,
        categoryId: approvalCategoryId,
        amountCents: 4200,
        concept: 'Para rechazar',
        idempotencyKey: `idem-${suffix}-to-reject`,
      })
      .expect(201);

    const rejected = await request(app.getHttpServer())
      .post(`/api/v1/movements/${pending.body.id as string}/reject`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ reason: 'Monto incorrecto' })
      .expect(201);
    expect(rejected.body.status).toBe('REJECTED');

    const after = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(after.body.balanceCents).toBe(before.body.balanceCents);
    // Relativo a `before` (no un 0 absoluto): la prueba anterior deja a
    // propósito un movimiento PENDING_APPROVAL sin resolver para probar el
    // 403 del cajero, así que puede haber pendientes previos en la cuenta.
    expect(after.body.pendingApprovalCents).toBe(
      before.body.pendingApprovalCents,
    );
  });

  it('aprobar aplica el efecto al saldo; revertir lo corrige y conserva el historial', async () => {
    const before = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const pending = await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeId,
        branchId: branchAId,
        categoryId: approvalCategoryId,
        amountCents: 4000,
        concept: 'Para aprobar y revertir',
        idempotencyKey: `idem-${suffix}-approve-reverse`,
      })
      .expect(201);

    const approved = await request(app.getHttpServer())
      .post(`/api/v1/movements/${pending.body.id as string}/approve`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);
    expect(approved.body.status).toBe('POSTED');

    const afterApprove = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(afterApprove.body.balanceCents).toBe(
      before.body.balanceCents + 4000,
    );

    const reversed = await request(app.getHttpServer())
      .post(`/api/v1/movements/${pending.body.id as string}/reverse`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ reason: 'Se registró por error' })
      .expect(201);
    expect(reversed.body.status).toBe('REVERSED');
    expect(reversed.body.id).toBe(pending.body.id);

    const afterReverse = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(afterReverse.body.balanceCents).toBe(before.body.balanceCents);

    // El historial se conserva: el original sigue existiendo con estado REVERSED.
    const list = await request(app.getHttpServer())
      .get('/api/v1/movements')
      .query({ employeeId, status: 'REVERSED' })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const stillThere = (list.body as Array<{ id: string }>).some(
      (m) => m.id === pending.body.id,
    );
    expect(stillThere).toBe(true);

    // Revertir dos veces no duplica: el segundo intento se rechaza porque ya no está POSTED.
    await request(app.getHttpServer())
      .post(`/api/v1/movements/${pending.body.id as string}/reverse`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ reason: 'Segundo intento' })
      .expect(400);
  });

  it('reemplaza un movimiento POSTED: corrige el saldo y enlaza el original', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeId,
        branchId: branchAId,
        categoryId: chargeCategoryId,
        amountCents: 10000,
        concept: 'Monto a corregir',
        idempotencyKey: `idem-${suffix}-to-replace`,
      })
      .expect(201);

    const before = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const replaced = await request(app.getHttpServer())
      .post(`/api/v1/movements/${created.body.id as string}/replace`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        reason: 'Monto correcto era otro',
        categoryId: chargeCategoryId,
        amountCents: 12000,
        concept: 'Monto corregido',
        idempotencyKey: `idem-${suffix}-replacement`,
      })
      .expect(201);
    expect(replaced.body.original.status).toBe('REVERSED');
    expect(replaced.body.replacement.status).toBe('POSTED');
    expect(replaced.body.replacement.originalMovementId).toBe(created.body.id);
    expect(replaced.body.replacement.amountCents).toBe(12000);

    const after = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeId}/ledger/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(after.body.balanceCents).toBe(before.body.balanceCents + 2000);
  });

  it('el cajero no puede registrar un movimiento fuera de su alcance de sucursal (403)', async () => {
    // El empleado sí pertenece a branchB (sucursal adicional) — así el 403
    // prueba específicamente el alcance del cajero, no un 400 por sucursal
    // ajena al empleado.
    await prisma.employeeBranch.create({
      data: { employeeId, branchId: branchBId },
    });

    await request(app.getHttpServer())
      .post('/api/v1/movements')
      .set('Authorization', `Bearer ${cashierA.accessToken}`)
      .send({
        employeeId,
        branchId: branchBId,
        categoryId: chargeCategoryId,
        amountCents: 1000,
        concept: 'Fuera de alcance',
        idempotencyKey: `idem-${suffix}-out-of-scope`,
      })
      .expect(403);
  });

  it('autoservicio: sin empleado vinculado, /employees/me/ledger responde 404', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/employees/me/ledger')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(404);
  });
});
