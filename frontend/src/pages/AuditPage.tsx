import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Activity } from 'lucide-react';
import {
  ListFilter,
  ListPagination,
  ListToolbar,
} from '../components/ListControls';
import { keepScopedData } from '../lib/query-state';
import { RefreshIndicator } from '../components/ui';
import { api } from '../lib/api';
import { dateTime } from '../lib/format';
import type { AuditLog, PageData } from '../types';
import { useOrganization } from '../organizations/OrganizationContext';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
  PageHeading,
  Panel,
} from '../components/ui';

export function AuditPage() {
  const { t } = useTranslation();
  const eventLabel = (value: string) =>
    t(value, {
      defaultValue: value
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/^./, (first) => first.toUpperCase()),
    });
  const { activeOrganization, canManage } = useOrganization();
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    setAction('');
    setResourceType('');
    setPage(1);
  }, [activeOrganization?.id]);
  const filtersQuery = useQuery({
    queryKey: ['audit-filter-options', activeOrganization?.id],
    queryFn: () =>
      api.get<{ actions: string[]; resourceTypes: string[] }>(
        '/audit-logs/filters',
        { organization: activeOrganization?.id },
      ),
    enabled: Boolean(activeOrganization && canManage),
  });
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (action) params.set('action', action);
  if (resourceType) params.set('resourceType', resourceType);
  const query = useQuery({
    placeholderData: keepScopedData<PageData<AuditLog>>([
      'audit-logs',
      activeOrganization?.id,
    ]),
    queryKey: [
      'audit-logs',
      activeOrganization?.id,
      action,
      resourceType,
      page,
    ],
    queryFn: () =>
      api.get<PageData<AuditLog>>(`/audit-logs?${params.toString()}`, {
        organization: activeOrganization?.id,
      }),
    enabled: Boolean(activeOrganization && canManage),
  });

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="ACTIVITY · CHANGES"
        title="Activity history"
        description={t('Changes made in this organization.')}
      />
      {!canManage && activeOrganization && (
        <Notice tone="warning">
          {' '}
          {t('Ask an organization owner or manager for access.')}{' '}
        </Notice>
      )}
      {!activeOrganization && (
        <Notice tone="warning">
          {' '}
          {t('Select an organization to view its activity history.')}{' '}
        </Notice>
      )}
      <Panel
        title="Recent activity"
        subtitle={t('{{count}} recorded activities', {
          count: query.data?.meta.total ?? '—',
        })}
      >
        <ListToolbar>
          <ListFilter
            label="Action"
            allLabel="All actions"
            value={action}
            options={(filtersQuery.data?.actions ?? []).map((value) => ({
              value,
              label: eventLabel(value),
            }))}
            disabled={filtersQuery.isError}
            onChange={(value) => {
              setAction(value);
              setPage(1);
            }}
          />
          <ListFilter
            label="Activity type"
            allLabel="All activity types"
            value={resourceType}
            options={(filtersQuery.data?.resourceTypes ?? []).map((value) => ({
              value,
              label: eventLabel(value),
            }))}
            disabled={filtersQuery.isError}
            onChange={(value) => {
              setResourceType(value);
              setPage(1);
            }}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setAction('');
              setResourceType('');
              setPage(1);
            }}
          >
            {t('Clear filters')}
          </Button>
        </ListToolbar>
        {filtersQuery.isError && canManage && (
          <div className="px-5 py-2">
            <ErrorState
              error={filtersQuery.error}
              onRetry={() => void filtersQuery.refetch()}
            />
          </div>
        )}
        <RefreshIndicator fetching={query.isFetching && !query.isLoading} />
        {!canManage ? (
          <EmptyState
            title="This page is not available"
            description="Ask an organization owner or manager for access."
          />
        ) : query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState
            error={query.error}
            onRetry={() => void query.refetch()}
          />
        ) : !query.data?.items.length ? (
          <EmptyState
            title="No activity found"
            description="Try adjusting the filters."
          />
        ) : (
          <>
            <div className="audit-timeline">
              {query.data.items.map((event) => (
                <article className="audit-event" key={event.id}>
                  <span className="audit-event-icon">
                    <Activity size={15} />
                  </span>
                  <div className="audit-event-body">
                    <div className="audit-event-heading">
                      <strong>{eventLabel(event.action)}</strong>
                      <span className="audit-resource-tag">
                        {eventLabel(event.resourceType)}
                      </span>
                    </div>
                    <p>
                      <strong>{event.resourceName ?? t('Related item')}</strong>{' '}
                      · {t('by')}{' '}
                      <strong>
                        {event.actor?.email ?? t('System / deleted user')}
                      </strong>
                    </p>
                    {formatAuditDetails(event, t).map((detail) => (
                      <p className="audit-human-detail" key={detail}>
                        {detail}
                      </p>
                    ))}
                  </div>
                  <time>{dateTime(event.createdAt)}</time>
                </article>
              ))}
            </div>
            <ListPagination
              meta={query.data.meta}
              busy={query.isPlaceholderData}
              onPageChange={setPage}
            />
          </>
        )}
      </Panel>
    </div>
  );
}

function formatAuditDetails(event: AuditLog, t: TFunction) {
  const metadata = event.metadata;
  if (!metadata) return [];

  const after = asObject(metadata.after);
  if (event.action === 'INVENTORY_REORDER_POLICY_UPDATED' && after) {
    return [
      t('Alert below: {{quantity}} items', {
        quantity: String(after.reorderPoint ?? '—'),
      }),
      t('Restock up to: {{quantity}} items', {
        quantity: String(after.targetStock ?? '—'),
      }),
    ];
  }

  if (typeof metadata.quantity === 'number') {
    return [t('{{quantity}} items received', { quantity: metadata.quantity })];
  }

  if (
    typeof metadata.fromStatus === 'string' &&
    typeof metadata.toStatus === 'string'
  ) {
    return [
      t('{{from}} → {{to}}', {
        from: t(metadata.fromStatus),
        to: t(metadata.toStatus),
      }),
    ];
  }

  if (typeof metadata.orderNumber === 'string') {
    return [metadata.orderNumber];
  }

  if (typeof metadata.totalAmount === 'string') {
    return [t('Total: {{amount}}', { amount: metadata.totalAmount })];
  }

  if (Array.isArray(metadata.fields) || metadata.itemsReplaced === true) {
    return [t('Request details updated.')];
  }

  return [];
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
