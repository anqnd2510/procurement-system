import { Module, Global } from '@nestjs/common';
import { RedisThrottlerStorage } from './redis-throttler.service';

@Global()
@Module({
  providers: [RedisThrottlerStorage],
  exports: [RedisThrottlerStorage],
})
export class RedisModule {}
