// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../lib/api';
import { i18n } from '../i18n';
import type { PageData, ReorderAlert, ReorderPolicy } from '../types';
import { ReorderManagement } from './ReorderManagement';
import { NotificationProvider } from './NotificationProvider';

vi.mock('../lib/api', async (original) => ({
  ...(await original<typeof import('../lib/api')>()),
  api: { get: vi.fn(), put: vi.fn() },
}));
const get = vi.mocked(api.get);
const put = vi.mocked(api.put);
const policy: ReorderPolicy = {
  inventoryId: 'inventory-1',
  productId: 'product-1',
  reorderPoint: 5,
  targetStock: 20,
};
const alerts: PageData<ReorderAlert> = {
  items: [
    {
      inventoryId: 'inventory-1',
      productId: 'product-1',
      productName: 'Wireless mouse',
      productSku: 'MOU-010',
      qtyAvailable: 2,
      qtyReserved: 1,
      qtyTotal: 3,
      reorderPoint: 5,
      targetStock: 20,
      incomingQty: 4,
      suggestedOrderQty: 14,
      status: 'LOW_STOCK',
      updatedAt: '2026-10-12T10:00:00.000Z',
    },
  ],
  meta: {
    page: 1,
    limit: 8,
    total: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
};
const clients: QueryClient[] = [];

beforeEach(async () => {
  vi.clearAllMocks();
  await i18n.changeLanguage('en');
  get.mockImplementation(
    async (path: string) =>
      (path.includes('reorder-alerts') ? alerts : policy) as never,
  );
  put.mockResolvedValue({ ...policy, reorderPoint: 7 } as never);
});

afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <NotificationProvider>
        <ReorderManagement
          organizationId="org-1"
          productId="product-1"
          productName="Wireless mouse"
        />
      </NotificationProvider>
    </QueryClientProvider>,
  );
  return client;
}

describe('Reorder management UI', () => {
  it('loads existing policy and live alerts from organization-scoped APIs', async () => {
    setup();
    expect(await screen.findByText('MOU-010')).toBeTruthy();
    expect(
      (
        screen.getByLabelText(
          'Remind me when stock reaches',
        ) as HTMLInputElement
      ).value,
    ).toBe('5');
    expect(
      (
        screen.getByLabelText(
          'Stock level after restocking',
        ) as HTMLInputElement
      ).value,
    ).toBe('20');
    expect(screen.getAllByText('Wireless mouse')).toHaveLength(2);
    expect(screen.getByText('14')).toBeTruthy();
    expect(get).toHaveBeenCalledWith(
      '/inventories/workspace/product-1/reorder-policy',
      { organization: 'org-1' },
    );
    expect(get).toHaveBeenCalledWith(
      '/inventories/workspace/reorder-alerts?page=1&limit=8',
      { organization: 'org-1' },
    );
  });

  it('prefills new policies with a reorder point of 10 and target stock of 20', async () => {
    get.mockImplementation(
      async (path: string) =>
        (path.includes('reorder-alerts')
          ? alerts
          : {
              inventoryId: 'inventory-1',
              productId: 'product-1',
              reorderPoint: null,
              targetStock: null,
            }) as never,
    );
    setup();
    await waitFor(() => {
      expect(
        (
          screen.getByLabelText(
            'Remind me when stock reaches',
          ) as HTMLInputElement
        ).value,
      ).toBe('10');
      expect(
        (
          screen.getByLabelText(
            'Stock level after restocking',
          ) as HTMLInputElement
        ).value,
      ).toBe('20');
    });
  });

  it('validates threshold ordering before saving and sends valid values to the API', async () => {
    setup();
    const point = await screen.findByLabelText('Remind me when stock reaches');
    const target = screen.getByLabelText('Stock level after restocking');
    fireEvent.change(point, { target: { value: '20' } });
    fireEvent.change(target, { target: { value: '10' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'Save restock settings' }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The restocked level must be higher than the reminder level.',
    );
    expect(put).not.toHaveBeenCalled();

    fireEvent.change(point, { target: { value: '7' } });
    fireEvent.change(target, { target: { value: '24' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'Save restock settings' }),
    );
    await waitFor(() => expect(put).toHaveBeenCalledOnce());
    expect(put).toHaveBeenCalledWith(
      '/inventories/workspace/product-1/reorder-policy',
      { reorderPoint: 7, targetStock: 24 },
      { organization: 'org-1' },
    );
  });

  it('localizes policy controls and alert filters into Vietnamese', async () => {
    await i18n.changeLanguage('vi');
    setup();
    expect(await screen.findByText('Nhắc nhập hàng')).toBeTruthy();
    expect(await screen.findByLabelText('Nhắc tôi khi hàng còn')).toBeTruthy();
    expect(screen.getByLabelText('Tình trạng hàng')).toBeTruthy();
  });
});
