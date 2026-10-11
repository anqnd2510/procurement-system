import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { NativeSelect } from '../components/ui/native-select';
import { ErrorMessage } from '../components/ui';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { ListPagination, ListSearch } from '../components/ListControls';
import { NumberInput } from '../components/ui/number-input';
import { numericError } from '../lib/numeric-input';
import { keepScopedData, invalidateDashboard } from '../lib/query-state';
import { useDebouncedValue } from '../lib/use-debounced-value';
import { RefreshIndicator } from '../components/ui';
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
  const isCatalogOrganization = Boolean(activeOrganization);
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const searchTerm = useDebouncedValue(search);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [formError, setFormError] = useState('');
  const query = useQuery({
    queryKey: ['products', activeOrganization?.id, 'list', page, searchTerm],
    placeholderData: keepScopedData<PageData<Product>>([
      'products',
      activeOrganization?.id,
    ]),
    queryFn: () =>
      api.get<PageData<Product>>(
        `/products/workspace?page=${page}&limit=${PAGE_LIMIT}&search=${encodeURIComponent(searchTerm)}`,
        {
          organization: activeOrganization?.id,
        },
      ),
    enabled: isCatalogOrganization,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories', activeOrganization?.id],
    queryFn: () =>
      api.get<Category[]>('/categories/workspace', {
        organization: activeOrganization?.id,
      }),
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
      void invalidateDashboard(client, activeOrganization?.id);
      setEditing(null);
      setForm(null);
      setFormError('');
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: (product: Product) => api.delete(`/products/${product.id}`),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['products'] });
      void invalidateDashboard(client, activeOrganization?.id);
    },
  });

  const visibleProducts = query.data?.items ?? [];

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
    if (!form) return;
    const error = numericError(form.unit_price, {
      min: 0.01,
      max: 9999999999.99,
      decimals: 2,
    });
    if (error) {
      setFormError(error);
      return;
    }
    saveMutation.mutate(form);
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
              <Plus size={16} /> {t('Add product')}{' '}
            </Button>
          ) : undefined
        }
      />
      {!isCatalogOrganization && (
        <Notice tone="warning">
          {t('Choose an organization to continue.')}
        </Notice>
      )}
      {!canManage && isCatalogOrganization && (
        <Notice>
          {' '}
          {t(
            'Catalog changes require the OWNER or MANAGER organization role.',
          )}{' '}
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
          <ListSearch
            label="Search products"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
        <RefreshIndicator fetching={query.isFetching && !query.isLoading} />
        {!isCatalogOrganization ? (
          <EmptyState
            title="Choose an organization"
            description="Choose an organization to continue."
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
                ? 'Try a different name or SKU.'
                : 'Create a product to make it available for requests.'
            }
            action={
              canManage && !search ? (
                <Button onClick={openCreate}>
                  <Plus size={15} /> {t('Add product')}{' '}
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
            <ListPagination
              meta={query.data!.meta}
              busy={query.isPlaceholderData}
              onPageChange={setPage}
            />
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
              <Input
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
                <Input
                  value={form.sku}
                  onChange={(event) =>
                    setForm({ ...form, sku: event.target.value })
                  }
                  maxLength={100}
                />
              </FormField>
              <FormField label="Unit price (USD)">
                <NumberInput
                  min={0.01}
                  max={9999999999.99}
                  decimals={2}
                  value={form.unit_price}
                  onValueChange={(value) =>
                    setForm({ ...form, unit_price: value })
                  }
                  required
                />
              </FormField>
            </div>
            <FormField label="Category">
              <NativeSelect
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
              </NativeSelect>
            </FormField>
            <FormField label="Description">
              <Textarea
                rows={3}
                maxLength={1000}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </FormField>
            {formError && <ErrorMessage error={formError} />}
            <div className="modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(null);
                }}
              >
                {' '}
                {t('Cancel')}{' '}
              </Button>
              <Button type="submit" loading={saveMutation.isPending}>
                {editing ? 'Save changes' : 'Create product'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {deleteMutation.isError && <ErrorMessage error={deleteMutation.error} />}
    </div>
  );
}
