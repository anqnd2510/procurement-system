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
import { ProductPicker } from '../components/ProductPicker';
import { ReorderManagement } from '../components/ReorderManagement';
import { ListFilter, ListPagination } from '../components/ListControls';
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
import { useNotifications } from '../components/NotificationProvider';
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
  const { notify } = useNotifications();
  const supportedOrganization = Boolean(activeOrganization);
  const client = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const productId = selectedProduct?.id ?? '';
  const [quantity, setQuantity] = useState('');
  const [stockError, setStockError] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [transactionType, setTransactionType] = useState<
    '' | InventoryTransactionType
  >('');
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
      notify('success', 'Stock receipt recorded.');
      void client.setQueryData(
        ['inventory', activeOrganization?.id, productId],
        inventory,
      );
      void client.invalidateQueries({ queryKey: ['inventory'] });
      void client.invalidateQueries({ queryKey: ['inventory-transactions'] });
      void client.invalidateQueries({ queryKey: ['reorder-alerts'] });
      void client.invalidateQueries({ queryKey: ['audit-logs'] });
      void invalidateDashboard(client, activeOrganization?.id);
    },
    onError: (error) => setStockError(getErrorMessage(error)),
  });
  const inventoryNotFound =
    inventoryQuery.error instanceof ApiError &&
    inventoryQuery.error.status === 404;
  useEffect(() => {
    setSelectedProduct(null);
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
      <PageHeading eyebrow="OPERATIONS · STOCK CONTROL" title="Inventory" />
      {!supportedOrganization && (
        <Notice tone="warning">
          {t('Choose an organization to continue.')}
        </Notice>
      )}
      <div className="inventory-layout">
        <Panel
          title="Select a product"
          subtitle={t('Choose a product to view its stock level.')}
        >
          {!supportedOrganization ? (
            <EmptyState
              title="Choose an organization"
              description="Choose an organization to continue."
            />
          ) : (
            <div className="inventory-picker">
              <ProductPicker
                organizationId={activeOrganization?.id ?? ''}
                value={selectedProduct}
                label="Product"
                emptyLabel="Choose a product…"
                clearLabel="Clear selection"
                disabled={stockMutation.isPending}
                onSelect={(product) => {
                  setSelectedProduct(product);
                  setHistoryPage(1);
                  setTransactionType('');
                  setQuantity('');
                  setStockError('');
                }}
              />
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
          subtitle={t('Current stock levels for the selected product.')}
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
              <p>{t('No stock has been recorded for this product yet.')}</p>
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

      {canManage && supportedOrganization && (
        <ReorderManagement
          organizationId={activeOrganization?.id ?? ''}
          productId={productId}
          productName={selectedProduct?.name ?? ''}
        />
      )}

      {canManage && supportedOrganization && (
        <div className="inventory-lower-grid">
          <Panel title="Receive stock">
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
          </Panel>
        </div>
      )}

      {supportedOrganization && productId && inventoryQuery.data && (
        <Panel
          title={t('Stock activity')}
          subtitle={t(
            'Review received stock and changes made while handling purchase requests.',
          )}
          action={
            <ListFilter
              label="Activity type"
              allLabel="All activity types"
              value={transactionType}
              options={[
                { value: 'STOCK_IN', label: 'STOCK_IN' },
                { value: 'RESERVE', label: 'RESERVE' },
                { value: 'RELEASE', label: 'RELEASE' },
                { value: 'FULFILL', label: 'FULFILL' },
              ]}
              onChange={(value) => {
                setTransactionType(value as '' | InventoryTransactionType);
                setHistoryPage(1);
              }}
            />
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
                      <th>{t('SOURCE')}</th>
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
                            <span>{t('Purchase request or order')}</span>
                          ) : (
                            <span className="muted">
                              {t('Direct stock entry')}
                            </span>
                          )}
                        </td>
                        <td>{dateTime(transaction.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ListPagination
                meta={historyQuery.data.meta}
                busy={historyQuery.isPlaceholderData}
                onPageChange={setHistoryPage}
              />
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
