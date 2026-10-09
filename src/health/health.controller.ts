import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthIndicator } from './redis.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaService,
    private redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @Public()
  @SkipThrottle()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application health status' })
  @ApiResponse({ status: 200, description: 'All dependencies are healthy' })
  @ApiResponse({ status: 503, description: 'A dependency is unhealthy' })
  check() {
    return this.health.check([
      // Database health
      () => this.prismaHealth.pingCheck('database', this.prisma),

      // Redis health
      () => this.redisHealth.isHealthy('redis'),

      // Memory health - heap should not exceed 300MB
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Memory health - RSS should not exceed 500MB
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),

      // Disk health - storage should have at least 50% free (50GB threshold)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.5,
        }),
    ]);
  }

  @Get('liveness')
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Liveness probe - is the app running?' })
  @ApiResponse({ status: 200, description: 'Application process is running' })
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @Public()
  @SkipThrottle()
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe - can the app handle traffic?' })
  @ApiResponse({
    status: 200,
    description: 'Application dependencies are ready',
  })
  @ApiResponse({
    status: 503,
    description: 'Application dependencies are unavailable',
  })
  readiness() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
