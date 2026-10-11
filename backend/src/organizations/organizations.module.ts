import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationRolesGuard } from '../common/guards/organization-roles.guard';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationRolesGuard],
  exports: [OrganizationsService, OrganizationRolesGuard],
})
export class OrganizationsModule {}
