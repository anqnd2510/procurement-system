import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BellRing, RotateCcw, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  ListFilter,
  ListPagination,
  ListSearch,
  ListToolbar,
} from './ListControls';
import {
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  Panel,
  RefreshIndicator,
} from './ui';
import { Button } from './ui/button';
import { NumberInput } from './ui/number-input';
import { api, getErrorMessage } from '../lib/api';
import { numericError } from '../lib/numeric-input';
import { keepScopedData } from '../lib/query-state';
import { useDebouncedValue } from '../lib/use-debounced-value';
import { currentLocale } from '../lib/format';
import { useNotifications } from './NotificationProvider';
import type { PageData, ReorderAlert, ReorderPolicy } from '../types';

const PAGE_LIMIT = 8;
const DEFAULT_REORDER_POINT = 10;
const DEFAULT_TARGET_STOCK = 20;

export function ReorderManagement({
  organizationId,
  productId,
  productName,
}: {
  organizationId: string;
  productId: string;
  productName: string;
}) {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const searchTerm = useDebouncedValue(search, 250);
  const [reorderPoint, setReorderPoint] = useState(
    String(DEFAULT_REORDER_POINT),
  );
  const [targetStock, setTargetStock] = useState(String(DEFAULT_TARGET_STOCK));
  const [formError, setFormError] = useState('');
  const [saveError, setSaveError] = useState('');
  const currentFormKey = `${organizationId}:${productId}`;
  const initializedFormKey = useRef('');
  const loadedPolicyKey = useRef('');
  const policyQuery = useQuery({
    queryKey: ['reorder-policy', organizationId, productId],
    queryFn: () =>
      api.get<ReorderPolicy>(
        `/inventories/workspace/${productId}/reorder-policy`,
        { organization: organizationId },
      ),
    enabled: Boolean(productId),
  });
  const alertsQuery = useQuery({
    placeholderData: keepScopedData<PageData<ReorderAlert>>([
      'reorder-alerts',
      organizationId,
    ]),
    queryKey: ['reorder-alerts', organizationId, page, status, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      if (status) params.set('status', status);
      if (searchTerm) params.set('search', searchTerm);
      return api.get<PageData<ReorderAlert>>(
        `/inventories/workspace/reorder-alerts?${params.toString()}`,
        { organization: organizationId },
      );
    },
  });
  const saveMutation = useMutation({
    mutationFn: (payload: {
      reorderPoint: number | null;
      targetStock: number | null;
    }) =>
      api.put<ReorderPolicy>(
        `/inventories/workspace/${productId}/reorder-policy`,
        payload,
        { organization: organizationId },
      ),
    onSuccess: (policy) => {
      client.setQueryData(
        ['reorder-policy', organizationId, productId],
        policy,
      );
      void client.invalidateQueries({
        queryKey: ['reorder-alerts', organizationId],
      });
      void client.invalidateQueries({
        queryKey: ['inventory', organizationId],
      });
      void client.invalidateQueries({
        queryKey: ['audit-logs', organizationId],
      });
      setSaveError('');
      setFormError('');
      notify('success', 'Restock settings saved.');
      setReorderPoint(
        policy.reorderPoint == null ? '' : String(policy.reorderPoint),
      );
      setTargetStock(
        policy.targetStock == null ? '' : String(policy.targetStock),
      );
    },
    onError: (error) => {
      setSaveError(getErrorMessage(error));
      notify('error', getErrorMessage(error));
    },
  });

  useEffect(() => {
    if (initializedFormKey.current !== currentFormKey) {
      initializedFormKey.current = currentFormKey;
      loadedPolicyKey.current = '';
      setReorderPoint(String(DEFAULT_REORDER_POINT));
      setTargetStock(String(DEFAULT_TARGET_STOCK));
      setFormError('');
      setSaveError('');
    }
    if (policyQuery.data && loadedPolicyKey.current !== currentFormKey) {
      loadedPolicyKey.current = currentFormKey;
      setReorderPoint(
        policyQuery.data.reorderPoint == null
          ? String(DEFAULT_REORDER_POINT)
          : String(policyQuery.data.reorderPoint),
      );
      setTargetStock(
        policyQuery.data.targetStock == null
          ? String(DEFAULT_TARGET_STOCK)
          : String(policyQuery.data.targetStock),
      );
    }
  }, [currentFormKey, policyQuery.data]);

  useEffect(() => {
    setPage(1);
  }, [status, searchTerm]);

  const hasPolicy =
    policyQuery.data?.reorderPoint != null &&
    policyQuery.data.targetStock != null;

  function submitPolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError('');
    const pointError = numericError(reorderPoint, {
      min: 0,
      max: 2_147_483_647,
    });
    const targetError = numericError(targetStock, {
      min: 1,
      max: 2_147_483_647,
    });
    if (pointError || targetError) {
      setFormError(pointError || targetError);
      return;
    }
    if (Number(targetStock) <= Number(reorderPoint)) {
      setFormError(
        'The restocked level must be higher than the reminder level.',
      );
      return;
    }
    setFormError('');
    saveMutation.mutate({
      reorderPoint: Number(reorderPoint),
      targetStock: Number(targetStock),
    });
  }

  function disablePolicy() {
    setSaveError('');
    setFormError('');
    saveMutation.mutate({ reorderPoint: null, targetStock: null });
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)]">
      <Panel
        title="Restock settings"
        subtitle="Choose when to be reminded and how much stock to keep."
        className="min-w-0"
      >
        {!productId ? (
          <EmptyState
            title="Choose a product to manage its reorder policy"
            description="The policy is stored with the product’s organization inventory."
          />
        ) : policyQuery.isLoading ? (
          <LoadingState label="Loading reorder policy…" />
        ) : policyQuery.isError ? (
          <ErrorState
            error={policyQuery.error}
            onRetry={() => void policyQuery.refetch()}
          />
        ) : (
          <form className="space-y-4" onSubmit={submitPolicy}>
            <div className="flex items-start gap-3 rounded-lg border border-line bg-slate-50 p-3 dark:bg-slate-900/70">
              <BellRing className="mt-0.5 shrink-0 text-brand" size={18} />
              <div className="min-w-0">
                <strong className="block truncate text-sm text-ink">
                  {productName || t('No product selected')}
                </strong>
                <span className="text-sm text-muted">
                  {hasPolicy
                    ? t('Low-stock reminders are on for this product.')
                    : t('No low-stock reminder has been set for this product.')}
                </span>
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <FormField
                label="Remind me when stock reaches"
                hint="A reminder appears when available stock reaches this amount."
              >
                <NumberInput
                  min={0}
                  max={2_147_483_647}
                  value={reorderPoint}
                  onValueChange={setReorderPoint}
                  placeholder={t('e.g. 10')}
                  disabled={saveMutation.isPending}
                  aria-label={t('Remind me when stock reaches')}
                />
              </FormField>
              <FormField
                label="Stock level after restocking"
                hint="The suggested amount to order is based on this level."
              >
                <NumberInput
                  min={1}
                  max={2_147_483_647}
                  value={targetStock}
                  onValueChange={setTargetStock}
                  placeholder={t('e.g. 20')}
                  disabled={saveMutation.isPending}
                  aria-label={t('Stock level after restocking')}
                />
              </FormField>
            </div>

            <p className="text-sm leading-6 text-muted">
              {t(
                'On-order quantity includes orders already sent to suppliers; drafts are not counted.',
              )}
            </p>
            {(formError || saveError) && (
              <div
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                role="alert"
              >
                {t(formError || saveError)}
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {hasPolicy && (
                <Button
                  variant="secondary"
                  onClick={disablePolicy}
                  disabled={saveMutation.isPending}
                  type="button"
                >
                  <RotateCcw size={16} /> {t('Turn off reminders')}
                </Button>
              )}
              <Button
                type="submit"
                loading={saveMutation.isPending}
                disabled={
                  !reorderPoint ||
                  !targetStock ||
                  (hasPolicy &&
                    Number(reorderPoint) === policyQuery.data?.reorderPoint &&
                    Number(targetStock) === policyQuery.data?.targetStock)
                }
              >
                <Save size={16} /> {t('Save restock settings')}
              </Button>
            </div>
          </form>
        )}
      </Panel>

      <Panel
        title="Restock reminders"
        subtitle="Products that have reached their low-stock reminder level."
        className="min-w-0"
      >
        <ListToolbar className="px-0 pt-0">
          <ListSearch
            label="Search restock reminders"
            placeholder={t('Search by product name or code…')}
            value={search}
            onChange={setSearch}
          />
          <ListFilter
            label="Stock level"
            allLabel="All reminders"
            value={status}
            options={[
              { value: 'OUT_OF_STOCK', label: 'Out of stock' },
              { value: 'LOW_STOCK', label: 'Low stock' },
            ]}
            onChange={setStatus}
          />
        </ListToolbar>
        <RefreshIndicator
          fetching={alertsQuery.isFetching && !alertsQuery.isLoading}
        />
        {alertsQuery.isLoading ? (
          <LoadingState label="Loading restock reminders…" />
        ) : alertsQuery.isError ? (
          <ErrorState
            error={alertsQuery.error}
            onRetry={() => void alertsQuery.refetch()}
          />
        ) : alertsQuery.data?.items.length ? (
          <>
            <div className="divide-y divide-line/70">
              {alertsQuery.data.items.map((alert) => (
                <article
                  className="grid min-w-0 gap-3 py-4 md:grid-cols-[minmax(0,1.25fr)_minmax(170px,0.8fr)_minmax(150px,0.7fr)] md:items-center"
                  key={alert.inventoryId}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ${
                        alert.status === 'OUT_OF_STOCK'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                      }`}
                    >
                      <AlertTriangle size={17} />
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-ink">
                        {alert.productName}
                      </strong>
                      <span className="font-mono text-xs text-muted">
                        {alert.productSku}
                      </span>
                      <div className="mt-1">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            alert.status === 'OUT_OF_STOCK'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                          }`}
                        >
                          {t(alert.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm md:grid-cols-2">
                    <AlertMetric label="Available" value={alert.qtyAvailable} />
                    <AlertMetric
                      label="Reorder point"
                      value={alert.reorderPoint}
                    />
                    <AlertMetric label="Incoming" value={alert.incomingQty} />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950/40 md:block">
                    <span className="text-sm text-muted">
                      {t('Suggested order')}
                    </span>
                    <strong className="block text-xl font-bold tabular-nums text-brand">
                      {alert.suggestedOrderQty.toLocaleString(currentLocale())}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
            <ListPagination
              meta={alertsQuery.data.meta}
              busy={alertsQuery.isPlaceholderData}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No restock reminders"
            description={
              search || status
                ? 'Try clearing the search or stock condition filter.'
                : 'Products will appear here when stock reaches the reminder level.'
            }
          />
        )}
      </Panel>
    </div>
  );
}

function AlertMetric({ label, value }: { label: string; value: number }) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0">
      <span className="block truncate text-xs text-muted">{t(label)}</span>
      <strong className="tabular-nums text-ink">
        {value.toLocaleString(currentLocale())}
      </strong>
    </div>
  );
}
