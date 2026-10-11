import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  imports: [OrganizationsModule],
  exports: [CategoriesService],
})
export class CategoriesModule {}
