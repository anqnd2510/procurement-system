import { Input } from '../components/ui/input';
import { NativeSelect } from '../components/ui/native-select';
import { ErrorMessage } from '../components/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dateOnly } from '../lib/format';
import { Building2, Check, MailPlus, Plus } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { canCreateOrganization } from '../lib/access';
import { DepartmentAssignmentDialog } from '../components/DepartmentAssignmentDialog';
import { DepartmentEditDialog } from '../components/DepartmentEditDialog';
import type {
  Department,
  Membership,
  Organization,
  OrganizationRole,
} from '../types';
import { useOrganization } from '../organizations/OrganizationContext';
import { useNotifications } from '../components/NotificationProvider';
import {
  Button,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  Notice,
  PageHeading,
  Panel,
} from '../components/ui';

export function OrganizationPage() {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { user } = useAuth();
  const canCreate = canCreateOrganization(user?.role);
  const {
    organizations,
    activeOrganization,
    activeOrganizationId,
    canManage,
    membership,
    isDepartmentLead,
    selectOrganization,
  } = useOrganization();
  const client = useQueryClient();
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] =
    useState<Exclude<OrganizationRole, 'OWNER'>>('MEMBER');
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [formError, setFormError] = useState('');
  const [createdOrganization, setCreatedOrganization] = useState('');
  const [assigningMember, setAssigningMember] = useState<Membership | null>(
    null,
  );
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );

  const membersQuery = useQuery({
    queryKey: ['organization-members', activeOrganizationId],
    queryFn: () =>
      api.get<Membership[]>(`/organizations/${activeOrganizationId}/members`, {
        organization: false,
      }),
    enabled: Boolean(activeOrganizationId && (canManage || isDepartmentLead)),
  });
  const departmentsQuery = useQuery({
    queryKey: ['departments', activeOrganizationId],
    queryFn: () =>
      api.get<Department[]>(
        `/organizations/${activeOrganizationId}/departments`,
        { organization: false },
      ),
    enabled: Boolean(activeOrganizationId),
  });
  const createOrganizationMutation = useMutation({
    mutationFn: () =>
      api.post<Organization>(
        '/organizations',
        { name: organizationName.trim(), slug: organizationSlug.trim() },
        { organization: false },
      ),
    onSuccess: async (organization) => {
      setCreatedOrganization(organization.name);
      setOrganizationName('');
      setOrganizationSlug('');
      await client.invalidateQueries({ queryKey: ['organizations', 'mine'] });
      selectOrganization(organization.id);
      notify('success', 'Organization created.');
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });
  const addMemberMutation = useMutation({
    mutationFn: () =>
      api.post(
        `/organizations/${activeOrganizationId}/members`,
        { email: memberEmail.trim(), role: memberRole },
        { organization: false },
      ),
    onSuccess: () => {
      setMemberEmail('');
      setFormError('');
      void client.invalidateQueries({
        queryKey: ['organization-members', activeOrganizationId],
      });
      notify('success', 'Member added to the organization.');
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });
  const createDepartmentMutation = useMutation({
    mutationFn: () =>
      api.post(
        `/organizations/${activeOrganizationId}/departments`,
        {
          name: departmentName.trim(),
          code: departmentCode.trim().toUpperCase(),
        },
        { organization: false },
      ),
    onSuccess: () => {
      setDepartmentName('');
      setDepartmentCode('');
      setFormError('');
      void client.invalidateQueries({
        queryKey: ['departments', activeOrganizationId],
      });
      notify('success', 'Department created.');
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  useEffect(() => {
    if (!organizationName) return;
    setOrganizationSlug(
      organizationName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60),
    );
  }, [organizationName]);

  function submitOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    createOrganizationMutation.mutate();
  }
  function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    addMemberMutation.mutate();
  }
  function submitDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    createDepartmentMutation.mutate();
  }

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="WORKSPACE · ACCESS"
        title="Organization"
        description={
          canManage
            ? 'Manage workspaces, membership, and the departments used to route purchase requests.'
            : 'View your organization, your access, and its departments.'
        }
      />
      {createdOrganization && (
        <Notice tone="success">
          {t('Created “{{name}}” and switched the active workspace.', {
            name: createdOrganization,
          })}
        </Notice>
      )}
      {organizations.length > 1 && (
        <Panel
          title="Your organizations"
          subtitle="You can switch workspaces from the top navigation as well."
        >
          <div className="organization-cards">
            {organizations.map((organization) => (
              <button
                className={`organization-card ${organization.id === activeOrganizationId ? 'organization-card-active' : ''}`}
                key={organization.id}
                onClick={() => selectOrganization(organization.id)}
              >
                <span className="organization-card-icon">
                  <Building2 size={17} />
                </span>
                <span>
                  <strong>{organization.name}</strong>
                  <small>{organization.slug}</small>
                </span>
                {organization.id === activeOrganizationId && (
                  <Check size={16} />
                )}
              </button>
            ))}
          </div>
        </Panel>
      )}

      <div className="organization-page-grid">
        <Panel
          title={
            activeOrganization ? 'Workspace profile' : 'Organization membership'
          }
          subtitle={
            activeOrganization
              ? 'Identity and current membership'
              : 'Organizations are the security boundary for procurement data.'
          }
        >
          {activeOrganization ? (
            <>
              <div className="org-profile-card">
                <div className="org-profile-mark">
                  <Building2 size={23} />
                </div>
                <div>
                  <span className="eyebrow">{t('ACTIVE ORGANIZATION')}</span>
                  <h3>{activeOrganization.name}</h3>
                  <p>{activeOrganization.slug}</p>
                </div>
                <span className="role-badge">
                  {t(activeOrganization.members?.[0]?.role ?? 'MEMBER')}
                </span>
              </div>
              <div className="org-facts">
                <div>
                  <span>{t('Primary department')}</span>
                  <strong>
                    {membership?.department?.name ?? t('Unassigned')}
                  </strong>
                </div>
                <div>
                  <span>{t('Department role')}</span>
                  <strong>
                    {membership?.departmentId
                      ? t(
                          isDepartmentLead
                            ? 'Department lead'
                            : 'Department member',
                        )
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span>{t('Your access')}</span>
                  <strong>
                    {t(activeOrganization.members?.[0]?.role ?? 'MEMBER')}
                  </strong>
                </div>
                <div>
                  <span>{t('Created')}</span>
                  <strong>{dateOnly(activeOrganization.createdAt)}</strong>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="No organization membership"
              description={
                canCreate
                  ? 'Create an organization to become its owner, then add existing users and departments.'
                  : 'Ask your organization manager to add your account to a workspace.'
              }
            />
          )}
          {canCreate && (
            <div className="create-organization-block">
              <div className="detail-section-title">
                <h4>{t('Create another organization')}</h4>
                <span>{t('you become OWNER')}</span>
              </div>
              <form className="stacked-form" onSubmit={submitOrganization}>
                <FormField label="Organization name">
                  <Input
                    value={organizationName}
                    onChange={(event) =>
                      setOrganizationName(event.target.value)
                    }
                    maxLength={120}
                    placeholder={t('e.g. Northstar Operations')}
                    required
                  />
                </FormField>
                <FormField
                  label="URL slug"
                  hint="Lowercase letters, numbers, and hyphens."
                >
                  <Input
                    value={organizationSlug}
                    onChange={(event) =>
                      setOrganizationSlug(event.target.value)
                    }
                    minLength={3}
                    maxLength={60}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    required
                  />
                </FormField>
                {formError && !activeOrganization && (
                  <ErrorMessage error={formError} />
                )}
                <Button
                  type="submit"
                  loading={createOrganizationMutation.isPending}
                >
                  <Plus size={15} /> {t('Create organization')}{' '}
                </Button>
              </form>
            </div>
          )}
        </Panel>

        <Panel
          title="Departments"
          subtitle={t('{{count}} departments in the active organization', {
            count: departmentsQuery.data?.length ?? '—',
          })}
        >
          {!activeOrganization ? (
            <EmptyState
              title="Choose an organization first"
              description={t('Departments belong to this organization.')}
            />
          ) : departmentsQuery.isLoading ? (
            <LoadingState />
          ) : departmentsQuery.isError ? (
            <ErrorState
              error={departmentsQuery.error}
              onRetry={() => void departmentsQuery.refetch()}
            />
          ) : departmentsQuery.data?.length ? (
            <div className="department-list">
              {departmentsQuery.data.map((department) => (
                <div className="department-row" key={department.id}>
                  <span className="department-avatar">
                    {department.code.slice(0, 2)}
                  </span>
                  <span>
                    <strong>{department.name}</strong>
                    <small>
                      {' '}
                      {t('Created')} {dateOnly(department.createdAt)}
                    </small>
                  </span>
                  <span className="department-chip">{department.code}</span>
                  {(canManage ||
                    (isDepartmentLead &&
                      membership?.departmentId === department.id)) && (
                    <Button
                      variant="secondary"
                      onClick={() => setEditingDepartment(department)}
                    >
                      Edit department
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No departments yet"
              description="Add a department so requests can be routed to a team."
            />
          )}
          {canManage && activeOrganization && (
            <form className="compact-create-form" onSubmit={submitDepartment}>
              <div className="detail-section-title">
                <h4>{t('Add a department')}</h4>
              </div>
              <div className="form-grid-two">
                <FormField label="Department name">
                  <Input
                    value={departmentName}
                    onChange={(event) => setDepartmentName(event.target.value)}
                    maxLength={120}
                    placeholder={t('Procurement')}
                    required
                  />
                </FormField>
                <FormField label="Code">
                  <Input
                    value={departmentCode}
                    onChange={(event) =>
                      setDepartmentCode(event.target.value.toUpperCase())
                    }
                    maxLength={20}
                    pattern="[A-Z0-9_-]+"
                    placeholder="PROC"
                    required
                  />
                </FormField>
              </div>
              {formError && activeOrganization && (
                <ErrorMessage error={formError} />
              )}
              <Button
                type="submit"
                variant="secondary"
                loading={createDepartmentMutation.isPending}
              >
                <Plus size={15} /> {t('Add department')}{' '}
              </Button>
            </form>
          )}
        </Panel>
      </div>

      {(canManage || isDepartmentLead) && (
        <Panel
          title="Organization members"
          subtitle={t('{{count}} members in this organization', {
            count: membersQuery.data?.length ?? '—',
          })}
        >
          {!activeOrganization ? (
            <EmptyState
              title="No active organization"
              description="Create or select a workspace to view its members."
            />
          ) : membersQuery.isLoading ? (
            <LoadingState />
          ) : membersQuery.isError ? (
            <ErrorState
              error={membersQuery.error}
              onRetry={() => void membersQuery.refetch()}
            />
          ) : !membersQuery.data?.length ? (
            <EmptyState
              title="No members yet"
              description="Add coworkers to this organization to get started."
            />
          ) : (
            <div className="members-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('MEMBER')}</th>
                    <th>{t('ACCOUNT ROLE')}</th>
                    <th>{t('ORGANIZATION ACCESS')}</th>
                    <th>{t('Primary department')}</th>
                    {canManage && <th>{t('Actions')}</th>}
                    <th>{t('JOINED')}</th>
                  </tr>
                </thead>
                <tbody>
                  {membersQuery.data.map((membership) => (
                    <tr key={membership.id ?? membership.user?.id}>
                      <td>
                        <div className="member-cell">
                          <span className="avatar avatar-small">
                            {membership.user?.email.slice(0, 1).toUpperCase() ??
                              '?'}
                          </span>
                          <span>
                            <strong>
                              {membership.user?.email ?? t('Unknown user')}
                            </strong>
                            <small>
                              {membership.user?.id?.slice(0, 8) ?? ''}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>
                        {membership.user?.role ? t(membership.user.role) : '—'}
                      </td>
                      <td>
                        <span
                          className={`role-badge role-${membership.role.toLowerCase()}`}
                        >
                          {t(membership.role)}
                        </span>
                      </td>
                      <td className="muted">
                        {membership.department?.name ?? t('Unassigned')}
                        {membership.departmentRole === 'LEAD' && (
                          <small className="block text-muted">
                            {t('Department lead')}
                          </small>
                        )}
                      </td>
                      {canManage && (
                        <td>
                          <Button
                            variant="secondary"
                            onClick={() => setAssigningMember(membership)}
                          >
                            Assign department
                          </Button>
                        </td>
                      )}
                      <td className="muted">
                        {dateOnly(membership.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {canManage && activeOrganization && (
            <form className="invite-form" onSubmit={submitMember}>
              <div className="invite-form-title">
                <span className="invite-icon">
                  <MailPlus size={17} />
                </span>
                <span>
                  <strong>{t('Invite an existing account')}</strong>
                  <small>
                    {t(
                      'Users must register before being added to an organization.',
                    )}
                  </small>
                </span>
              </div>
              <div className="invite-controls">
                <Input
                  aria-label={t('Work email')}
                  type="email"
                  placeholder="teammate@company.com"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  required
                />
                <NativeSelect
                  aria-label={t('Organization role')}
                  value={memberRole}
                  onChange={(event) =>
                    setMemberRole(
                      event.target.value as Exclude<OrganizationRole, 'OWNER'>,
                    )
                  }
                >
                  <option value="MEMBER">{t('Member')}</option>
                  <option value="MANAGER">{t('Manager')}</option>
                </NativeSelect>
                <Button type="submit" loading={addMemberMutation.isPending}>
                  <MailPlus size={15} /> {t('Add member')}{' '}
                </Button>
              </div>
              {formError && <ErrorMessage error={formError} />}
            </form>
          )}
        </Panel>
      )}
      {assigningMember && canManage && (
        <DepartmentAssignmentDialog
          member={assigningMember}
          departments={departmentsQuery.data ?? []}
          onClose={() => setAssigningMember(null)}
        />
      )}
      {editingDepartment && (
        <DepartmentEditDialog
          department={editingDepartment}
          onClose={() => setEditingDepartment(null)}
        />
      )}
    </div>
  );
}
