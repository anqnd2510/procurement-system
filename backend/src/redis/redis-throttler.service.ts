import { ThrottlerStorage } from '@nestjs/throttler';
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getSafeRedisErrorLogMessage } from './redis-error.util';

@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnModuleDestroy
{
  private redis: Redis;
  private scanCount = 1000;
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const connectionOptions = {
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    };

    this.redis = redisUrl
      ? new Redis(redisUrl, connectionOptions)
      : new Redis({
          ...connectionOptions,
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
          password: this.configService.get<string>('REDIS_PASSWORD'),
          db: this.configService.get<number>('REDIS_DB', 0),
        });

    this.redis.on('error', (error) => {
      this.logger.error(getSafeRedisErrorLogMessage(error));
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully for rate limiting');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis is ready to accept commands');
    });
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Redis throttler storage...');
    await this.disconnect();
  }

  getRedisClient(): Redis {
    return this.redis;
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    const prefixedKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:block:${throttlerName}:${key}`;

    // Check if currently blocked
    const blockTTL = await this.redis.pttl(blockKey);
    if (blockTTL > 0) {
      const hits = await this.redis.get(prefixedKey);
      return {
        totalHits: hits ? parseInt(hits, 10) : 0,
        timeToExpire: await this.redis.pttl(prefixedKey),
        isBlocked: true,
        timeToBlockExpire: blockTTL,
      };
    }

    const results = await this.redis
      .multi()
      .incr(prefixedKey)
      .pttl(prefixedKey)
      .exec();

    if (!results) {
      throw new Error('Redis transaction failed');
    }

    const [[incrErr, totalHits], [pttlErr, timeToExpire]] = results;

    if (incrErr || pttlErr) {
      throw new Error('Redis command failed');
    }

    // Set expiration if key is new (TTL is -1)
    if (timeToExpire === -1) {
      await this.redis.pexpire(prefixedKey, ttl);
    }

    const hits = totalHits as number;
    const ttlValue = timeToExpire === -1 ? ttl : (timeToExpire as number);
    const isBlocked = hits > limit;

    // Set block if limit exceeded
    if (isBlocked && blockDuration > 0) {
      await this.redis.set(blockKey, '1', 'PX', blockDuration);
    }

    return {
      totalHits: hits,
      timeToExpire: ttlValue,
      isBlocked,
      timeToBlockExpire: isBlocked && blockDuration > 0 ? blockDuration : 0,
    };
  }

  async get(key: string): Promise<number> {
    const prefixedKey = `throttle:${key}`;
    const value = await this.redis.get(prefixedKey);
    return value ? parseInt(value, 10) : 0;
  }

  async reset(key: string): Promise<void> {
    const prefixedKey = `throttle:${key}`;
    await this.redis.del(prefixedKey);
  }

  async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const reply = await this.redis.scan(
        cursor,
        'MATCH',
        `throttle:${pattern}`,
        'COUNT',
        this.scanCount,
      );
      cursor = reply[0];
      keys.push(...reply[1].map((key) => key.replace('throttle:', '')));
    } while (cursor !== '0');

    return keys;
  }

  async disconnect(): Promise<void> {
    if (this.redis.status === 'end' || this.redis.status === 'close') {
      return;
    }
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed gracefully');
    } catch {
      // The connection may close concurrently during application shutdown.
    }
  }
}
