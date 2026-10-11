import { Test, TestingModule } from '@nestjs/testing';
import { InventoriesService } from './inventories.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('InventoriesService', () => {
  let service: InventoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoriesService,
        { provide: PrismaService, useValue: {} },
        { provide: OrganizationsService, useValue: {} },
        { provide: AuditLogsService, useValue: {} },
      ],
    }).compile();

    service = module.get<InventoriesService>(InventoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
