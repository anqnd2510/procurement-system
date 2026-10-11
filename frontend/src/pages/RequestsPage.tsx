import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ClipboardList, Eye, Plus, Send, X } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import { dateTime, money } from '../lib/format';
import type {
  Department,
  PageData,
  Product,
  PurchaseRequest,
  PurchaseRequestStatus,
} from '../types';
import { useAuth } from '../auth/AuthContext';
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

const statuses: Array<PurchaseRequestStatus | ''> = [
  '',
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'FULFILLED',
];
type DraftLine = {
  productId: string;
  description: string;
  quantity: string;
  estimatedUnitPrice: string;
  notes: string;
};
type RequestForm = {
  title: string;
  description: string;
  departmentId: string;
  items: DraftLine[];
};
const newLine = (): DraftLine => ({
  productId: '',
  description: '',
  quantity: '1',
  estimatedUnitPrice: '',
  notes: '',
});
const blankForm = (): RequestForm => ({
  title: '',
  description: '',
  departmentId: '',
  items: [newLine()],
});

export function RequestsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeOrganization, canManage } = useOrganization();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const status = (searchParams.get('status') ?? '') as
    | PurchaseRequestStatus
    | '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const selectedId = searchParams.get('open');
  const shouldCreate = searchParams.get('new') === '1';
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<RequestForm>(blankForm());
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(
    null,
  );
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (shouldCreate) {
      setEditingRequest(null);
      setForm(blankForm());
      setFormError('');
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [shouldCreate, searchParams, setSearchParams]);

  const listQuery = useQuery({
    queryKey: ['purchase-requests', activeOrganization?.id, status, page],
    queryFn: () =>
      api.get<PageData<PurchaseRequest>>(
        `/purchase-requests?page=${page}&limit=10${status ? `&status=${status}` : ''}`,
      ),
    enabled: Boolean(activeOrganization),
  });
  const departmentQuery = useQuery({
    queryKey: ['departments', activeOrganization?.id],
    queryFn: () =>
      api.get<Department[]>(
        `/organizations/${activeOrganization?.id}/departments`,
        { organization: false },
      ),
    enabled: Boolean(activeOrganization),
  });
  const catalogProductsQuery = useQuery({
    queryKey: ['products', 'request-selector'],
    queryFn: () =>
      api.get<PageData<Product>>('/products?page=1&limit=100', {
        organization: false,
      }),
    enabled: activeOrganization?.slug === 'acme-procurement',
  });
  const detailQuery = useQuery({
    queryKey: ['purchase-request', activeOrganization?.id, selectedId],
    queryFn: () => api.get<PurchaseRequest>(`/purchase-requests/${selectedId}`),
    enabled: Boolean(selectedId && activeOrganization),
  });

  const createMutation = useMutation({
    mutationFn: (payload: RequestForm) => {
      const body = {
        departmentId: payload.departmentId,
        title: payload.title.trim(),
        description: payload.description.trim() || undefined,
        items: payload.items.map((item) => ({
          ...(item.productId ? { productId: item.productId } : {}),
          description: item.description.trim(),
          quantity: Number(item.quantity),
          estimatedUnitPrice: Number(item.estimatedUnitPrice),
          notes: item.notes.trim() || undefined,
        })),
      };
      if (editingRequest)
        return api.patch<PurchaseRequest>(
          `/purchase-requests/${editingRequest.id}`,
          body,
        );
      return api.post<PurchaseRequest>('/purchase-requests', body, {
        idempotencyKey: crypto.randomUUID(),
      });
    },
    onSuccess: (request) => {
      void client.invalidateQueries({ queryKey: ['purchase-requests'] });
      setFormOpen(false);
      setEditingRequest(null);
      setForm(blankForm());
      setFormError('');
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set('open', request.id);
        return next;
      });
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });
  const transitionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      comment,
    }: {
      id: string;
      action: 'submit' | 'approve' | 'reject' | 'cancel' | 'fulfill';
      comment?: string;
    }) => {
      const body =
        action === 'approve'
          ? { comment }
          : action === 'reject'
            ? { reason: comment }
            : undefined;
      return api.post<PurchaseRequest>(
        `/purchase-requests/${id}/${action}`,
        body,
      );
    },
    onSuccess: (request) => {
      void client.invalidateQueries({ queryKey: ['purchase-requests'] });
      void client.invalidateQueries({
        queryKey: ['purchase-request', activeOrganization?.id, request.id],
      });
      void client.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });

  const products = catalogProductsQuery.data?.items ?? [];
  const lineTotal = useMemo(
    () =>
      form.items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) * Number(item.estimatedUnitPrice || 0),
        0,
      ),
    [form.items],
  );
  const request = detailQuery.data;
  const canEdit = Boolean(
    request && request.requesterId === user?.id && request.status === 'DRAFT',
  );
  const canRequesterTransition = Boolean(
    request && request.requesterId === user?.id,
  );

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }
  function selectProduct(index: number, productId: string) {
    const product = products.find((entry) => entry.id === productId);
    updateLine(index, {
      productId,
      ...(product
        ? {
            description: product.name,
            estimatedUnitPrice: String(product.unit_price),
          }
        : {}),
    });
  }
  function openEdit(requestData: PurchaseRequest) {
    setEditingRequest(requestData);
    setForm({
      title: requestData.title,
      description: requestData.description ?? '',
      departmentId: requestData.departmentId,
      items: requestData.items.map((item) => ({
        productId: item.productId ?? '',
        description: item.description,
        quantity: String(item.quantity),
        estimatedUnitPrice: String(item.estimatedUnitPrice),
        notes: item.notes ?? '',
      })),
    });
    setFormError('');
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditingRequest(null);
    setForm(blankForm());
  }
  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    createMutation.mutate(form);
  }
  function transition(
    action: 'submit' | 'approve' | 'reject' | 'cancel' | 'fulfill',
  ) {
    if (!request) return;
    let comment: string | undefined;
    if (action === 'reject') {
      const reason = window.prompt(
        t('Provide a reason for rejecting this request:'),
      );
      if (!reason?.trim()) return;
      comment = reason.trim();
    } else if (action === 'approve') {
      comment =
        window.prompt(t('Approval comment (optional):'))?.trim() || undefined;
    } else if (action === 'cancel' || action === 'fulfill') {
      if (
        !window.confirm(
          t(
            action === 'cancel'
              ? 'Cancel this purchase request?'
              : 'Fulfill this request and consume its reserved stock?',
          ),
        )
      )
        return;
    }
    transitionMutation.mutate({ id: request.id, action, comment });
  }

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="WORKFLOW · REQUISITIONS"
        title="Purchase requests"
        description="Create, review, and move procurement requests through their organization’s approval lifecycle."
        action={
          activeOrganization ? (
            <Button
              onClick={() => {
                setEditingRequest(null);
                setForm(blankForm());
                setFormOpen(true);
              }}
            >
              <Plus size={16} /> New request
            </Button>
          ) : undefined
        }
      />
      {!activeOrganization && (
        <Notice tone="warning">
          Create or join an organization before working with purchase requests.
        </Notice>
      )}
      {activeOrganization && departmentQuery.data?.length === 0 && (
        <Notice tone="warning">
          This workspace has no departments yet. Create one in Organization
          settings before submitting a request.
        </Notice>
      )}
      {activeOrganization && activeOrganization.slug !== 'acme-procurement' && (
        <Notice>
          Product selection is unavailable for this organization because the
          catalog read API is pinned to the default workspace. You can still
          enter free-form request items.
        </Notice>
      )}

      <Panel className="table-panel">
        <div className="table-toolbar">
          <div>
            <h2>{t('All requests')}</h2>
            <p>
              {t('{{count}} total · ordered by most recent', {
                count: listQuery.data?.meta.total ?? '—',
              })}
            </p>
          </div>
          <div className="toolbar-controls">
            <label className="filter-select">
              <span>{t('Status')}</span>
              <select
                value={status}
                onChange={(event) =>
                  setSearchParams((current) => {
                    const next = new URLSearchParams(current);
                    if (event.target.value)
                      next.set('status', event.target.value);
                    else next.delete('status');
                    next.delete('page');
                    return next;
                  })
                }
              >
                {statuses.map((option) => (
                  <option key={option || 'ALL'} value={option}>
                    {option ? t(option) : t('All statuses')}
                  </option>
                ))}
              </select>
            </label>
            <span className="list-live">
              <span className="online-dot" /> {t('LIVE DATA')}
            </span>
          </div>
        </div>
        {listQuery.isLoading ? (
          <LoadingState />
        ) : listQuery.isError ? (
          <ErrorState
            error={listQuery.error}
            onRetry={() => void listQuery.refetch()}
          />
        ) : !listQuery.data?.items.length ? (
          <EmptyState
            title={
              status
                ? t('No {{status}} requests', { status: t(status) })
                : t('No purchase requests yet')
            }
            description="Requests are scoped to the active organization; create one to start the workflow."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus size={15} /> Create request
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table request-table">
                <thead>
                  <tr>
                    <th>{t('REQUEST')}</th>
                    <th>{t('REQUESTER')}</th>
                    <th>{t('DEPARTMENT')}</th>
                    <th>{t('SUBMITTED')}</th>
                    <th>{t('ESTIMATED TOTAL')}</th>
                    <th>{t('STATUS')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {listQuery.data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="clickable-row"
                      onClick={() =>
                        setSearchParams((current) => {
                          const next = new URLSearchParams(current);
                          next.set('open', item.id);
                          return next;
                        })
                      }
                    >
                      <td>
                        <div className="request-title-cell">
                          <span className="request-icon">
                            <ClipboardList size={16} />
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <small>
                              PR-{item.id.slice(0, 8).toUpperCase()} ·{' '}
                              {t(
                                item.items.length === 1
                                  ? '{{count}} line item'
                                  : '{{count}} line items',
                                {
                                  count: item.items.length,
                                },
                              )}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>{item.requester?.email ?? '—'}</td>
                      <td>
                        <span className="department-chip">
                          {item.department?.code ?? '—'}
                        </span>{' '}
                        {item.department?.name}
                      </td>
                      <td className="muted">{dateTime(item.createdAt)}</td>
                      <td className="amount-cell">{money(item.totalAmount)}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Open ${item.title}`}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-pagination">
              <span>
                {t('Page {{page}} of {{totalPages}} · {{total}} records', {
                  page: listQuery.data.meta.page,
                  totalPages: Math.max(1, listQuery.data.meta.totalPages),
                  total: listQuery.data.meta.total,
                })}
              </span>
              <div>
                <Button
                  variant="secondary"
                  disabled={!listQuery.data.meta.hasPrev}
                  onClick={() =>
                    setSearchParams((current) => {
                      const next = new URLSearchParams(current);
                      next.set('page', String(Math.max(1, page - 1)));
                      return next;
                    })
                  }
                >
                  Previous
                </Button>
                <span className="page-number">{page}</span>
                <Button
                  variant="secondary"
                  disabled={!listQuery.data.meta.hasNext}
                  onClick={() =>
                    setSearchParams((current) => {
                      const next = new URLSearchParams(current);
                      next.set('page', String(page + 1));
                      return next;
                    })
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Panel>

      {formOpen && (
        <Modal
          title={
            editingRequest ? 'Edit draft request' : 'Create purchase request'
          }
          onClose={closeForm}
          wide
        >
          <form className="modal-form request-form" onSubmit={submitForm}>
            <div className="form-grid-two">
              <FormField label="Request title">
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  maxLength={200}
                  placeholder="e.g. New joiner equipment"
                  required
                  autoFocus
                />
              </FormField>
              <FormField label="Department">
                <select
                  value={form.departmentId}
                  onChange={(event) =>
                    setForm({ ...form, departmentId: event.target.value })
                  }
                  required
                >
                  <option value="">{t('Select department…')}</option>
                  {departmentQuery.data?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name} · {department.code}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="Business justification">
              <textarea
                rows={2}
                maxLength={2000}
                placeholder="Explain what the team needs and why."
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </FormField>
            <div className="request-items-heading">
              <div>
                <h3>{t('Line items')}</h3>
                <p>
                  Totals are calculated by the API from quantity and estimated
                  unit price.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    items: [...current.items, newLine()],
                  }))
                }
              >
                <Plus size={15} /> Add item
              </Button>
            </div>
            <div className="request-line-list">
              {form.items.map((item, index) => (
                <div className="request-line-editor" key={index}>
                  {products.length > 0 && (
                    <FormField label="Catalog product (optional)">
                      <select
                        value={item.productId}
                        onChange={(event) =>
                          selectProduct(index, event.target.value)
                        }
                      >
                        <option value="">{t('Custom item')}</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} · {product.sku}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  )}
                  <div className="request-line-grid">
                    <FormField label="Description">
                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateLine(index, { description: event.target.value })
                        }
                        maxLength={500}
                        placeholder="Item or service"
                        required
                      />
                    </FormField>
                    <FormField label="Qty">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(event) =>
                          updateLine(index, { quantity: event.target.value })
                        }
                        min="1"
                        step="1"
                        required
                      />
                    </FormField>
                    <FormField label="Est. unit price">
                      <input
                        type="number"
                        value={item.estimatedUnitPrice}
                        onChange={(event) =>
                          updateLine(index, {
                            estimatedUnitPrice: event.target.value,
                          })
                        }
                        min="0"
                        step="0.01"
                        required
                      />
                    </FormField>
                    <button
                      type="button"
                      className="icon-button danger-icon line-remove"
                      aria-label={`Remove line ${index + 1}`}
                      disabled={form.items.length === 1}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          items: current.items.filter(
                            (_, lineIndex) => lineIndex !== index,
                          ),
                        }))
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <FormField label="Line notes">
                    <input
                      value={item.notes}
                      onChange={(event) =>
                        updateLine(index, { notes: event.target.value })
                      }
                      maxLength={1000}
                      placeholder="Optional delivery or specification notes"
                    />
                  </FormField>
                </div>
              ))}
            </div>
            <div className="request-total-preview">
              <span>{t('Client estimate preview')}</span>
              <strong>{money(lineTotal)}</strong>
              <small>
                {t('Final total is calculated and returned by the server.')}
              </small>
            </div>
            {formError && (
              <div className="form-error" role="alert">
                {formError}
              </div>
            )}
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending}
                disabled={!departmentQuery.data?.length}
              >
                {editingRequest ? 'Save draft' : 'Create draft request'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {selectedId && (
        <Modal
          title="Purchase request details"
          onClose={() =>
            setSearchParams((current) => {
              const next = new URLSearchParams(current);
              next.delete('open');
              return next;
            })
          }
          wide
        >
          {detailQuery.isLoading ? (
            <LoadingState label="Loading request and status history…" />
          ) : detailQuery.isError ? (
            <ErrorState
              error={detailQuery.error}
              onRetry={() => void detailQuery.refetch()}
            />
          ) : request ? (
            <div className="request-detail">
              <div className="request-detail-header">
                <div>
                  <span className="eyebrow">
                    PR-{request.id.slice(0, 8).toUpperCase()}
                  </span>
                  <h3>{request.title}</h3>
                  <p>
                    {request.description ||
                      t('No business justification provided.')}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <div className="detail-meta-grid">
                <div>
                  <small>{t('REQUESTER')}</small>
                  <strong>{request.requester.email}</strong>
                </div>
                <div>
                  <small>{t('DEPARTMENT')}</small>
                  <strong>
                    {request.department.name} · {request.department.code}
                  </strong>
                </div>
                <div>
                  <small>{t('CREATED')}</small>
                  <strong>{dateTime(request.createdAt)}</strong>
                </div>
                <div>
                  <small>{t('SERVER TOTAL')}</small>
                  <strong>{money(request.totalAmount)}</strong>
                </div>
              </div>
              <div className="detail-section-title">
                <h4>{t('Requested items')}</h4>
                <span>
                  {t('{{count}} line items', {
                    count: request.items.length,
                  })}
                </span>
              </div>
              <div className="detail-item-list">
                {request.items.map((item) => (
                  <div key={item.id} className="detail-item">
                    <span className="detail-item-mark">
                      {item.product?.sku?.slice(0, 2) ?? 'IT'}
                    </span>
                    <span className="detail-item-copy">
                      <strong>{item.description}</strong>
                      <small>
                        {item.product?.sku ?? 'Custom item'}
                        {item.notes ? ` · ${item.notes}` : ''}
                      </small>
                    </span>
                    <span className="detail-item-qty">× {item.quantity}</span>
                    <strong>{money(item.estimatedTotal)}</strong>
                  </div>
                ))}
              </div>
              {request.history?.length ? (
                <div className="request-history">
                  <div className="detail-section-title">
                    <h4>{t('Status history')}</h4>
                  </div>
                  {request.history.map((entry) => (
                    <div className="history-row" key={entry.id}>
                      <span className="history-dot" />
                      <div>
                        <strong>
                          {entry.fromStatus
                            ? `${entry.fromStatus} → ${entry.toStatus}`
                            : t('Created as {{status}}', {
                                status: t(entry.toStatus),
                              })}
                        </strong>
                        <small>
                          {entry.changedBy.email}
                          {entry.comment ? ` · ${entry.comment}` : ''}
                        </small>
                      </div>
                      <time>{dateTime(entry.createdAt)}</time>
                    </div>
                  ))}
                </div>
              ) : null}
              {transitionMutation.isError && (
                <div className="inline-error" role="alert">
                  {getErrorMessage(transitionMutation.error)}
                </div>
              )}
              <div className="workflow-actions">
                {canEdit && (
                  <Button variant="secondary" onClick={() => openEdit(request)}>
                    Edit draft
                  </Button>
                )}
                {canRequesterTransition && request.status === 'DRAFT' && (
                  <Button
                    onClick={() => transition('submit')}
                    loading={transitionMutation.isPending}
                  >
                    <Send size={15} /> Submit for review
                  </Button>
                )}
                {canRequesterTransition &&
                  ['DRAFT', 'SUBMITTED'].includes(request.status) && (
                    <Button
                      variant="danger"
                      onClick={() => transition('cancel')}
                      loading={transitionMutation.isPending}
                    >
                      Cancel request
                    </Button>
                  )}
                {canManage && request.status === 'SUBMITTED' && (
                  <>
                    <Button
                      onClick={() => transition('approve')}
                      loading={transitionMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => transition('reject')}
                      loading={transitionMutation.isPending}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {canManage && request.status === 'APPROVED' && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        navigate(`/purchase-orders?requestId=${request.id}`)
                      }
                    >
                      <ArrowRight size={15} /> Create purchase order
                    </Button>
                    <Button
                      onClick={() => transition('fulfill')}
                      loading={transitionMutation.isPending}
                    >
                      Fulfill request
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}
