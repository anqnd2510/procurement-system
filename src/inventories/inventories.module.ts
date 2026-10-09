import { Module } from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { InventoriesController } from './inventories.controller';

@Module({
  providers: [InventoriesService],
  controllers: [InventoriesController],
  exports: [InventoriesService],
})
export class InventoriesModule {}
