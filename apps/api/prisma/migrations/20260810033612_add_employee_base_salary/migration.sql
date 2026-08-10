-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "baseSalaryCents" INTEGER;

-- AlterTable
ALTER TABLE "payroll_batch_items" ADD COLUMN     "baseSalaryCents" INTEGER,
ADD COLUMN     "netPayCents" INTEGER;
