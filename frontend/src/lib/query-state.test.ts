import { describe, expect, it } from 'vitest';
import { ApiError } from './api';
import { keepScopedData, shouldRetryQuery } from './query-state';
import { canViewDashboard, canCreateOrganization } from './access';

describe('Workspace boundaries and retries', () => {
  it('retains pagination data within a tenant, never between tenants', () => {
    const rows = [{ id: 'row' }];
    const keep = keepScopedData(['products', 'org-a']);
    expect(keep(rows, { queryKey: ['products', 'org-a', 1] })).toBe(rows);
    expect(keep(rows, { queryKey: ['products', 'org-b', 1] })).toBeUndefined();
  });
  it.each([400, 401, 403, 404, 409])('does not retry %s', (status) => {
    expect(shouldRetryQuery(0, new ApiError('Failure', status))).toBe(false);
  });
  it('retries transient failures only once', () => {
    expect(shouldRetryQuery(0, new ApiError('Failure', 500))).toBe(true);
    expect(shouldRetryQuery(1, new TypeError('Failed to fetch'))).toBe(false);
  });
  it('keeps member dashboards and employee organization creation restricted', () => {
    expect(canViewDashboard('MEMBER')).toBe(false);
    expect(canViewDashboard('MANAGER')).toBe(true);
    expect(canCreateOrganization('EMPLOYEE')).toBe(false);
    expect(canCreateOrganization('ADMIN')).toBe(true);
  });
});
