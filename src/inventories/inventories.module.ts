import { Module } from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { InventoriesController } from './inventories.controller';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  providers: [InventoriesService],
  imports: [OrganizationsModule],
  controllers: [InventoriesController],
  exports: [InventoriesService],
})
export class InventoriesModule {}
