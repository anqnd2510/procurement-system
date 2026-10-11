import { Input } from './ui/input';
import { ErrorMessage } from './ui';
import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Department } from '../types';
import { Button, FormField, Modal } from './ui';

export function DepartmentEditDialog({
  department,
  onClose,
}: {
  department: Department;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [name, setName] = useState(department.name);
  const [code, setCode] = useState(department.code);
  const mutation = useMutation({
    mutationFn: () =>
      api.patch(
        `/organizations/${department.organizationId}/departments/${department.id}`,
        { name: name.trim(), code: code.trim() },
        { organization: false },
      ),
    onSuccess: async () => {
      await Promise.all(
        ['departments', 'organizations', 'organization-members'].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      onClose();
    },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }
  return (
    <Modal title="Edit department" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <FormField label="Department name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
          />
        </FormField>
        <FormField label="Code">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            maxLength={20}
            pattern="[A-Z0-9_-]+"
            required
          />
        </FormField>
        {mutation.isError && <ErrorMessage error={mutation.error} />}
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Save department
          </Button>
        </div>
      </form>
    </Modal>
  );
}
