import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../auth/types';

@Injectable()
export class ExpensePaymentsGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id;
    const expenseId = request.params?.id as string;

    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!expenseId) {
      throw new BadRequestException();
    }

    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId, userId },
      select: { isActive: true },
    });

    if (!expense) {
      throw new NotFoundException();
    }

    if (!expense.isActive) {
      throw new BadRequestException(
        'Modifying inactive expenses is not allowed',
      );
    }

    return true;
  }
}
