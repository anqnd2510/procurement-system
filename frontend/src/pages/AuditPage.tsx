import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity, ShieldCheck } from 'lucide-react';
import {
  ListFilter,
  ListPagination,
  ListSearch,
  ListToolbar,
} from '../components/ListControls';
import { keepScopedData } from '../lib/query-state';
import { useDebouncedValue } from '../lib/use-debounced-value';
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
  const [resourceId, setResourceId] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    setAction('');
    setResourceType('');
    setResourceId('');
    setPage(1);
  }, [activeOrganization?.id]);
  const deferredId = useDebouncedValue(resourceId);
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
  if (deferredId.trim()) params.set('resourceId', deferredId.trim());
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
      deferredId,
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
        eyebrow="GOVERNANCE · TRACEABILITY"
        title="Audit trail"
        description="Review important procurement and inventory changes recorded by the backend."
      />
      {!canManage && activeOrganization && (
        <Notice tone="warning">
          {' '}
          {t(
            'The audit endpoint requires the OWNER or MANAGER organization role.',
          )}{' '}
        </Notice>
      )}
      {!activeOrganization && (
        <Notice tone="warning">
          {' '}
          {t('Select an organization to load its audit trail.')}{' '}
        </Notice>
      )}
      <div className="audit-summary-strip">
        <span className="audit-summary-icon">
          <ShieldCheck size={18} />
        </span>
        <div>
          <strong>{t('Append-only operational record')}</strong>
          <small>
            {t(
              'Audit events are stored in the same database transaction as the business change.',
            )}
          </small>
        </div>
        <span className="audit-scope">{t('ORGANIZATION SCOPED')}</span>
      </div>
      <Panel
        title="Recorded events"
        subtitle={t('{{count}} matching events', {
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
            label="Resource type"
            allLabel="All resource types"
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
          <ListSearch
            label="Resource ID (exact match)"
            placeholder="UUID"
            value={resourceId}
            onChange={(value) => {
              setResourceId(value);
              setPage(1);
            }}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setAction('');
              setResourceType('');
              setResourceId('');
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
            title="Audit access is restricted"
            description="Only organization owners and managers can inspect system audit events."
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
            title="No audit events match"
            description="Try clearing filters, or perform a supported procurement operation to create an event."
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
                      {t('Resource')} <code>{event.resourceId}</code> ·{' '}
                      {t('by')}{' '}
                      <strong>
                        {event.actor?.email ?? t('System / deleted user')}
                      </strong>
                    </p>
                    {event.metadata && (
                      <details className="audit-metadata">
                        <summary>{t('Event metadata')}</summary>
                        <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                      </details>
                    )}
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
      <div className="panel-footnote audit-note">
        {t(
          'Audit coverage currently includes purchase requests, purchase orders, and manual stock-in. Catalog, membership, and authentication actions are not represented by this audit API.',
        )}
      </div>
    </div>
  );
}
