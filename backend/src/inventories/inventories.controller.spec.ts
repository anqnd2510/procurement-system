import { Test, TestingModule } from '@nestjs/testing';
import { InventoriesController } from './inventories.controller';
import { InventoriesService } from './inventories.service';
import { OrganizationsService } from '../organizations/organizations.service';

describe('InventoriesController', () => {
  let controller: InventoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoriesController],
      providers: [
        { provide: InventoriesService, useValue: {} },
        { provide: OrganizationsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<InventoriesController>(InventoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
