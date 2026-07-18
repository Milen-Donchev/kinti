import { Module } from '@nestjs/common';

import { ExpensePaymentsGuard } from './expense-payments.guard';
import { ExpensePaymentsService } from './expense-payments.service';
import { ExpensePaymentsController } from './expense-payments.controller';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ExpensePaymentsController],
  providers: [ExpensePaymentsService, ExpensePaymentsGuard],
})
export class ExpensePaymentsModule {}
