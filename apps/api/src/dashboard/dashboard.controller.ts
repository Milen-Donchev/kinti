import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/types';

import { DashboardService } from './dashboard.service';
import { DashboardPeriodQueryDto } from './dto/dashboard-period-query.dto';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @CurrentUser() user: AuthUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.dashboardService.getMonthlySummary(user.id, query);
  }
}
