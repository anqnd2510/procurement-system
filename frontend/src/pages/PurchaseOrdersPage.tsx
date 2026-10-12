import { Input } from '../components/ui/input';
import { NativeSelect } from '../components/ui/native-select';
import { ErrorMessage } from '../components/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownToLine,
  ArrowRight,
  FilePlus2,
  PackageCheck,
  Search,
  Send,
  ShoppingCart,
} from 'lucide-react';
import { PurchaseOrderRegister } from '../components/PurchaseOrderRegister';
import { invalidateDashboard } from '../lib/query-state';
import { api, getErrorMessage } from '../lib/api';
import { dateTime, money } from '../lib/format';
import type { PageData, PurchaseOrder, PurchaseRequest } from '../types';
import { useOrganization } from '../organizations/OrganizationContext';
import { useNotifications } from '../components/NotificationProvider';
import {
  Button,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  Modal,
  PageHeading,
  Panel,
  StatusBadge,
} from '../components/ui';

export function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const { activeOrganization, canManage } = useOrganization();
  const { confirm, notify } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const client = useQueryClient();
  const [supplierName, setSupplierName] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(
    searchParams.get('requestId') ?? '',
  );
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [createOpen, setCreateOpen] = useState(
    Boolean(searchParams.get('requestId')),
  );
  const [formError, setFormError] = useState('');

  const approvedQuery = useQuery({
    queryKey: [
      'purchase-requests',
      activeOrganization?.id,
      'approved-for-orders',
    ],
    queryFn: () =>
      api.get<PageData<PurchaseRequest>>(
        '/purchase-requests?page=1&limit=100&status=APPROVED',
      ),
    enabled: Boolean(activeOrganization && canManage),
  });
  const orderQuery = useQuery({
    queryKey: ['purchase-order', activeOrganization?.id, selectedOrderId],
    queryFn: () =>
      api.get<PurchaseOrder>(`/purchase-orders/${selectedOrderId}`),
    enabled: Boolean(selectedOrderId && activeOrganization),
  });
  const createMutation = useMutation({
    mutationFn: () =>
      api.post<PurchaseOrder>(
        `/purchase-orders/from-request/${selectedRequestId}`,
        { supplierName: supplierName.trim() },
      ),
    onSuccess: (order) => {
      void invalidateDashboard(client, activeOrganization?.id);
      void client.invalidateQueries({ queryKey: ['purchase-orders'] });
      void client.invalidateQueries({ queryKey: ['inventory-transactions'] });
      void client.invalidateQueries({ queryKey: ['reorder-alerts'] });
      setCreateOpen(false);
      setSelectedOrderId(order.id);
      setFormError('');

      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('requestId');
        next.delete('orderId');
        return next;
      });
      void client.invalidateQueries({ queryKey: ['purchase-requests'] });
      notify('success', 'Purchase order created.');
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });
  const transitionMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: 'issue' | 'receive' | 'cancel';
    }) => api.post<PurchaseOrder>(`/purchase-orders/${id}/${action}`),
    onSuccess: (order) => {
      void invalidateDashboard(client, activeOrganization?.id);
      void client.invalidateQueries({ queryKey: ['purchase-orders'] });
      void client.invalidateQueries({ queryKey: ['inventory-transactions'] });
      void client.invalidateQueries({
        queryKey: ['purchase-order', activeOrganization?.id, order.id],
      });
      void client.invalidateQueries({ queryKey: ['purchase-requests'] });
      void client.invalidateQueries({ queryKey: ['audit-logs'] });
      void client.invalidateQueries({ queryKey: ['inventory'] });
      void client.invalidateQueries({ queryKey: ['reorder-alerts'] });
      notify('success', 'Purchase order updated.');
    },
    onError: (error) => notify('error', getErrorMessage(error)),
  });

  useEffect(() => {
    const queryId = searchParams.get('orderId');
    if (queryId) setSelectedOrderId(queryId);
  }, [searchParams]);

  function openCreate(requestId = '') {
    setSelectedRequestId(requestId);
    setSupplierName('');
    setFormError('');
    setCreateOpen(true);
  }
  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    createMutation.mutate();
  }
  function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lookupId.trim()) return;
    setSelectedOrderId(lookupId.trim());

    setLookupId('');
  }
  async function transition(action: 'issue' | 'receive' | 'cancel') {
    if (!orderQuery.data) return;
    const question =
      action === 'issue'
        ? 'Issue this purchase order to the supplier?'
        : action === 'receive'
          ? 'Receive this order? This will add its quantities to inventory.'
          : 'Cancel this purchase order?';
    const accepted = await confirm({
      title: t(
        action === 'cancel'
          ? 'Cancel purchase order?'
          : action === 'receive'
            ? 'Receive purchase order?'
            : 'Send purchase order?',
      ),
      description: t(question),
      confirmLabel: t(
        action === 'cancel'
          ? 'Cancel order'
          : action === 'receive'
            ? 'Record receipt'
            : 'Send to supplier',
      ),
      destructive: action === 'cancel',
    });
    if (!accepted) return;
    transitionMutation.mutate({ id: orderQuery.data.id, action });
  }

  const order = orderQuery.data;
  const selectedRequest = approvedQuery.data?.items.find(
    (request) => request.id === selectedRequestId,
  );

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="PROCUREMENT · ORDERING"
        title="Purchase orders"
        description="Convert approved requests into supplier orders and record receipt into inventory."
        action={
          canManage ? (
            <Button onClick={() => openCreate()}>
              <FilePlus2 size={16} /> {t('Create from request')}{' '}
            </Button>
          ) : undefined
        }
      />

      <PurchaseOrderRegister
        key={activeOrganization?.id}
        initialStatus={searchParams.get('status') || ''}
        onOpen={setSelectedOrderId}
      />
      <div className={`po-layout ${canManage ? '' : 'po-layout-readonly'}`}>
        {canManage && (
          <Panel
            title="Approved requests"
            subtitle={t('{{count}} approved requests', {
              count: approvedQuery.data?.meta.total ?? '—',
            })}
          >
            {approvedQuery.isLoading ? (
              <LoadingState />
            ) : approvedQuery.isError ? (
              <ErrorState
                error={approvedQuery.error}
                onRetry={() => void approvedQuery.refetch()}
              />
            ) : !approvedQuery.data?.items.length ? (
              <EmptyState
                title="Nothing is ready to order"
                description="An organization manager can create purchase orders once requests are approved."
              />
            ) : (
              <div className="approved-request-list">
                {approvedQuery.data.items.map((request) => (
                  <div className="approved-request-card" key={request.id}>
                    <div className="approved-request-top">
                      <span className="request-icon request-icon-green">
                        <ShoppingCart size={16} />
                      </span>
                      <span className="approved-request-copy">
                        <strong>{request.title}</strong>
                        <small>
                          {request.department.name} · {request.requester.email}
                        </small>
                      </span>
                      <StatusBadge status={request.status} />
                    </div>
                    <div className="approved-request-bottom">
                      <span>
                        {t('{{count}} items', { count: request.items.length })}{' '}
                        <i>·</i> <strong>{money(request.totalAmount)}</strong>
                      </span>
                      <Button
                        variant="secondary"
                        disabled={!canManage}
                        onClick={() => openCreate(request.id)}
                      >
                        {' '}
                        {t('Create PO')} <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {approvedQuery.data?.meta.total &&
            approvedQuery.data.meta.total > approvedQuery.data.items.length ? (
              <div className="panel-footnote">
                {t(
                  'Showing the first {{count}} approved requests; paginate for larger workspaces.',
                  { count: approvedQuery.data.items.length },
                )}
              </div>
            ) : null}
          </Panel>
        )}

        <Panel
          title="Find a purchase order"
          subtitle={t('Enter an order number to find it.')}
        >
          <form className="lookup-form" onSubmit={lookup}>
            <FormField label={t('Order reference')}>
              <Input
                value={lookupId}
                onChange={(event) => setLookupId(event.target.value)}
                placeholder={t('Paste an order reference')}
                required
              />
            </FormField>
            <Button type="submit">
              <Search size={15} /> {t('Load order')}{' '}
            </Button>
          </form>
        </Panel>
      </div>

      {selectedOrderId && (
        <Panel
          title="Purchase order details"
          subtitle="Live detail from the selected organization"
          className="order-detail-panel"
          action={
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedOrderId('');
                setSearchParams((current) => {
                  const next = new URLSearchParams(current);
                  next.delete('orderId');
                  return next;
                });
              }}
            >
              {' '}
              {t('Clear selection')}{' '}
            </Button>
          }
        >
          {orderQuery.isLoading ? (
            <LoadingState label="Loading purchase order…" />
          ) : orderQuery.isError ? (
            <ErrorState
              error={orderQuery.error}
              onRetry={() => void orderQuery.refetch()}
              onBack={() => {
                setSelectedOrderId('');
                setSearchParams((current) => {
                  const next = new URLSearchParams(current);
                  next.delete('orderId');
                  return next;
                });
              }}
            />
          ) : order ? (
            <div className="po-detail">
              <div className="po-detail-top">
                <div className="po-number-icon">
                  <ShoppingCart size={20} />
                </div>
                <div className="po-number-copy">
                  <span className="eyebrow">{order.orderNumber}</span>
                  <h3>{order.supplierName}</h3>
                  <p>
                    {order.purchaseRequest?.title ??
                      t('Purchase request {{id}}', {
                        id: order.purchaseRequestId.slice(0, 8),
                      })}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="detail-meta-grid">
                <div>
                  <small>{t('ORDER TOTAL')}</small>
                  <strong>{money(order.totalAmount)}</strong>
                </div>
                <div>
                  <small>{t('CREATED')}</small>
                  <strong>{dateTime(order.createdAt)}</strong>
                </div>
                <div>
                  <small>{t('CREATED BY')}</small>
                  <strong>{order.createdBy?.email ?? '—'}</strong>
                </div>
                <div>
                  <small>{t('LINKED REQUEST')}</small>
                  <strong>
                    {order.purchaseRequestId.slice(0, 8).toUpperCase()}
                  </strong>
                </div>
              </div>
              <div className="detail-section-title">
                <h4>{t('Order lines')}</h4>
                <span>
                  {t('{{count}} items', { count: order.items.length })}
                </span>
              </div>
              <div className="detail-item-list">
                {order.items.map((item) => (
                  <div className="detail-item" key={item.id}>
                    <span className="detail-item-mark">
                      {item.product?.sku?.slice(0, 2) ?? 'PO'}
                    </span>
                    <span className="detail-item-copy">
                      <strong>{item.description}</strong>
                      <small>{item.product?.sku ?? t('Custom item')}</small>
                    </span>
                    <span className="detail-item-qty">× {item.quantity}</span>
                    <strong>{money(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
              {transitionMutation.isError && (
                <ErrorMessage error={transitionMutation.error} />
              )}
              <div className="workflow-actions">
                {canManage && order.status === 'DRAFT' && (
                  <Button
                    onClick={() => transition('issue')}
                    loading={transitionMutation.isPending}
                  >
                    <Send size={15} /> {t('Issue to supplier')}{' '}
                  </Button>
                )}
                {canManage && order.status === 'ISSUED' && (
                  <Button
                    onClick={() => transition('receive')}
                    loading={transitionMutation.isPending}
                  >
                    <PackageCheck size={15} />{' '}
                    {t('Receive into inventory')}{' '}
                  </Button>
                )}
                {canManage && ['DRAFT', 'ISSUED'].includes(order.status) && (
                  <Button
                    variant="danger"
                    onClick={() => transition('cancel')}
                    loading={transitionMutation.isPending}
                  >
                    {' '}
                    {t('Cancel order')}{' '}
                  </Button>
                )}
                {order.status === 'RECEIVED' && (
                  <span className="received-confirmation">
                    <ArrowDownToLine size={16} /> {t('Received')}{' '}
                    {dateTime(order.receivedAt)}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </Panel>
      )}

      {createOpen && canManage && (
        <Modal
          title="Create purchase order"
          onClose={() => setCreateOpen(false)}
        >
          <form className="modal-form" onSubmit={submitCreate}>
            <FormField label="Approved purchase request">
              <NativeSelect
                value={selectedRequestId}
                onChange={(event) => setSelectedRequestId(event.target.value)}
                required
              >
                <option value="">{t('Choose an approved request…')}</option>
                {approvedQuery.data?.items.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.title} · {money(request.totalAmount)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            {selectedRequest && (
              <div className="selected-request-summary">
                <span>
                  {t('{{count}} line items', {
                    count: selectedRequest.items.length,
                  })}
                </span>
                <strong>{money(selectedRequest.totalAmount)}</strong>
                <small>
                  {t(
                    'Items and total are carried over from the approved request.',
                  )}
                </small>
              </div>
            )}
            <FormField label="Supplier name">
              <Input
                value={supplierName}
                onChange={(event) => setSupplierName(event.target.value)}
                maxLength={200}
                placeholder={t('e.g. Northstar Office Supply')}
                required
                autoFocus
              />
            </FormField>
            {formError && <ErrorMessage error={formError} />}
            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
              >
                {' '}
                {t('Cancel')}{' '}
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending}
                disabled={!selectedRequestId || !canManage}
              >
                {' '}
                {t('Create purchase order')}{' '}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
