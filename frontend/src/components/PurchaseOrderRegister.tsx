import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { money, dateTime } from '../lib/format';
import { keepScopedData } from '../lib/query-state';
import { useDebouncedValue } from '../lib/use-debounced-value';
import { useOrganization } from '../organizations/OrganizationContext';
import type { PageData, PurchaseOrder } from '../types';
import {
  Button,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  Panel,
  RefreshIndicator,
  StatusBadge,
} from './ui';

export function PurchaseOrderRegister({
  onOpen,
  compact = false,
  initialStatus = '',
}: {
  onOpen: (id: string) => void;
  compact?: boolean;
  initialStatus?: string;
}) {
  const { t } = useTranslation();
  const { activeOrganizationId } = useOrganization();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search);
  const query = useQuery({
    queryKey: [
      'purchase-orders',
      activeOrganizationId,
      page,
      status,
      term,
      compact,
    ],
    queryFn: () =>
      api.get<PageData<PurchaseOrder>>(
        `/purchase-orders?${new URLSearchParams({ page: String(page), limit: compact ? '5' : '10', ...(status ? { status } : {}), ...(term ? { search: term } : {}) })}`,
        { organization: activeOrganizationId || false },
      ),
    enabled: Boolean(activeOrganizationId),
    placeholderData: keepScopedData<PageData<PurchaseOrder>>([
      'purchase-orders',
      activeOrganizationId,
    ]),
  });

  return (
    <Panel
      title={compact ? 'Recent purchase orders' : 'Order register'}
      subtitle="Live orders in the selected organization"
    >
      {!compact && (
        <div className="flex flex-wrap items-end gap-4 px-5 pt-4">
          <FormField label="Search orders">
            <input
              value={search}
              maxLength={100}
              placeholder={t('Order number or supplier…')}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </FormField>
          <FormField label="Status">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('All statuses')}</option>
              {['DRAFT', 'ISSUED', 'RECEIVED', 'CANCELLED'].map((value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      )}
      <RefreshIndicator fetching={query.isFetching && !query.isLoading} />
      {!activeOrganizationId ? (
        <EmptyState
          title="Choose an organization"
          description="Choose an organization to continue."
        />
      ) : query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !query.data?.items.length ? (
        <EmptyState
          title="No purchase orders found"
          description="Create an order from an approved request or adjust the filters."
        />
      ) : (
        <>
          <div className="table-scroll" aria-busy={query.isFetching}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('ORDER')}</th>
                  <th>{t('SUPPLIER')}</th>
                  <th>{t('STATUS')}</th>
                  <th>{t('TOTAL')}</th>
                  {!compact && <th>{t('CREATED')}</th>}
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <button
                        className="text-brand font-semibold text-left hover:underline dark:text-blue-300"
                        onClick={() => onOpen(order.id)}
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    <td>{order.supplierName}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>{money(order.totalAmount)}</td>
                    {!compact && <td>{dateTime(order.createdAt)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!compact && (
            <div className="table-pagination">
              <span>
                {t('Page {{page}} of {{totalPages}}', {
                  page: query.data.meta.page,
                  totalPages: Math.max(1, query.data.meta.totalPages),
                })}
              </span>
              <div>
                <Button
                  variant="secondary"
                  disabled={query.isPlaceholderData || !query.data.meta.hasPrev}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={query.isPlaceholderData || !query.data.meta.hasNext}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
