import { ErrorMessage } from './ui';
import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useOrganization } from '../organizations/OrganizationContext';
import type { Department, Membership } from '../types';
import { Button, FormField, Modal, Notice } from './ui';

export function DepartmentAssignmentDialog({
  member,
  departments,
  onClose,
}: {
  member: Membership;
  departments: Department[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { activeOrganizationId } = useOrganization();
  const client = useQueryClient();
  const [departmentId, setDepartmentId] = useState(member.departmentId || '');
  const [role, setRole] = useState(member.departmentRole || 'MEMBER');
  const mutation = useMutation({
    mutationFn: () =>
      api.patch(
        `/organizations/${activeOrganizationId}/members/${member.id}/department`,
        {
          departmentId: departmentId || null,
          departmentRole: departmentId ? role : 'MEMBER',
        },
        { organization: false },
      ),
    onSuccess: async () => {
      await Promise.all(
        [
          'organizations',
          'organization-members',
          'departments',
          'purchase-requests',
          'purchase-orders',
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
      onClose();
    },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }
  return (
    <Modal title="Assign primary department" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <p className="text-base font-semibold text-ink">{member.user?.email}</p>
        <Notice>
          One primary department per organization. A department lead can manage
          only that department, not the entire organization.
        </Notice>
        <FormField label="Primary department">
          <select
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
          >
            <option value="">{t('Unassigned')}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Department role">
          <select
            value={departmentId ? role : 'MEMBER'}
            disabled={!departmentId}
            onChange={(event) =>
              setRole(event.target.value as 'MEMBER' | 'LEAD')
            }
          >
            <option value="MEMBER">{t('Department member')}</option>
            <option value="LEAD">{t('Department lead')}</option>
          </select>
        </FormField>
        {mutation.isError && <ErrorMessage error={mutation.error} />}
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Save assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
