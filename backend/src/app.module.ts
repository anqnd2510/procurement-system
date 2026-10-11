import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { RedisThrottlerStorage } from './redis/redis-throttler.service';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { InventoriesModule } from './inventories/inventories.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PurchaseRequestsModule } from './purchase-requests/purchase-requests.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisThrottlerStorage],
      useFactory: (storage: RedisThrottlerStorage) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000, // 1 second
            limit: 10, // 10 requests per second
          },
          {
            name: 'medium',
            ttl: 60000, // 1 minute
            limit: 100, // 100 requests per minute
          },
          {
            name: 'long',
            ttl: 900000, // 15 minutes
            limit: 1000, // 1000 requests per 15 minutes
          },
        ],
        storage,
      }),
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    ProductsModule,
    CategoriesModule,
    InventoriesModule,
    OrganizationsModule,
    PurchaseRequestsModule,
    PurchaseOrdersModule,
    AuditLogsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
