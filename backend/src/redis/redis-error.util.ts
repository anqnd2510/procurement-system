const SAFE_REDIS_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'EPIPE',
]);

export function getSafeRedisErrorLogMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Redis connection failed';
  }

  if (/\bWRONGPASS\b/i.test(error.message)) {
    return 'Redis authentication failed';
  }

  const code = (error as Error & { code?: unknown }).code;
  if (typeof code === 'string' && SAFE_REDIS_ERROR_CODES.has(code)) {
    return `Redis connection failed (${code})`;
  }

  return 'Redis connection failed';
}
