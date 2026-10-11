import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { readOrganizationId, saveOrganizationId } from '../lib/session';
import { useAuth } from '../auth/AuthContext';
import { ErrorState } from '../components/ui';
import type { Membership, Organization, OrganizationRole } from '../types';

interface OrganizationContextValue {
  organizations: Organization[];
  activeOrganization: Organization | null;
  activeOrganizationId: string | null;
  membershipRole: OrganizationRole | null;
  canManage: boolean;
  membership: Membership | null;
  isDepartmentLead: boolean;
  isLoading: boolean;
  selectOrganization: (id: string) => void;
  refreshOrganizations: () => Promise<unknown>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null,
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const organizationQuery = useQuery({
    queryKey: ['organizations', 'mine', user?.id],
    queryFn: () =>
      api.get<Organization[]>('/organizations/mine', { organization: false }),
    enabled: Boolean(user),
  });
  const organizations = organizationQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    readOrganizationId(),
  );

  useEffect(() => {
    if (!user) {
      setSelectedId(null);
      saveOrganizationId(null);
      return;
    }
    if (!organizationQuery.isSuccess) return;
    if (!organizations.length) {
      setSelectedId(null);
      saveOrganizationId(null);
      return;
    }
    if (
      !selectedId ||
      !organizations.some((organization) => organization.id === selectedId)
    ) {
      const nextId = organizations[0].id;
      setSelectedId(nextId);
      saveOrganizationId(nextId);
    }
  }, [user, organizations, selectedId, organizationQuery.isSuccess]);

  const activeOrganization =
    organizations.find((organization) => organization.id === selectedId) ??
    null;
  const membershipRole = activeOrganization?.members?.[0]?.role ?? null;
  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      activeOrganization,
      activeOrganizationId: activeOrganization?.id ?? null,
      membershipRole,
      membership: activeOrganization?.members?.[0] ?? null,
      isDepartmentLead:
        activeOrganization?.members?.[0]?.departmentRole === 'LEAD' &&
        !!activeOrganization?.members?.[0]?.departmentId,
      canManage: membershipRole === 'OWNER' || membershipRole === 'MANAGER',
      isLoading:
        Boolean(user) &&
        (organizationQuery.isLoading ||
          (organizations.length > 0 && !activeOrganization)),
      selectOrganization: (id) => {
        setSelectedId(id);
        saveOrganizationId(id);
      },
      refreshOrganizations: organizationQuery.refetch,
    }),
    [
      organizations,
      activeOrganization,
      membershipRole,
      user,
      organizationQuery.isLoading,
      organizationQuery.refetch,
    ],
  );
  if (organizationQuery.isError && !organizationQuery.data)
    return (
      <ErrorState
        error={organizationQuery.error}
        onRetry={() => void organizationQuery.refetch()}
      />
    );
  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const value = useContext(OrganizationContext);
  if (!value) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return value;
}
