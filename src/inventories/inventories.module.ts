import { Module } from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { InventoriesController } from './inventories.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  providers: [InventoriesService],
  imports: [OrganizationsModule, AuditLogsModule],
  controllers: [InventoriesController],
  exports: [InventoriesService],
})
export class InventoriesModule {}
