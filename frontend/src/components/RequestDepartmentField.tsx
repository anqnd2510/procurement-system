import { Input } from './ui/input';
import { NativeSelect } from './ui/native-select';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Department, Membership } from '../types';
import { FormField } from './ui';

export function RequestDepartmentField({
  membership,
  canManage,
  departments,
  value,
  onChange,
}: {
  membership: Membership | null;
  canManage: boolean;
  departments: Department[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  const primary = membership?.department;
  const [override, setOverride] = useState(
    Boolean(value && value !== primary?.id),
  );
  const allowChoice = canManage && (!primary || override);
  return (
    <div className="min-w-0 space-y-2">
      <FormField label="Department">
        {allowChoice ? (
          <NativeSelect
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required
          >
            <option value="">{t('Select department…')}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name} · {department.code}
              </option>
            ))}
          </NativeSelect>
        ) : (
          <Input
            readOnly
            title={
              primary ? `${primary.name} · ${primary.code}` : t('Unassigned')
            }
            value={
              primary ? `${primary.name} · ${primary.code}` : t('Unassigned')
            }
          />
        )}
      </FormField>
      {canManage && primary ? (
        <label className="flex items-start gap-2 text-sm text-muted">
          <input
            className="mt-1 shrink-0"
            type="checkbox"
            checked={override}
            onChange={(event) => {
              setOverride(event.target.checked);
              if (!event.target.checked) onChange(primary.id);
            }}
          />
          {t('Request for another department')}
        </label>
      ) : (
        <p className="text-sm text-muted">
          {t(
            primary
              ? 'Automatically assigned from your primary department.'
              : canManage
                ? 'You have no primary department. Choose the department you are requesting for.'
                : 'Ask your organization manager to assign your primary department before creating a request.',
          )}
        </p>
      )}
    </div>
  );
}
