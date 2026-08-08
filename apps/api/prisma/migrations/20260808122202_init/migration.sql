-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER_ADMIN', 'PAYROLL_MANAGER', 'GENERAL_MANAGER', 'BRANCH_MANAGER', 'CASHIER_RECORDER', 'EMPLOYEE_SELF_SERVICE');

-- CreateEnum
CREATE TYPE "MovementDirection" AS ENUM ('CHARGE', 'CREDIT');

-- CreateEnum
CREATE TYPE "MovementStatus" AS ENUM ('PENDING_APPROVAL', 'POSTED', 'REVERSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MovementSource" AS ENUM ('WEB', 'PWA_OFFLINE', 'PAYROLL', 'IMPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AcknowledgementStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESPONDED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "PayrollPeriodFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY');

-- CreateEnum
CREATE TYPE "PayrollPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "PayrollBatchStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'LOCKED', 'APPLIED', 'CLOSED', 'REOPENED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoObjectKey" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "timezone" TEXT NOT NULL DEFAULT 'America/Tijuana',
    "primaryColor" TEXT NOT NULL DEFAULT '#0F67E8',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "pinHash" TEXT,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_branches" (
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "user_branches_pkey" PRIMARY KEY ("userId","branchId")
);

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "ipSummary" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "photoObjectKey" TEXT,
    "hireDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "primaryBranchId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_branches" (
    "employeeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "employee_branches_pkey" PRIMARY KEY ("employeeId","branchId")
);

