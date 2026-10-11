import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisThrottlerStorage } from '../redis/redis-throttler.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisStorage: RedisThrottlerStorage) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const redis = this.redisStorage.getRedisClient();
      const result = await redis.ping();

      if (result === 'PONG') {
        return this.getStatus(key, true, {
          message: 'Redis is responding',
        });
      }

      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          message: 'Redis did not respond with PONG',
        }),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          message,
        }),
      );
    }
  }
}
