import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import { money, dateTime } from '../lib/format';
import type { Category, PageData, Product } from '../types';
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
} from '../components/ui';

const PAGE_LIMIT = 10;
type ProductForm = {
  name: string;
  sku: string;
  description: string;
  unit_price: string;
  categoryId: string;
};
const blankForm: ProductForm = {
  name: '',
  sku: '',
  description: '',
  unit_price: '',
  categoryId: '',
};

export function ProductsPage() {
  const { t } = useTranslation();
  const { activeOrganization, canManage } = useOrganization();
  const isCatalogOrganization = activeOrganization?.slug === 'acme-procurement';
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [formError, setFormError] = useState('');
  const query = useQuery({
    queryKey: ['products', 'list', page],
    queryFn: () =>
      api.get<PageData<Product>>(`/products?page=${page}&limit=${PAGE_LIMIT}`, {
        organization: false,
      }),
    enabled: isCatalogOrganization,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories', { organization: false }),
    enabled: isCatalogOrganization,
  });
  const saveMutation = useMutation({
    mutationFn: (payload: ProductForm) =>
      editing
        ? api.put<Product>(`/products/${editing.id}`, {
            name: payload.name,
            sku: payload.sku || undefined,
            description: payload.description || undefined,
            unit_price: Number(payload.unit_price),
            categoryId: payload.categoryId || undefined,
          })
        : api.post<Product>('/products', {
            name: payload.name,
            sku: payload.sku || undefined,
            description: payload.description || undefined,
            unit_price: Number(payload.unit_price),
            categoryId: payload.categoryId || undefined,
          }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['products'] });
      setEditing(null);
      setForm(null);
      setFormError('');
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: (product: Product) => api.delete(`/products/${product.id}`),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['products'] }),
  });

  const visibleProducts = useMemo(
    () =>
      (query.data?.items ?? []).filter((product) => {
        const term = search.trim().toLowerCase();
        return (
          !term ||
          `${product.name} ${product.sku} ${product.category?.name ?? ''}`
            .toLowerCase()
            .includes(term)
        );
      }),
    [query.data?.items, search],
  );

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    setFormError('');
  }
  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description ?? '',
      unit_price: String(product.unit_price),
      categoryId: product.categoryId ?? '',
    });
    setFormError('');
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (form) saveMutation.mutate(form);
  }

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="CATALOG · PRODUCTS"
        title="Product catalog"
        description="Maintain the items your teams can request and your organization can receive."
        action={
          canManage && isCatalogOrganization ? (
            <Button onClick={openCreate}>
              <Plus size={16} /> Add product
            </Button>
          ) : undefined
        }
      />
      {!isCatalogOrganization && (
        <Notice tone="warning">
          {t('The current API reads catalog data from the default')}{' '}
          <code>acme-procurement</code>{' '}
          {t(
            'organization. Product operations are paused here so writes cannot disappear from this view. Select that workspace or extend the backend’s catalog read endpoints for tenant-aware access.',
          )}
        </Notice>
      )}
      {!canManage && isCatalogOrganization && (
        <Notice>
          Catalog changes require the OWNER or MANAGER organization role.
        </Notice>
      )}

      <div className="catalog-summary-row">
        <div className="catalog-summary">
          <span className="catalog-summary-icon">
            <Package size={17} />
          </span>
          <span>
            <small>{t('CATALOG SIZE')}</small>
            <strong>
              {query.data?.meta.total ?? '—'} <em>{t('products')}</em>
            </strong>
          </span>
        </div>
        <div className="catalog-summary">
          <span className="catalog-summary-icon icon-sand">
            <span className="category-glyph">◫</span>
          </span>
          <span>
            <small>{t('PRODUCT CATEGORIES')}</small>
            <strong>
              {categoriesQuery.data?.length ?? '—'} <em>{t('groups')}</em>
            </strong>
          </span>
        </div>
        <div className="catalog-summary-help">
          <span className="online-dot" /> {t('API-connected catalog')}{' '}
          <span>·</span> {t('soft-deleted records are hidden')}
        </div>
      </div>

      <Panel className="table-panel">
        <div className="table-toolbar">
          <div>
            <h2>{t('Products')}</h2>
            <p>{t('SKU, category, and list price')}</p>
          </div>
          <label className="search-box">
            <Search size={16} />
            <input
              aria-label={t('Search current product page')}
              placeholder={t('Search this page…')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>
        </div>
        {!isCatalogOrganization ? (
          <EmptyState
            title="Catalog not available for this workspace"
            description="Current read endpoints are pinned to the default organization."
          />
        ) : query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState
            error={query.error}
            onRetry={() => void query.refetch()}
          />
        ) : !visibleProducts.length ? (
          <EmptyState
            title={
              search ? 'No matching products' : 'No products in this catalog'
            }
            description={
              search
                ? 'Try a different name, SKU, or category.'
                : 'Create a product to make it available for requests.'
            }
            action={
              canManage && !search ? (
                <Button onClick={openCreate}>
                  <Plus size={15} /> Add product
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('PRODUCT')}</th>
                    <th>{t('SKU')}</th>
                    <th>{t('CATEGORY')}</th>
                    <th>{t('UNIT PRICE')}</th>
                    <th>{t('UPDATED')}</th>
                    <th>
                      <span className="sr-only">{t('Actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <span className="product-thumbnail">
                            {product.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span>
                            <strong>{product.name}</strong>
                            <small>
                              {product.description ||
                                t('No description provided')}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="mono-label">{product.sku}</span>
                      </td>
                      <td>
                        {product.category ? (
                          <span className="category-chip">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="muted">{t('Uncategorized')}</span>
                        )}
                      </td>
                      <td className="amount-cell">
                        {money(product.unit_price)}
                      </td>
                      <td className="muted">{dateTime(product.updatedAt)}</td>
                      <td>
                        <div className="row-actions">
                          {canManage && (
                            <>
                              <button
                                className="icon-button"
                                aria-label={t('Edit {{name}}', {
                                  name: product.name,
                                })}
                                onClick={() => openEdit(product)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="icon-button danger-icon"
                                aria-label={t('Delete {{name}}', {
                                  name: product.name,
                                })}
                                disabled={deleteMutation.isPending}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      t(
                                        'Soft-delete {{name}}? It will be hidden from the active catalog.',
                                        { name: product.name },
                                      ),
                                    )
                                  )
                                    deleteMutation.mutate(product);
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                          <button
                            className="icon-button"
                            aria-label={t('More product actions')}
                            title={t(
                              'Actions are limited to supported API operations',
                            )}
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-pagination">
              <span>
                Showing{' '}
                <strong>
                  {(query.data!.meta.page - 1) * query.data!.meta.limit + 1}–
                  {Math.min(
                    query.data!.meta.page * query.data!.meta.limit,
                    query.data!.meta.total,
                  )}
                </strong>{' '}
                {t('of')} <strong>{query.data!.meta.total}</strong>{' '}
                {t('products')}
                {search && (
                  <span> · {t('Search is limited to this page')}</span>
                )}
              </span>
              <div>
                <Button
                  variant="secondary"
                  disabled={!query.data!.meta.hasPrev}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <span className="page-number">
                  {query.data!.meta.page} /{' '}
                  {Math.max(1, query.data!.meta.totalPages)}
                </span>
                <Button
                  variant="secondary"
                  disabled={!query.data!.meta.hasNext}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Panel>

      {form && (
        <Modal
          title={editing ? 'Edit product' : 'Add product'}
          onClose={() => {
            setEditing(null);
            setForm(null);
          }}
        >
          <form className="modal-form" onSubmit={submit}>
            <FormField label="Product name">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                maxLength={200}
                required
                autoFocus
              />
            </FormField>
            <div className="form-grid-two">
              <FormField
                label="SKU"
                hint="Leave blank to let the API generate one."
              >
                <input
                  value={form.sku}
                  onChange={(event) =>
                    setForm({ ...form, sku: event.target.value })
                  }
                  maxLength={100}
                />
              </FormField>
              <FormField label="Unit price (USD)">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.unit_price}
                  onChange={(event) =>
                    setForm({ ...form, unit_price: event.target.value })
                  }
                  required
                />
              </FormField>
            </div>
            <FormField label="Category">
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm({ ...form, categoryId: event.target.value })
                }
              >
                <option value="">{t('No category')}</option>
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Description">
              <textarea
                rows={3}
                maxLength={1000}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </FormField>
            {formError && (
              <div className="form-error" role="alert">
                {formError}
              </div>
            )}
            <div className="modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saveMutation.isPending}>
                {editing ? 'Save changes' : 'Create product'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {deleteMutation.isError && (
        <div className="toast-error" role="alert">
          {getErrorMessage(deleteMutation.error)}
        </div>
      )}
    </div>
  );
}
