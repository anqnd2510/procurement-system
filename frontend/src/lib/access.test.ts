import { describe, expect, it } from 'vitest';
import { canViewAuditTrail } from './access';

describe('canViewAuditTrail', () => {
  it.each(['OWNER', 'MANAGER'] as const)('allows %s', (role) => {
    expect(canViewAuditTrail(role)).toBe(true);
  });

  it('denies members and users without an organization role', () => {
    expect(canViewAuditTrail('MEMBER')).toBe(false);
    expect(canViewAuditTrail(null)).toBe(false);
    expect(canViewAuditTrail(undefined)).toBe(false);
  });
});
