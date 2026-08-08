/**
 * Seed de DESARROLLO, idempotente (§17). Nunca se ejecuta automáticamente
 * en producción — solo vía `pnpm --filter api run seed`.
 *
 * Crea: negocio demo "Fatboy", 3 sucursales (Venecia, San Marcos,
 * Américas), un usuario por rol con contraseña temporal. Los empleados,
 * categorías y movimientos de ejemplo se agregan en las fases 3 y 4.
 */
import { PrismaClient, type Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEMO_USERS: Array<{ username: string; displayName: string; role: Role; branches: string[] }> = [
  { username: 'owner', displayName: 'Alonso', role: 'OWNER_ADMIN', branches: [] },
  {
    username: 'nomina',
    displayName: 'Encargada de Nómina',
    role: 'PAYROLL_MANAGER',
    branches: ['VEN', 'SMC', 'AME'],
  },
  {
    username: 'gerente',
    displayName: 'Gerente General',
    role: 'GENERAL_MANAGER',
    branches: ['VEN', 'SMC', 'AME'],
  },
  {
    username: 'encargado.venecia',
    displayName: 'Encargado Venecia',
    role: 'BRANCH_MANAGER',
    branches: ['VEN'],
  },
  { username: 'cajero.venecia', displayName: 'Cajero Venecia', role: 'CASHIER_RECORDER', branches: ['VEN'] },
];

const TEMP_PASSWORD = 'CambiaEsto123!';

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'fatboy' },
    update: {},
    create: {
      name: 'Fatboy',
      slug: 'fatboy',
      currency: 'MXN',
      timezone: 'America/Tijuana',
      primaryColor: '#0F67E8',
    },
  });

  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: { organizationId: org.id },
  });

  const branchDefs = [
    { code: 'VEN', name: 'Venecia' },
    { code: 'SMC', name: 'San Marcos' },
    { code: 'AME', name: 'Américas' },
  ];

  const branchByCode = new Map<string, { id: string }>();
  for (const b of branchDefs) {
    const branch = await prisma.branch.upsert({
      where: { organizationId_code: { organizationId: org.id, code: b.code } },
      update: {},
      create: { organizationId: org.id, code: b.code, name: b.name },
    });
    branchByCode.set(b.code, branch);
  }

  const passwordHash = await argon2.hash(TEMP_PASSWORD);

  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { organizationId_username: { organizationId: org.id, username: u.username } },
      update: {},
      create: {
        organizationId: org.id,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        passwordHash,
        mustChangePassword: true,
      },
    });

    for (const code of u.branches) {
      const branch = branchByCode.get(code);
      if (!branch) continue;
      await prisma.userBranch.upsert({
        where: { userId_branchId: { userId: user.id, branchId: branch.id } },
        update: {},
        create: { userId: user.id, branchId: branch.id },
      });
    }
  }

  console.log('Seed de desarrollo aplicado.');
  console.log(`Negocio: ${org.name} (${org.slug})`);
  console.log('Usuarios de prueba (contraseña temporal para todos):', TEMP_PASSWORD);
  for (const u of DEMO_USERS) {
    console.log(`  - ${u.username} (${u.role})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
