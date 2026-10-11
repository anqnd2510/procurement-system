import type { AuthResult } from '../types';

const ACCESS_TOKEN = 'procurement.access-token';
const REFRESH_TOKEN = 'procurement.refresh-token';
const ORGANIZATION_ID = 'procurement.organization-id';

export function readAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN);
}

export function readRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN);
}

export function saveSession(auth: AuthResult) {
  sessionStorage.setItem(ACCESS_TOKEN, auth.accessToken);
  sessionStorage.setItem(REFRESH_TOKEN, auth.refreshToken);
}

export function updateAccessToken(accessToken: string) {
  sessionStorage.setItem(ACCESS_TOKEN, accessToken);
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS_TOKEN);
  sessionStorage.removeItem(REFRESH_TOKEN);
  sessionStorage.removeItem(ORGANIZATION_ID);
}

export function readOrganizationId() {
  return sessionStorage.getItem(ORGANIZATION_ID);
}

export function saveOrganizationId(id: string | null) {
  if (id) sessionStorage.setItem(ORGANIZATION_ID, id);
  else sessionStorage.removeItem(ORGANIZATION_ID);
}
