import { Test, TestingModule } from '@nestjs/testing';
import { InventoriesService } from './inventories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InventoriesService', () => {
  let service: InventoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoriesService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<InventoriesService>(InventoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
