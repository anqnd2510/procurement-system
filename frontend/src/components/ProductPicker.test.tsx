// @vitest-environment jsdom
import '../test/command-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ProductPicker, type SelectedProduct } from './ProductPicker';
import { Modal } from './ui';
import { api, ApiError } from '../lib/api';
import { i18n } from '../i18n';
import type { PageData, Product } from '../types';

vi.mock('../lib/api', async (original) => ({
  ...(await original<typeof import('../lib/api')>()),
  api: { get: vi.fn() },
}));
const get = vi.mocked(api.get);
const product = (id: string, name = `Product ${id}`): Product => ({
  id,
  name,
  sku: `SKU-${id}`,
  unit_price: '179.00',
  description: null,
  categoryId: null,
  category: null,
  createdAt: '',
  updatedAt: '',
});
const page = (
  items: Product[],
  pageNumber = 1,
  total = items.length,
  hasNext = false,
): PageData<Product> => ({
  items,
  meta: {
    page: pageNumber,
    limit: 20,
    total,
    hasNext,
    hasPrev: pageNumber > 1,
    totalPages: Math.ceil(total / 20),
  },
});
const clients: QueryClient[] = [];
beforeEach(async () => {
  vi.clearAllMocks();
  await i18n.changeLanguage('en');
  get.mockResolvedValue(page([product('first')]));
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

function setup(
  initial: SelectedProduct | null = null,
  org = 'org-a',
  disabled = false,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const onSelect = vi.fn();
  function App({ organizationId }: { organizationId: string }) {
    const [value, setValue] = useState(initial);
    return (
      <QueryClientProvider client={client}>
        <ProductPicker
          organizationId={organizationId}
          value={value}
          disabled={disabled}
          onSelect={(next) => {
            onSelect(next);
            setValue(next);
          }}
        />
      </QueryClientProvider>
    );
  }
  const view = render(<App organizationId={org} />);
  return {
    ...view,
    onSelect,
    switchOrg: (organizationId: string) =>
      view.rerender(<App organizationId={organizationId} />),
  };
}
function open() {
  fireEvent.click(screen.getByRole('button', { name: /Catalog product/ }));
}
function search(term: string) {
  fireEvent.change(
    screen.getByPlaceholderText('Search by product name or SKU…'),
    { target: { value: term } },
  );
}

describe('Server-backed product picker', () => {
  it('loads only on open, includes tenant and cancellation signal, and selects the full product', async () => {
    const { onSelect } = setup();
    expect(get).not.toHaveBeenCalled();
    open();
    fireEvent.click(
      await screen.findByRole('option', { name: /Product first/ }),
    );
    expect(get).toHaveBeenCalledWith(
      '/products/workspace?page=1&limit=20',
      expect.objectContaining({
        organization: 'org-a',
        signal: expect.any(AbortSignal),
      }),
    );
    expect(onSelect).toHaveBeenCalledWith(product('first'));
    expect(
      screen.queryByPlaceholderText('Search by product name or SKU…'),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /Catalog product/ }).textContent,
    ).toContain('SKU-first');
  });
  it('debounces and encodes remote searches, including products beyond the first 100', async () => {
    get.mockImplementation(async (path) =>
      path.includes('search=')
        ? page([product('150', 'Special monitor')])
        : page([product('first')]),
    );
    const { onSelect } = setup();
    open();
    await screen.findByRole('option', { name: /Product first/ });
    search('SKU-');
    search(' SKU-150 & monitor ');
    expect(get).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('option', { name: /Product first/ })).toBeNull();
    fireEvent.click(
      await screen.findByRole('option', { name: /Special monitor/ }),
    );
    expect(get).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[1][0]).toBe(
      '/products/workspace?page=1&limit=20&search=SKU-150+%26+monitor',
    );
    expect(onSelect).toHaveBeenCalledWith(product('150', 'Special monitor'));
  });
  it('appends pages without duplicates and resets pagination for a new search', async () => {
    get.mockImplementation(async (path) =>
      path.includes('search=')
        ? page([product('match')])
        : path.includes('page=2')
          ? page([product('first'), product('second')], 2, 21)
          : page([product('first')], 1, 21, true),
    );
    setup();
    open();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Load more products' }),
    );
    await screen.findByRole('option', { name: /Product second/ });
    expect(screen.getAllByRole('option')).toHaveLength(2);
    search('match');
    await screen.findByRole('option', { name: /Product match/ });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(get.mock.calls.at(-1)?.[0]).toBe(
      '/products/workspace?page=1&limit=20&search=match',
    );
  });
  it('retains a selected label outside the current results and offers custom items on empty searches', async () => {
    get.mockResolvedValue(page([]));
    const { onSelect } = setup(product('saved', 'Previously selected monitor'));
    expect(
      screen.getByRole('button', { name: /Catalog product/ }).textContent,
    ).toContain('Previously selected monitor');
    open();
    search('missing');
    await screen.findByText('No matching products found.');
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Use a custom item' }));
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(
      screen.getByRole('button', { name: /Catalog product/ }).textContent,
    ).toContain('Custom item');
  });
  it('recovers from an API failure without changing the selected product', async () => {
    get
      .mockRejectedValueOnce(new ApiError('Unavailable', 503))
      .mockResolvedValue(page([product('first')]));
    const { onSelect } = setup(product('saved'));
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    await screen.findByRole('option', { name: /Product first/ });
    expect(onSelect).not.toHaveBeenCalled();
  });
  it('keeps loaded products when loading the next page fails and retries that page', async () => {
    get
      .mockResolvedValueOnce(page([product('first')], 1, 21, true))
      .mockRejectedValueOnce(new ApiError('Unavailable', 503))
      .mockResolvedValueOnce(page([product('second')], 2, 21));
    setup();
    open();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Load more products' }),
    );
    const retry = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.getByRole('option', { name: /Product first/ })).toBeTruthy();
    fireEvent.click(retry);
    await screen.findByRole('option', { name: /Product second/ });
    expect(get.mock.calls.at(-1)?.[0]).toBe(
      '/products/workspace?page=2&limit=20',
    );
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });
  it('cancels obsolete searches and ignores their late responses', async () => {
    let finishSlow: ((result: PageData<Product>) => void) | undefined;
    let slowSignal: AbortSignal | null | undefined;
    get.mockImplementation(async (path, options) => {
      if (path.includes('search=slow')) {
        slowSignal = options?.signal;
        return new Promise<PageData<Product>>((resolve) => {
          finishSlow = resolve;
        });
      }
      return page([product(path.includes('search=fast') ? 'fast' : 'first')]);
    });
    setup();
    open();
    await screen.findByRole('option', { name: /Product first/ });
    search('slow');
    await waitFor(() => expect(finishSlow).toBeDefined());
    search('fast');
    await screen.findByRole('option', { name: /Product fast/ });
    expect(slowSignal?.aborted).toBe(true);
    await act(async () => {
      finishSlow?.(page([product('slow')]));
    });
    expect(screen.queryByRole('option', { name: /Product slow/ })).toBeNull();
    expect(screen.getByRole('option', { name: /Product fast/ })).toBeTruthy();
  });
  it('does not retain another organization’s results while the next catalog is loading', async () => {
    get.mockImplementation(async (_path, options) =>
      options?.organization === 'org-a'
        ? page([product('private-a')])
        : page([product('private-b')]),
    );
    const view = setup();
    open();
    await screen.findByRole('option', { name: /private-a/ });
    view.switchOrg('org-b');
    expect(screen.queryByRole('option', { name: /private-a/ })).toBeNull();
    await screen.findByRole('option', { name: /private-b/ });
    expect(get.mock.calls.at(-1)?.[1]?.organization).toBe('org-b');
  });
  it('supports keyboard selection and Escape without closing the parent modal or submitting its form', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    clients.push(client);
    const close = vi.fn();
    const submit = vi.fn();
    const selected = vi.fn();
    render(
      <QueryClientProvider client={client}>
        <Modal title="Request" onClose={close}>
          <form onSubmit={submit}>
            <ProductPicker
              organizationId="org"
              value={null}
              onSelect={selected}
            />
          </form>
        </Modal>
      </QueryClientProvider>,
    );
    open();
    await screen.findByRole('option', { name: /Product first/ });
    const input = screen.getByPlaceholderText('Search by product name or SKU…');
    await waitFor(() => expect(document.activeElement).toBe(input));
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(selected).toHaveBeenCalledWith(product('first'));
    expect(submit).not.toHaveBeenCalled();
    open();
    fireEvent.keyDown(
      screen.getByPlaceholderText('Search by product name or SKU…'),
      { key: 'Escape' },
    );
    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText('Search by product name or SKU…'),
      ).toBeNull(),
    );
    expect(close).not.toHaveBeenCalled();
  });
  it('does not open or fetch when disabled', () => {
    setup(null, 'org', true);
    open();
    expect(get).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('lets a nested editor own Escape even before its popup layer is registered', () => {
    const close = vi.fn();
    const nestedEscape = vi.fn();
    render(
      <Modal title="Request" onClose={close}>
        <div data-dialog-escape-boundary onKeyDown={nestedEscape}>
          <input aria-label="Nested search" />
        </div>
      </Modal>,
    );
    fireEvent.keyDown(screen.getByLabelText('Nested search'), {
      key: 'Escape',
    });
    expect(nestedEscape).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
  });
  it('translates search, empty state and custom item actions to Vietnamese', async () => {
    await i18n.changeLanguage('vi');
    get.mockResolvedValue(page([]));
    setup();
    fireEvent.click(
      screen.getByRole('button', { name: /Sản phẩm trong danh mục/ }),
    );
    expect(
      screen.getByPlaceholderText('Tìm theo tên hoặc mã sản phẩm…'),
    ).toBeTruthy();
    await screen.findByText('Danh mục chưa có sản phẩm');
    expect(
      screen.getByRole('button', { name: 'Dùng mặt hàng tùy chỉnh' }),
    ).toBeTruthy();
  });
});
