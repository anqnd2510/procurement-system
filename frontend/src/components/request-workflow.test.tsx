// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { i18n } from '../i18n';
import { ApiError } from '../lib/api';
import type { Department, Membership } from '../types';
import { RequestDepartmentField } from './RequestDepartmentField';
import { RequestReviewActions } from './RequestReviewActions';

afterEach(() => {
  cleanup();
  void i18n.changeLanguage('en');
});

describe('Inline purchase request review', () => {
  it.each(['Approve', 'Reject'])(
    'does not send %s until confirmation, and cancel is safe',
    (label) => {
      const confirm = vi.fn().mockResolvedValue({});
      render(<RequestReviewActions onConfirm={confirm} />);
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(screen.getByRole('textbox')).toBeTruthy();
      expect(confirm).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('textbox')).toBeNull();
      expect(confirm).not.toHaveBeenCalled();
    },
  );

  it('accepts an approval without a comment and waits for the result', async () => {
    const confirm = vi.fn().mockResolvedValue({});
    render(<RequestReviewActions onConfirm={confirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    fireEvent.submit(screen.getByRole('form'));
    await waitFor(() => expect(screen.queryByRole('form')).toBeNull());
    expect(confirm).toHaveBeenCalledExactlyOnceWith('approve', undefined);
  });

  it('rejects whitespace, then submits a trimmed reason', async () => {
    const confirm = vi.fn().mockResolvedValue({});
    render(<RequestReviewActions onConfirm={confirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(screen.getByRole('alert').textContent).toContain(
      'A rejection reason is required.',
    );
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '  Outside budget  ' },
    });
    fireEvent.submit(screen.getByRole('form'));
    await waitFor(() =>
      expect(confirm).toHaveBeenCalledExactlyOnceWith(
        'reject',
        'Outside budget',
      ),
    );
  });

  it('preserves the comment after an API failure and prevents duplicate submits', async () => {
    let fail!: (error: Error) => void;
    const confirm = vi.fn(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        }),
    );
    render(<RequestReviewActions onConfirm={confirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Budget exhausted' },
    });
    fireEvent.submit(screen.getByRole('form'));
    fireEvent.submit(screen.getByRole('form'));
    expect(confirm).toHaveBeenCalledOnce();
    expect(
      (screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await act(async () =>
      fail(new ApiError('The request has already changed', 409)),
    );
    expect(screen.getByRole('alert').textContent).toContain(
      'its status has changed',
    );
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
      'Budget exhausted',
    );
  });

  it('resets decision text when switching actions and localizes the form', async () => {
    await i18n.changeLanguage('vi');
    render(<RequestReviewActions onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('Approve') }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Approved' },
    });
    fireEvent.click(screen.getByRole('button', { name: i18n.t('Reject') }));
    expect(screen.getByRole('form').getAttribute('aria-label')).toBe(
      'Xác nhận từ chối',
    );
    expect(
      (screen.getByLabelText('Lý do từ chối') as HTMLTextAreaElement).value,
    ).toBe('');
  });
});

const departments: Department[] = [
  {
    id: 'it',
    name: 'Information Technology',
    code: 'IT',
    organizationId: 'org',
    createdAt: '',
  },
  {
    id: 'fin',
    name: 'Finance',
    code: 'FIN',
    organizationId: 'org',
    createdAt: '',
  },
];
function DepartmentFixture({
  manager = false,
  assigned = true,
}: {
  manager?: boolean;
  assigned?: boolean;
}) {
  const [value, setValue] = useState(assigned ? 'it' : '');
  const membership: Membership = {
    role: manager ? 'MANAGER' : 'MEMBER',
    departmentId: assigned ? 'it' : null,
    department: assigned ? departments[0] : null,
  };
  return (
    <RequestDepartmentField
      canManage={manager}
      membership={membership}
      departments={departments}
      value={value}
      onChange={setValue}
    />
  );
}

describe('Primary department defaults', () => {
  it('shows the member primary department read-only with no selector or override', () => {
    render(<DepartmentFixture />);
    const field = screen.getByLabelText('Department') as HTMLInputElement;
    expect(field.value).toBe('Information Technology · IT');
    expect(field.readOnly).toBe(true);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
  it('defaults managers too, and requires an explicit override to choose another department', () => {
    render(<DepartmentFixture manager />);
    expect(screen.queryByRole('combobox')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'fin' },
    });
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe(
      'fin',
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(
      (screen.getByLabelText('Department') as HTMLInputElement).value,
    ).toBe('Information Technology · IT');
  });
  it('does not invent a department for an unassigned member', () => {
    render(<DepartmentFixture assigned={false} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByText(/Ask your organization manager/)).toBeTruthy();
  });
  it('allows an unassigned organization manager to choose explicitly', () => {
    render(<DepartmentFixture manager assigned={false} />);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('');
    expect(screen.getByText(/You have no primary department/)).toBeTruthy();
  });
});
