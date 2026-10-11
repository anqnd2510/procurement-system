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
import { api, getErrorMessage } from '../lib/api';
import { dateTime, money } from '../lib/format';
import type { PageData, PurchaseOrder, PurchaseRequest } from '../types';
import { useOrganization } from '../organizations/OrganizationContext';
import {
  Button,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  Modal,
  Notice,
  PageHeading,
  Panel,
  StatusBadge,
} from '../components/ui';

const RECENT_ORDER_IDS = 'procurement.recent-purchase-orders';
function readRecentIds(): string[] {
  try {
    const ids: unknown = JSON.parse(
      sessionStorage.getItem(RECENT_ORDER_IDS) ?? '[]',
    );
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === 'string').slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

export function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const { activeOrganization, canManage } = useOrganization();
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
  const [recentIds, setRecentIds] = useState(readRecentIds);

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
    enabled: Boolean(activeOrganization),
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
      setCreateOpen(false);
      setSelectedOrderId(order.id);
      setFormError('');
      setRecentIds((current) => {
        const next = [
          order.id,
          ...current.filter((id) => id !== order.id),
        ].slice(0, 8);
        sessionStorage.setItem(RECENT_ORDER_IDS, JSON.stringify(next));
        return next;
      });
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('requestId');
        next.delete('orderId');
        return next;
      });
      void client.invalidateQueries({ queryKey: ['purchase-requests'] });
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
      void client.invalidateQueries({
        queryKey: ['purchase-order', activeOrganization?.id, order.id],
      });
      void client.invalidateQueries({ queryKey: ['purchase-requests'] });
      void client.invalidateQueries({ queryKey: ['audit-logs'] });
      void client.invalidateQueries({ queryKey: ['inventory'] });
    },
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
    setRecentIds((current) => {
      const next = [
        lookupId.trim(),
        ...current.filter((id) => id !== lookupId.trim()),
      ].slice(0, 8);
      sessionStorage.setItem(RECENT_ORDER_IDS, JSON.stringify(next));
      return next;
    });
    setLookupId('');
  }
  function transition(action: 'issue' | 'receive' | 'cancel') {
    if (!orderQuery.data) return;
    const question =
      action === 'issue'
        ? 'Issue this purchase order to the supplier?'
        : action === 'receive'
          ? 'Receive this order? This will add its quantities to inventory.'
          : 'Cancel this purchase order?';
    if (!window.confirm(t(question))) return;
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
              <FilePlus2 size={16} /> Create from request
            </Button>
          ) : undefined
        }
      />
      <Notice tone="info">
        The backend supports purchase-order creation, detail, issue, receive,
        and cancel, but it does not yet provide an organization-scoped order
        list. This page shows approved requests and orders opened in this
        browser; use an order ID to retrieve any existing order.
      </Notice>
      {!canManage && (
        <Notice>
          Only organization OWNER and MANAGER members can create or transition
          purchase orders.
        </Notice>
      )}

      <div className="po-layout">
        <Panel
          title="Approved requests"
          subtitle={`${approvedQuery.data?.meta.total ?? '—'} approved request(s) returned by the API`}
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
                      Create PO <ArrowRight size={14} />
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

        <Panel
          title="Find a purchase order"
          subtitle="Retrieve one order by its server-issued UUID"
        >
          <form className="lookup-form" onSubmit={lookup}>
            <FormField label="Purchase order ID">
              <input
                value={lookupId}
                onChange={(event) => setLookupId(event.target.value)}
                placeholder="Paste a purchase order ID"
                required
              />
            </FormField>
            <Button type="submit">
              <Search size={15} /> Load order
            </Button>
          </form>
          <div className="recent-order-block">
            <div className="detail-section-title">
              <h4>{t('Opened in this browser')}</h4>
              <span>{t('session history')}</span>
            </div>
            {recentIds.length ? (
              <div className="recent-order-list">
                {recentIds.map((id) => (
                  <button
                    key={id}
                    className={`recent-order-button ${selectedOrderId === id ? 'selected' : ''}`}
                    onClick={() => setSelectedOrderId(id)}
                  >
                    <span>
                      <ShoppingCart size={15} /> PO ·{' '}
                      {id.slice(0, 8).toUpperCase()}
                    </span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted small-copy">
                Created or looked-up order IDs appear here for this browser
                session only.
              </p>
            )}
          </div>
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
              Clear selection
            </Button>
          }
        >
          {orderQuery.isLoading ? (
            <LoadingState label="Loading purchase order…" />
          ) : orderQuery.isError ? (
            <ErrorState
              error={orderQuery.error}
              onRetry={() => void orderQuery.refetch()}
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
                      `Purchase request ${order.purchaseRequestId.slice(0, 8)}`}
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
                <span>{order.items.length} items</span>
              </div>
              <div className="detail-item-list">
                {order.items.map((item) => (
                  <div className="detail-item" key={item.id}>
                    <span className="detail-item-mark">
                      {item.product?.sku?.slice(0, 2) ?? 'PO'}
                    </span>
                    <span className="detail-item-copy">
                      <strong>{item.description}</strong>
                      <small>{item.product?.sku ?? 'Custom item'}</small>
                    </span>
                    <span className="detail-item-qty">× {item.quantity}</span>
                    <strong>{money(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
              {transitionMutation.isError && (
                <div className="inline-error" role="alert">
                  {getErrorMessage(transitionMutation.error)}
                </div>
              )}
              <div className="workflow-actions">
                {canManage && order.status === 'DRAFT' && (
                  <Button
                    onClick={() => transition('issue')}
                    loading={transitionMutation.isPending}
                  >
                    <Send size={15} /> Issue to supplier
                  </Button>
                )}
                {canManage && order.status === 'ISSUED' && (
                  <Button
                    onClick={() => transition('receive')}
                    loading={transitionMutation.isPending}
                  >
                    <PackageCheck size={15} /> Receive into inventory
                  </Button>
                )}
                {canManage && ['DRAFT', 'ISSUED'].includes(order.status) && (
                  <Button
                    variant="danger"
                    onClick={() => transition('cancel')}
                    loading={transitionMutation.isPending}
                  >
                    Cancel order
                  </Button>
                )}
                {order.status === 'RECEIVED' && (
                  <span className="received-confirmation">
                    <ArrowDownToLine size={16} /> Received{' '}
                    {dateTime(order.receivedAt)}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </Panel>
      )}

      {createOpen && (
        <Modal
          title="Create purchase order"
          onClose={() => setCreateOpen(false)}
        >
          <form className="modal-form" onSubmit={submitCreate}>
            <FormField label="Approved purchase request">
              <select
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
              </select>
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
                    'The order lines and totals are copied from the approved request by the server.',
                  )}
                </small>
              </div>
            )}
            <FormField label="Supplier name">
              <input
                value={supplierName}
                onChange={(event) => setSupplierName(event.target.value)}
                maxLength={200}
                placeholder="e.g. Northstar Office Supply"
                required
                autoFocus
              />
            </FormField>
            {formError && (
              <div className="form-error" role="alert">
                {formError}
              </div>
            )}
            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending}
                disabled={!selectedRequestId || !canManage}
              >
                Create purchase order
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
