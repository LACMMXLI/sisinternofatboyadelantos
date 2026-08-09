import { Module } from '@nestjs/common';
import { PayrollPeriodsController } from './payroll-periods.controller';
import { PayrollPeriodsService } from './payroll-periods.service';
import { PayrollBatchesController } from './payroll-batches.controller';
import { PayrollBatchesService } from './payroll-batches.service';
import { PayrollPdfService } from './payroll-pdf.service';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [EmployeesModule],
  controllers: [PayrollPeriodsController, PayrollBatchesController],
  providers: [PayrollPeriodsService, PayrollBatchesService, PayrollPdfService],
})
export class PayrollModule {}
