import { ErrorMessage } from '../components/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownToLine,
  CircleHelp,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';
import { NumberInput } from '../components/ui/number-input';
import { numericError } from '../lib/numeric-input';
import { keepScopedData, invalidateDashboard } from '../lib/query-state';
import { RefreshIndicator } from '../components/ui';
import { ApiError, api, getErrorMessage } from '../lib/api';
import { currentLocale, dateTime } from '../lib/format';
import type {
  Inventory,
  InventoryTransaction,
  InventoryTransactionType,
  PageData,
  Product,
} from '../types';
import { useOrganization } from '../organizations/OrganizationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useTranslation } from 'react-i18next';
import {
  Button,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  Notice,
  PageHeading,
  Panel,
  StatusBadge,
} from '../components/ui';

export function InventoryPage() {
  const { t } = useTranslation();
  const { activeOrganization, canManage } = useOrganization();
  const supportedOrganization = Boolean(activeOrganization);
  const client = useQueryClient();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [stockError, setStockError] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [transactionType, setTransactionType] = useState<
    '' | InventoryTransactionType
  >('');
  const productsQuery = useQuery({
    queryKey: ['products', activeOrganization?.id, 'inventory-picker'],
    queryFn: () =>
      api.get<PageData<Product>>('/products/workspace?page=1&limit=100', {
        organization: activeOrganization?.id,
      }),
    enabled: supportedOrganization,
  });
  const inventoryQuery = useQuery({
    queryKey: ['inventory', activeOrganization?.id, productId],
    queryFn: () =>
      api.get<Inventory>(`/inventories/workspace/${productId}`, {
        organization: activeOrganization?.id,
      }),
    enabled: Boolean(productId) && supportedOrganization,
  });
  const historyQuery = useQuery({
    placeholderData: keepScopedData<PageData<InventoryTransaction>>([
      'inventory-transactions',
      activeOrganization?.id,
      productId,
    ]),
    queryKey: [
      'inventory-transactions',
      activeOrganization?.id,
      productId,
      historyPage,
      transactionType,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(historyPage),
        limit: '8',
      });
      if (transactionType) params.set('type', transactionType);
      return api.get<PageData<InventoryTransaction>>(
        `/inventories/${productId}/transactions?${params.toString()}`,
      );
    },
    enabled: Boolean(inventoryQuery.data?.id) && supportedOrganization,
  });
  const stockMutation = useMutation({
    mutationFn: () =>
      api.post<Inventory>('/inventories/stock-in', {
        productId,
        quantity: Number(quantity),
      }),
    onSuccess: (inventory) => {
      setQuantity('');
      setStockError('');
      void client.setQueryData(
        ['inventory', activeOrganization?.id, productId],
        inventory,
      );
      void client.invalidateQueries({ queryKey: ['inventory'] });
      void client.invalidateQueries({ queryKey: ['inventory-transactions'] });
      void client.invalidateQueries({ queryKey: ['audit-logs'] });
      void invalidateDashboard(client, activeOrganization?.id);
    },
    onError: (error) => setStockError(getErrorMessage(error)),
  });
  const inventoryNotFound =
    inventoryQuery.error instanceof ApiError &&
    inventoryQuery.error.status === 404;
  const selectedProduct = productsQuery.data?.items.find(
    (product) => product.id === productId,
  );

  useEffect(() => {
    setProductId('');
    setQuantity('');
    setHistoryPage(1);
    setStockError('');
  }, [activeOrganization?.id]);

  function stockIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = numericError(quantity, { min: 1, max: 2147483647 });
    setStockError(error);
    if (!error) stockMutation.mutate();
  }

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="OPERATIONS · STOCK CONTROL"
        title="Inventory"
        description="Review available and reserved stock, then record incoming quantities."
      />
      {!supportedOrganization && (
        <Notice tone="warning">
          {t('Choose an organization to continue.')}
        </Notice>
      )}
      {!canManage && supportedOrganization && (
        <Notice>
          {t(
            'Stock-in is restricted to OWNER and MANAGER organization roles. You can still review stock levels.',
          )}
        </Notice>
      )}

      <div className="inventory-layout">
        <Panel
          title="Select a product"
          subtitle="Inventory is retrieved by product ID from the API."
        >
          {!supportedOrganization ? (
            <EmptyState
              title="Choose an organization"
              description="Choose an organization to continue."
            />
          ) : productsQuery.isLoading ? (
            <LoadingState label="Loading catalog…" />
          ) : productsQuery.isError ? (
            <ErrorState
              error={productsQuery.error}
              onRetry={() => void productsQuery.refetch()}
            />
          ) : (
            <div className="inventory-picker">
              <FormField label="Product">
                <select
                  value={productId}
                  onChange={(event) => {
                    setProductId(event.target.value);
                    setHistoryPage(1);
                    setTransactionType('');
                  }}
                >
                  <option value="">{t('Choose a product…')}</option>
                  {productsQuery.data?.items.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {product.sku}
                    </option>
                  ))}
                </select>
              </FormField>
              {productsQuery.data &&
                productsQuery.data.meta.total >
                  productsQuery.data.items.length && (
                  <small className="field-note">
                    {t(
                      'Showing the first {{shown}} of {{total}} products. Use the Products page to navigate the full catalog.',
                      {
                        shown: productsQuery.data.items.length,
                        total: productsQuery.data.meta.total,
                      },
                    )}
                  </small>
                )}
              {selectedProduct && (
                <div className="selected-product-card">
                  <div className="selected-product-avatar">
                    {selectedProduct.name.slice(0, 1)}
                  </div>
                  <div>
                    <strong>{selectedProduct.name}</strong>
                    <span>
                      {selectedProduct.sku} ·{' '}
                      {selectedProduct.category?.name ?? t('Uncategorized')}
                    </span>
                  </div>
                  <PackageCheck size={17} />
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel
          title="Stock position"
          subtitle="Current authoritative balance returned by the inventory API"
          className="stock-position-panel"
        >
          {!productId ? (
            <EmptyState
              title="Choose a product to inspect stock"
              description="Select from the catalog to load its current inventory balance."
            />
          ) : inventoryQuery.isLoading ? (
            <LoadingState label="Retrieving stock position…" />
          ) : inventoryQuery.isError && !inventoryNotFound ? (
            <ErrorState
              error={inventoryQuery.error}
              onRetry={() => void inventoryQuery.refetch()}
            />
          ) : inventoryNotFound ? (
            <div className="inventory-missing">
              <div className="inventory-missing-icon">
                <CircleHelp size={21} />
              </div>
              <strong>{t('No inventory record yet')}</strong>
              <p>
                {t('Stock-in can initialize this product’s inventory record.')}
              </p>
              <span className="muted">{selectedProduct?.sku}</span>
            </div>
          ) : inventoryQuery.data ? (
            <div className="stock-summary">
              <div className="stock-product-title">
                <div>
                  <span className="eyebrow">
                    {inventoryQuery.data.productSku}
                  </span>
                  <h3>{inventoryQuery.data.productName}</h3>
                </div>
                <button
                  className="icon-button"
                  aria-label={t('Refresh inventory')}
                  onClick={() => void inventoryQuery.refetch()}
                >
                  <RefreshCw size={15} />
                </button>
              </div>
              <div className="stock-stat-grid">
                <StockStat
                  label="Available"
                  value={inventoryQuery.data.qtyAvailable}
                  tone="available"
                />
                <StockStat
                  label="Reserved"
                  value={inventoryQuery.data.qtyReserved}
                  tone="reserved"
                />
                <StockStat
                  label="Total on hand"
                  value={inventoryQuery.data.qtyTotal}
                  tone="total"
                />
              </div>
              <div className="stock-updated">
                {t('Last updated {{date}}', {
                  date: dateTime(inventoryQuery.data.updatedAt),
                })}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="inventory-lower-grid">
        <Panel
          title="Receive stock"
          subtitle="Adds quantity to available inventory in a backend transaction"
        >
          <form className="stock-in-form" onSubmit={stockIn}>
            <FormField label="Quantity received">
              <NumberInput
                min={1}
                max={2147483647}
                placeholder={t('e.g. 24')}
                value={quantity}
                onValueChange={setQuantity}
                required
                disabled={!productId || !canManage || !supportedOrganization}
              />
            </FormField>
            <div className="stock-in-submit">
              <Button
                type="submit"
                loading={stockMutation.isPending}
                disabled={!productId || !canManage || !supportedOrganization}
              >
                <ArrowDownToLine size={16} /> {t('Record stock-in')}{' '}
              </Button>
            </div>
            {stockError && <ErrorMessage error={stockError} />}
          </form>
          <div className="transaction-note">
            <span className="note-icon note-icon-green">
              <ArrowDownToLine size={14} />
            </span>
            <p>
              <strong>{t('Balance and ledger update atomically')}</strong>
              <small>
                {t(
                  'If a request times out, check the current balance and movement history before recording the same receipt again.',
                )}
              </small>
            </p>
          </div>
        </Panel>
        <Panel
          title="Inventory coverage"
          subtitle="Current backend capabilities"
        >
          <div className="coverage-list">
            <div>
              <span className="coverage-check">✓</span>
              <span>
                <strong>{t('Current balance')}</strong>
                <small>{t('Available, reserved, and total quantities')}</small>
              </span>
              <span className="coverage-pill">{t('AVAILABLE')}</span>
            </div>
            <div>
              <span className="coverage-check">✓</span>
              <span>
                <strong>{t('Manual stock-in')}</strong>
                <small>{t('Organization manager workflow')}</small>
              </span>
              <span className="coverage-pill">{t('AVAILABLE')}</span>
            </div>
            <div>
              <span className="coverage-pending">i</span>
              <span>
                <strong>{t('Transaction history')}</strong>
                <small>
                  {t('Paginated history is available from the inventory API')}
                </small>
              </span>
              <span className="coverage-pill">{t('AVAILABLE')}</span>
            </div>
            <div>
              <span className="coverage-pending">i</span>
              <span>
                <strong>{t('Reorder threshold')}</strong>
                <small>
                  {t(
                    'No threshold exists in the current product/inventory schema',
                  )}
                </small>
              </span>
              <span className="coverage-pill coverage-limited">
                {t('API GAP')}
              </span>
            </div>
          </div>
        </Panel>
      </div>

      {supportedOrganization && productId && inventoryQuery.data && (
        <Panel
          title="Inventory transaction history"
          subtitle="A paginated ledger of stock-in, reservations, releases, and fulfillment events. Quantities are event amounts, not signed balance deltas."
          action={
            <FormField label="Movement type">
              <Select
                value={transactionType || 'ALL'}
                onValueChange={(value) => {
                  setTransactionType(
                    value === 'ALL' ? '' : (value as InventoryTransactionType),
                  );
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger aria-label={t('Movement type')}>
                  <SelectValue placeholder={t('All movements')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('All movements')}</SelectItem>
                  <SelectItem value="STOCK_IN">{t('Stock-in')}</SelectItem>
                  <SelectItem value="RESERVE">{t('Reserve')}</SelectItem>
                  <SelectItem value="RELEASE">{t('Release')}</SelectItem>
                  <SelectItem value="FULFILL">{t('Fulfill')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          }
        >
          <RefreshIndicator
            fetching={historyQuery.isFetching && !historyQuery.isLoading}
          />
          {historyQuery.isLoading ? (
            <LoadingState label="Loading inventory history…" />
          ) : historyQuery.isError ? (
            <ErrorState
              error={historyQuery.error}
              onRetry={() => void historyQuery.refetch()}
            />
          ) : historyQuery.data?.items.length ? (
            <>
              <div className="table-scroll">
                <table className="data-table inventory-history-table">
                  <thead>
                    <tr>
                      <th>{t('ACTIVITY')}</th>
                      <th>{t('QUANTITY')}</th>
                      <th>{t('REFERENCE')}</th>
                      <th>{t('RECORDED')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyQuery.data.items.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <div className="history-activity">
                            <StatusBadge status={transaction.type} />
                            <span>
                              {t(transactionDescription(transaction.type))}
                            </span>
                          </div>
                        </td>
                        <td className="history-quantity">
                          {transaction.quantity.toLocaleString(currentLocale())}
                        </td>
                        <td>
                          {transaction.referenceId ? (
                            <code title={transaction.referenceId}>
                              {transaction.referenceId.slice(0, 8)}…
                            </code>
                          ) : (
                            <span className="muted">{t('Manual entry')}</span>
                          )}
                        </td>
                        <td>{dateTime(transaction.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-pagination">
                <span>
                  {t('Showing {{shown}} of {{total}} ledger events', {
                    shown: historyQuery.data.items.length,
                    total: historyQuery.data.meta.total,
                  })}
                </span>
                <div>
                  <Button
                    variant="secondary"
                    disabled={
                      historyQuery.isPlaceholderData ||
                      !historyQuery.data.meta.hasPrev
                    }
                    onClick={() =>
                      setHistoryPage((page) => Math.max(1, page - 1))
                    }
                  >
                    {' '}
                    {t('Previous')}{' '}
                  </Button>
                  <span>
                    {t('Page {{page}} of {{totalPages}}', {
                      page: historyQuery.data.meta.page,
                      totalPages: Math.max(
                        1,
                        historyQuery.data.meta.totalPages,
                      ),
                    })}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={
                      historyQuery.isPlaceholderData ||
                      !historyQuery.data.meta.hasNext
                    }
                    onClick={() => setHistoryPage((page) => page + 1)}
                  >
                    {' '}
                    {t('Next')}{' '}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="No inventory movements yet"
              description="Stock events will appear here when stock is received or a purchase request changes inventory."
            />
          )}
        </Panel>
      )}
    </div>
  );
}

function transactionDescription(type: InventoryTransactionType) {
  switch (type) {
    case 'STOCK_IN':
      return 'Incoming stock recorded';
    case 'RESERVE':
      return 'Stock held for a request';
    case 'RELEASE':
      return 'Reserved stock returned';
    case 'FULFILL':
      return 'Reserved stock fulfilled';
  }
}

function StockStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`stock-stat stock-${tone}`}>
      <span>{label}</span>
      <strong>{value.toLocaleString(currentLocale())}</strong>
      <div className="stock-stat-line" />
    </div>
  );
}
