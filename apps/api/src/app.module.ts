import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpensePaymentsModule } from './expense-payments/expense-payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ExpensesModule,
    ExpensePaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