-- CreateTable
CREATE TABLE "movement_categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "direction" "MovementDirection" NOT NULL,
    "iconName" TEXT NOT NULL,
    "colorToken" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "requiresNote" BOOLEAN NOT NULL DEFAULT false,
    "requiresEvidence" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalThresholdCents" INTEGER,
    "dailyLimitCents" INTEGER,
    "weeklyLimitCents" INTEGER,
    "maxPerMovementCents" INTEGER,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movement_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_movements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "direction" "MovementDirection" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "concept" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Tijuana',
    "status" "MovementStatus" NOT NULL DEFAULT 'POSTED',
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "source" "MovementSource" NOT NULL DEFAULT 'WEB',
    "originalMovementId" TEXT,
    "reversalReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_attachments" (
    "id" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movement_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_acknowledgements" (
    "id" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "AcknowledgementStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movement_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_disputes" (
    "id" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "comment" TEXT NOT NULL,
    "response" TEXT,
    "respondedByUserId" TEXT,
    "respondedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movement_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "frequency" "PayrollPeriodFrequency" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "payDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Tijuana',
    "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_batches" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "branchId" TEXT,
    "status" "PayrollBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "reopenReason" TEXT,
    "totalPlannedCents" INTEGER NOT NULL DEFAULT 0,
    "totalAppliedCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_batch_items" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "ledgerMovementId" TEXT,
    "balanceAtPrepCents" INTEGER NOT NULL,
    "plannedAmountCents" INTEGER NOT NULL,
    "appliedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "balanceAfterCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_batch_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_allocations" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sourceMovementId" TEXT NOT NULL,
    "creditMovementId" TEXT NOT NULL,
    "allocatedCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "linkPath" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "branchId" TEXT,
    "requestId" TEXT,
    "reason" TEXT,
    "beforeSnapshot" JSONB,
    "afterSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "weekStartsOn" INTEGER NOT NULL DEFAULT 1,
    "payrollFrequency" "PayrollPeriodFrequency" NOT NULL DEFAULT 'WEEKLY',
    "payrollCutoffDay" INTEGER NOT NULL DEFAULT 5,
    "correctionWindowMinutes" INTEGER NOT NULL DEFAULT 15,
    "approvalThresholdCents" INTEGER NOT NULL DEFAULT 100000,
    "acknowledgementRequired" BOOLEAN NOT NULL DEFAULT false,
    "offlineEnabled" BOOLEAN NOT NULL DEFAULT true,
    "fileRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "maxUploadMb" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "branches_organizationId_idx" ON "branches"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "branches_organizationId_code_key" ON "branches"("organizationId", "code");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "users_organizationId_username_key" ON "users"("organizationId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_tokenHash_key" ON "refresh_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_sessions_userId_idx" ON "refresh_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_organizationId_idx" ON "employees"("organizationId");

-- CreateIndex
CREATE INDEX "employees_organizationId_primaryBranchId_idx" ON "employees"("organizationId", "primaryBranchId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organizationId_employeeNumber_key" ON "employees"("organizationId", "employeeNumber");

-- CreateIndex
CREATE INDEX "movement_categories_organizationId_idx" ON "movement_categories"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "movement_categories_organizationId_code_key" ON "movement_categories"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ledger_movements_organizationId_employeeId_occurredAt_idx" ON "ledger_movements"("organizationId", "employeeId", "occurredAt");

-- CreateIndex
CREATE INDEX "ledger_movements_organizationId_branchId_occurredAt_idx" ON "ledger_movements"("organizationId", "branchId", "occurredAt");

-- CreateIndex
CREATE INDEX "ledger_movements_organizationId_status_idx" ON "ledger_movements"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ledger_movements_organizationId_categoryId_idx" ON "ledger_movements"("organizationId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_movements_organizationId_idempotencyKey_key" ON "ledger_movements"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "movement_attachments_movementId_idx" ON "movement_attachments"("movementId");

-- CreateIndex
CREATE UNIQUE INDEX "movement_acknowledgements_movementId_key" ON "movement_acknowledgements"("movementId");

-- CreateIndex
CREATE INDEX "movement_disputes_movementId_idx" ON "movement_disputes"("movementId");

-- CreateIndex
CREATE INDEX "movement_disputes_employeeId_idx" ON "movement_disputes"("employeeId");

-- CreateIndex
CREATE INDEX "payroll_periods_organizationId_startsAt_endsAt_idx" ON "payroll_periods"("organizationId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "payroll_batches_organizationId_periodId_idx" ON "payroll_batches"("organizationId", "periodId");

-- CreateIndex
CREATE INDEX "payroll_batches_organizationId_status_idx" ON "payroll_batches"("organizationId", "status");

-- CreateIndex
CREATE INDEX "payroll_batch_items_batchId_idx" ON "payroll_batch_items"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batch_items_batchId_employeeId_key" ON "payroll_batch_items"("batchId", "employeeId");

-- CreateIndex
CREATE INDEX "settlement_allocations_sourceMovementId_idx" ON "settlement_allocations"("sourceMovementId");

-- CreateIndex
CREATE INDEX "settlement_allocations_creditMovementId_idx" ON "settlement_allocations"("creditMovementId");

-- CreateIndex
CREATE INDEX "settlement_allocations_batchId_idx" ON "settlement_allocations"("batchId");

-- CreateIndex
CREATE INDEX "notifications_organizationId_userId_read_idx" ON "notifications"("organizationId", "userId", "read");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_entityType_entityId_idx" ON "audit_logs"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_actorUserId_idx" ON "audit_logs"("organizationId", "actorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_organizationId_key" ON "organization_settings"("organizationId");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_primaryBranchId_fkey" FOREIGN KEY ("primaryBranchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_branches" ADD CONSTRAINT "employee_branches_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_branches" ADD CONSTRAINT "employee_branches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_categories" ADD CONSTRAINT "movement_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_movements" ADD CONSTRAINT "ledger_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_movements" ADD CONSTRAINT "ledger_movements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_movements" ADD CONSTRAINT "ledger_movements_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_movements" ADD CONSTRAINT "ledger_movements_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "movement_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_movements" ADD CONSTRAINT "ledger_movements_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_movements" ADD CONSTRAINT "ledger_movements_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_movements" ADD CONSTRAINT "ledger_movements_originalMovementId_fkey" FOREIGN KEY ("originalMovementId") REFERENCES "ledger_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_attachments" ADD CONSTRAINT "movement_attachments_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "ledger_movements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_acknowledgements" ADD CONSTRAINT "movement_acknowledgements_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "ledger_movements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_acknowledgements" ADD CONSTRAINT "movement_acknowledgements_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_disputes" ADD CONSTRAINT "movement_disputes_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "ledger_movements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_disputes" ADD CONSTRAINT "movement_disputes_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batches" ADD CONSTRAINT "payroll_batches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batches" ADD CONSTRAINT "payroll_batches_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batches" ADD CONSTRAINT "payroll_batches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batch_items" ADD CONSTRAINT "payroll_batch_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "payroll_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batch_items" ADD CONSTRAINT "payroll_batch_items_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batch_items" ADD CONSTRAINT "payroll_batch_items_ledgerMovementId_fkey" FOREIGN KEY ("ledgerMovementId") REFERENCES "ledger_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_allocations" ADD CONSTRAINT "settlement_allocations_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "payroll_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_allocations" ADD CONSTRAINT "settlement_allocations_sourceMovementId_fkey" FOREIGN KEY ("sourceMovementId") REFERENCES "ledger_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_allocations" ADD CONSTRAINT "settlement_allocations_creditMovementId_fkey" FOREIGN KEY ("creditMovementId") REFERENCES "ledger_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
