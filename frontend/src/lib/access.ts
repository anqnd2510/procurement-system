import type { OrganizationRole } from '../types';

export function canViewAuditTrail(role: OrganizationRole | null | undefined) {
  return role === 'OWNER' || role === 'MANAGER';
}
export function canViewDashboard(role: string | null) {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canCreateOrganization(role: string | null | undefined) {
  return role === 'ADMIN' || role === 'MANAGER';
}
