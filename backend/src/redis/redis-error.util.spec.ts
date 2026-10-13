import { getSafeRedisErrorLogMessage } from './redis-error.util';

describe('getSafeRedisErrorLogMessage', () => {
  it('reports authentication failures without logging command details', () => {
    const error = new Error('WRONGPASS invalid username-password pair');
    Object.assign(error, {
      command: { name: 'auth', args: ['default', 'secret-token'] },
    });

    expect(getSafeRedisErrorLogMessage(error)).toBe(
      'Redis authentication failed',
    );
  });

  it('preserves an allowlisted network error code', () => {
    const error = Object.assign(new Error('connection failed'), {
      code: 'ECONNREFUSED',
    });

    expect(getSafeRedisErrorLogMessage(error)).toBe(
      'Redis connection failed (ECONNREFUSED)',
    );
  });

  it('does not include arbitrary error messages', () => {
    expect(
      getSafeRedisErrorLogMessage(new Error('failed with secret-token')),
    ).toBe('Redis connection failed');
    expect(getSafeRedisErrorLogMessage('unexpected failure')).toBe(
      'Redis connection failed',
    );
  });
});
