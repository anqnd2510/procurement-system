import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity, Filter, ShieldCheck } from 'lucide-react';
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
  const { activeOrganization, canManage } = useOrganization();
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [page, setPage] = useState(1);
  const deferredAction = useDebouncedValue(action);
  const deferredType = useDebouncedValue(resourceType);
  const deferredId = useDebouncedValue(resourceId);
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (deferredAction.trim()) params.set('action', deferredAction.trim());
  if (deferredType.trim())
    params.set('resourceType', deferredType.trim().toUpperCase());
  if (deferredId.trim()) params.set('resourceId', deferredId.trim());
  const query = useQuery({
    placeholderData: keepScopedData<PageData<AuditLog>>([
      'audit-logs',
      activeOrganization?.id,
    ]),
    queryKey: [
      'audit-logs',
      activeOrganization?.id,
      deferredAction,
      deferredType,
      deferredId,
      page,
    ],
    queryFn: () =>
      api.get<PageData<AuditLog>>(`/audit-logs?${params.toString()}`),
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
        <div className="audit-filter-bar">
          <div className="audit-filter-title">
            <Filter size={15} />
            <span>{t('Filter events')}</span>
          </div>
          <label>
            <span>{t('Action')}</span>
            <input
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
              placeholder={t('e.g. PURCHASE_ORDER_RECEIVED')}
            />
          </label>
          <label>
            <span>{t('Resource type')}</span>
            <input
              value={resourceType}
              onChange={(event) => {
                setResourceType(event.target.value);
                setPage(1);
              }}
              placeholder="PURCHASE_REQUEST"
            />
          </label>
          <label>
            <span>{t('Resource ID')}</span>
            <input
              value={resourceId}
              onChange={(event) => {
                setResourceId(event.target.value);
                setPage(1);
              }}
              placeholder="UUID"
            />
          </label>
          <Button
            variant="secondary"
            onClick={() => {
              setAction('');
              setResourceType('');
              setResourceId('');
              setPage(1);
            }}
          >
            {' '}
            {t('Clear')}{' '}
          </Button>
        </div>
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
                      <strong>{t(event.action)}</strong>
                      <span className="audit-resource-tag">
                        {t(event.resourceType)}
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
            <div className="table-pagination">
              <span>
                {t('Page {{page}} of {{totalPages}} · newest first', {
                  page: query.data.meta.page,
                  totalPages: Math.max(1, query.data.meta.totalPages),
                })}
              </span>
              <div>
                <Button
                  variant="secondary"
                  disabled={query.isPlaceholderData || !query.data.meta.hasPrev}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  {' '}
                  {t('Previous')}{' '}
                </Button>
                <span className="page-number">{page}</span>
                <Button
                  variant="secondary"
                  disabled={query.isPlaceholderData || !query.data.meta.hasNext}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {' '}
                  {t('Next')}{' '}
                </Button>
              </div>
            </div>
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
