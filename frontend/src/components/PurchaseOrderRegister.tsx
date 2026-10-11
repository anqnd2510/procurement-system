import {
  ListFilter,
  ListPagination,
  ListSearch,
  ListToolbar,
} from './ListControls';
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
  EmptyState,
  ErrorState,
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
        <ListToolbar>
          <ListSearch
            label="Search orders"
            placeholder="Order number or supplier…"
            value={search}
            onChange={(value) => {
              setSearch(value.slice(0, 100));
              setPage(1);
            }}
          />
          <ListFilter
            label="Status"
            allLabel="All statuses"
            value={status}
            options={['DRAFT', 'ISSUED', 'RECEIVED', 'CANCELLED'].map(
              (value) => ({ value, label: value }),
            )}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
        </ListToolbar>
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
            <ListPagination
              meta={query.data.meta}
              busy={query.isPlaceholderData}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </Panel>
  );
}
