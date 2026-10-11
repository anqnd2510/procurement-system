import { SetMetadata } from '@nestjs/common';

export const THROTTLE_SKIP_KEY = 'throttle_skip';
export const ThrottleSkip = () => SetMetadata(THROTTLE_SKIP_KEY, true);
