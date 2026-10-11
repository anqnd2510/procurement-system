import type { OrganizationRole } from '../types';

export function canViewAuditTrail(role: OrganizationRole | null | undefined) {
  return role === 'OWNER' || role === 'MANAGER';
}
