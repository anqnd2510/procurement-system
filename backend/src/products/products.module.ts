import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  providers: [ProductsService],
  imports: [OrganizationsModule],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
