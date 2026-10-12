import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Clock3,
  ClipboardList,
  PackageCheck,
  PackageSearch,
  Plus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PurchaseOrderRegister } from '../components/PurchaseOrderRegister';
import { RefreshIndicator } from '../components/ui';
import { api } from '../lib/api';
import { currentLocale, dateTime, money } from '../lib/format';
import type {
  DashboardSummary,
  PageData,
  PurchaseRequest,
  PurchaseRequestStatus,
} from '../types';
import { useOrganization } from '../organizations/OrganizationContext';
import { useAuth } from '../auth/AuthContext';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
  Panel,
  StatusBadge,
} from '../components/ui';

const statuses: PurchaseRequestStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'FULFILLED',
];

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeOrganization } = useOrganization();
  const { user } = useAuth();
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', activeOrganization?.id],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
    enabled: Boolean(activeOrganization),
  });
  const requestQuery = useQuery({
    queryKey: ['purchase-requests', activeOrganization?.id, 'recent'],
    queryFn: () =>
      api.get<PageData<PurchaseRequest>>('/purchase-requests?page=1&limit=6'),
    enabled: Boolean(activeOrganization),
  });
  const stageCounts = statuses.map((status) => ({
    status,
    count: summaryQuery.data?.purchaseRequestsByStatus[status] ?? 0,
    loading: summaryQuery.isLoading,
  }));
  const isLoading =
    Boolean(activeOrganization) &&
    (requestQuery.isLoading || summaryQuery.isLoading);

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="OPERATIONS · OVERVIEW"
        title={`${t(`Good ${greeting()}`)}, ${user?.email.split('@')[0] ?? t('there')}`}
        description={t('Here’s what is happening in {{organization}} today.', {
          organization: activeOrganization?.name ?? t('your workspace'),
        })}
        action={
          <Link className="button button-primary" to="/requests?new=1">
            <Plus size={16} /> {t('New purchase request')}
          </Link>
        }
      />

      {!activeOrganization && (
        <div className="welcome-card">
          <div className="welcome-orbit">
            <Boxes size={27} />
          </div>
          <div>
            <span className="eyebrow eyebrow-light">
              {t('FIRST, SET UP YOUR WORKSPACE')}
            </span>
            <h2>{t('Procurement starts with an organization.')}</h2>
            <p>
              {t(
                'Create an organization to invite your team and begin routing requests.',
              )}
            </p>
          </div>
          <Link className="button button-light" to="/organization">
            {t('Set up organization')} <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <RefreshIndicator
        fetching={summaryQuery.isFetching && !summaryQuery.isLoading}
      />
      {summaryQuery.isError && (
        <ErrorState
          error={summaryQuery.error}
          onRetry={() => void summaryQuery.refetch()}
        />
      )}
      <div className="metric-grid">
        <MetricCard
          icon={<ClipboardList size={18} />}
          label={t('Purchase requests')}
          value={
            isLoading
              ? '…'
              : (summaryQuery.data?.purchaseRequestsTotal.toLocaleString(
                  currentLocale(),
                ) ?? '—')
          }
          detail={t('Across all workflow stages')}
          tone="blue"
        />
        <MetricCard
          icon={<Clock3 size={18} />}
          label={t('Awaiting review')}
          value={
            summaryQuery.isLoading
              ? '…'
              : (summaryQuery.data?.awaitingReviewCount.toLocaleString(
                  currentLocale(),
                ) ?? '—')
          }
          detail={t('Submitted for a decision')}
          tone="amber"
        />
        <MetricCard
          icon={<PackageSearch size={18} />}
          label={t('Active products')}
          value={
            summaryQuery.isLoading
              ? '…'
              : (summaryQuery.data?.activeProducts.toLocaleString(
                  currentLocale(),
                ) ?? '—')
          }
          detail={t('Active products in this organization')}
          tone="mint"
        />
        <MetricCard
          icon={<PackageCheck size={18} />}
          label={t('Open purchase orders')}
          value={
            summaryQuery.isLoading
              ? '…'
              : (summaryQuery.data?.openPurchaseOrdersCount.toLocaleString(
                  currentLocale(),
                ) ?? '—')
          }
          detail={t('Draft or issued orders')}
          tone="violet"
        />
        <MetricCard
          icon={<Boxes size={18} />}
          label={t('Available stock')}
          value={
            summaryQuery.isLoading
              ? '…'
              : (summaryQuery.data?.inventoryAvailable.toLocaleString(
                  currentLocale(),
                ) ?? '—')
          }
          detail={t('{{count}} tracked products', {
            count:
              summaryQuery.data?.inventoryTrackedProducts.toLocaleString(
                currentLocale(),
              ) ?? '—',
          })}
          tone="mint"
        />
        <MetricCard
          icon={<Clock3 size={18} />}
          label={t('Reserved stock')}
          value={
            summaryQuery.isLoading
              ? '…'
              : (summaryQuery.data?.inventoryReserved.toLocaleString(
                  currentLocale(),
                ) ?? '—')
          }
          detail={t('Held by active workflows')}
          tone="amber"
        />
      </div>

      <div className="dashboard-grid">
        <Panel
          title={t('Request pipeline')}
          subtitle={t('Current activity in this organization')}
          className="pipeline-panel"
        >
          {summaryQuery.isError ? (
            <ErrorState
              error={summaryQuery.error}
              onRetry={() => void summaryQuery.refetch()}
            />
          ) : (
            <div className="pipeline-list">
              {stageCounts
                .filter((stage) => stage.status !== 'CANCELLED')
                .map((stage) => {
                  const max = Math.max(
                    1,
                    ...stageCounts.map((entry) => entry.count),
                  );
                  return (
                    <Link
                      to={`/requests?status=${stage.status}`}
                      key={stage.status}
                      className="pipeline-row"
                    >
                      <span
                        className={`pipeline-marker pipeline-${stage.status.toLowerCase()}`}
                      />
                      <span className="pipeline-label">
                        {t(stage.status, {
                          defaultValue: stage.status.replaceAll('_', ' '),
                        })}
                      </span>
                      <span className="pipeline-track">
                        <span
                          style={{
                            width: `${Math.max(stage.count ? 6 : 0, (stage.count / max) * 100)}%`,
                          }}
                        />
                      </span>
                      <strong>{stage.loading ? '—' : stage.count}</strong>
                      <ArrowRight size={14} />
                    </Link>
                  );
                })}
            </div>
          )}
        </Panel>

        <Panel
          title={t('Recent requests')}
          subtitle={t('Latest activity in this organization')}
          action={
            <Link className="text-link" to="/requests">
              {t('View all')} <ArrowRight size={14} />
            </Link>
          }
        >
          {requestQuery.isLoading ? (
            <LoadingState />
          ) : requestQuery.isError ? (
            <ErrorState
              error={requestQuery.error}
              onRetry={() => void requestQuery.refetch()}
            />
          ) : requestQuery.data?.items.length ? (
            <div className="recent-list">
              {requestQuery.data.items.slice(0, 5).map((request) => (
                <Link
                  to={`/requests?open=${request.id}`}
                  className="recent-row"
                  key={request.id}
                >
                  <span className="recent-avatar">
                    {request.department?.code?.slice(0, 2) ?? 'PR'}
                  </span>
                  <span className="recent-main">
                    <strong>{request.title}</strong>
                    <small>
                      {request.department?.name ?? t('Department')} ·{' '}
                      {request.requester?.email ?? t('Requester')}
                    </small>
                  </span>
                  <span className="recent-side">
                    <strong className="recent-amount">
                      {money(request.totalAmount)}
                    </strong>
                    <span className="recent-meta">
                      <StatusBadge status={request.status} />
                      <small>{dateTime(request.createdAt)}</small>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('No purchase requests yet')}
              description={t(
                'Create the first request to start your organization’s approval workflow.',
              )}
              action={
                <Link className="button button-secondary" to="/requests?new=1">
                  {t('Create a request')}
                </Link>
              }
            />
          )}
        </Panel>
      </div>

      <PurchaseOrderRegister
        key={activeOrganization?.id}
        compact
        onOpen={(id) => navigate(`/purchase-orders?orderId=${id}`)}
      />
      <div className="dashboard-bottom-grid">
        <Panel title="Common actions" subtitle="Move work forward">
          <div className="quick-actions">
            <Link to="/requests?new=1">
              <span className="quick-action-icon blue">
                <ClipboardList size={18} />
              </span>
              <span>
                <strong>{t('Start a request')}</strong>
                <small>{t('Draft items for approval')}</small>
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link to="/inventory">
              <span className="quick-action-icon green">
                <Boxes size={18} />
              </span>
              <span>
                <strong>{t('Review inventory')}</strong>
                <small>{t('Check available quantities')}</small>
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link to="/products">
              <span className="quick-action-icon violet">
                <PackageSearch size={18} />
              </span>
              <span>
                <strong>{t('Manage catalog')}</strong>
                <small>{t('Products and categories')}</small>
              </span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </Panel>
        <Panel
          title="Order value by status"
          subtitle="Order face value, not payments or accounting spend"
        >
          {summaryQuery.isLoading ? (
            <LoadingState />
          ) : summaryQuery.isError ? (
            <ErrorState
              error={summaryQuery.error}
              onRetry={() => void summaryQuery.refetch()}
            />
          ) : (
            summaryQuery.data && (
              <div className="divide-y divide-line px-5">
                {(['DRAFT', 'ISSUED', 'RECEIVED', 'CANCELLED'] as const).map(
                  (status) => (
                    <Link
                      to={`/purchase-orders?status=${status}`}
                      key={status}
                      className="flex items-center justify-between gap-3 py-4 text-base hover:text-brand dark:hover:text-blue-300"
                    >
                      <StatusBadge status={status} />
                      <span className="text-muted">
                        {t('{{count}} orders', {
                          count:
                            summaryQuery.data.purchaseOrdersByStatus[status],
                        })}
                      </span>
                      <strong>
                        {money(
                          summaryQuery.data.purchaseOrderAmountsByStatus[
                            status
                          ],
                        )}
                      </strong>
                    </Link>
                  ),
                )}
                <Link
                  to="/inventory"
                  className="flex items-center justify-between gap-3 py-4 text-base"
                >
                  <span>{t('Products without available stock')}</span>
                  <strong>{summaryQuery.data.outOfStockProducts}</strong>
                </Link>
              </div>
            )
          )}
        </Panel>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  const { t } = useTranslation();
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}>{icon}</div>
      <div className="metric-label">
        {t(label)}
        <span className="metric-more">
          <ArrowUpRight size={14} />
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{t(detail)}</div>
    </article>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
