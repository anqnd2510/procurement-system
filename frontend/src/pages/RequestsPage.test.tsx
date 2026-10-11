// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { RequestsPage } from './RequestsPage';

const mocks = vi.hoisted(() => ({
  organization: null as null | { id: string },
  membership: null as null | {
    departmentId: string;
    department: { id: string; name: string; code: string };
  },
}));
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'member' } }),
}));
vi.mock('../organizations/OrganizationContext', () => ({
  useOrganization: () => ({
    activeOrganization: mocks.organization,
    membership: mocks.membership,
    canManage: false,
    isDepartmentLead: false,
  }),
}));
vi.mock('../lib/api', async (original) => {
  const actual = await original<typeof import('../lib/api')>();
  return {
    ...actual,
    api: {
      get: vi.fn(async (path: string) =>
        path.includes('/departments')
          ? [{ id: 'dept', name: 'IT', code: 'IT' }]
          : { items: [], meta: { total: 0 } },
      ),
    },
  };
});

afterEach(() => {
  cleanup();
  mocks.organization = null;
  mocks.membership = null;
});

describe('Request creation deep links', () => {
  it('waits for membership before opening the form and applying the primary department', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    function Location() {
      return <output data-testid="location">{useLocation().search}</output>;
    }
    function App() {
      return (
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/requests?new=1']}>
            <Location />
            <RequestsPage key={mocks.organization?.id ?? 'loading'} />
          </MemoryRouter>
        </QueryClientProvider>
      );
    }
    const view = render(<App />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('location').textContent).toBe('?new=1');
    mocks.organization = { id: 'org' };
    mocks.membership = {
      departmentId: 'dept',
      department: { id: 'dept', name: 'IT', code: 'IT' },
    };
    view.rerender(<App />);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    const field = screen.getByLabelText('Department') as HTMLInputElement;
    expect(field.value).toBe('IT · IT');
    expect(field.readOnly).toBe(true);
    expect(screen.getByTestId('location').textContent).toBe('');
    client.clear();
  });
});
