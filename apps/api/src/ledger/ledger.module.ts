import { Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [EmployeesModule],
  controllers: [LedgerController],
  providers: [LedgerService],
})
export class LedgerModule {}
