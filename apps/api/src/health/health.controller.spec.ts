import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: Pick<HealthService, 'getApiHealth' | 'getDatabaseHealth'>;

  beforeEach(async () => {
    healthService = {
      getApiHealth: jest.fn().mockReturnValue({
        status: 'ok',
        service: 'api',
      }),
      getDatabaseHealth: jest.fn().mockResolvedValue({
        status: 'ok',
        database: 'connected',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return api health', () => {
    expect(controller.getApiHealth()).toEqual({
      status: 'ok',
      service: 'api',
    });

    expect(healthService.getApiHealth).toHaveBeenCalledTimes(1);
  });

  it('should return database health', async () => {
    await expect(controller.getDatabaseHealth()).resolves.toEqual({
      status: 'ok',
      database: 'connected',
    });

    expect(healthService.getDatabaseHealth).toHaveBeenCalledTimes(1);
  });
});
