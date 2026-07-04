import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: Pick<PrismaService, '$queryRaw'>;

  beforeEach(async () => {
    prismaService = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return api health', () => {
    expect(service.getApiHealth()).toEqual({
      status: 'ok',
      service: 'api',
    });
  });

  it('should return database health when the database responds', async () => {
    await expect(service.getDatabaseHealth()).resolves.toEqual({
      status: 'ok',
      database: 'connected',
    });

    expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
