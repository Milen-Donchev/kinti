import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  getApiHealth() {
    return {
      status: 'ok',
      service: 'api',
    };
  }

  async getDatabaseHealth() {
    await this.prismaService.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'connected',
    };
  }
}
