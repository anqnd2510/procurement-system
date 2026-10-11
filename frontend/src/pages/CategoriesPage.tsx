import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { NativeSelect } from '../components/ui/native-select';
import { ErrorMessage } from '../components/ui';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { invalidateDashboard } from '../lib/query-state';
import { api, getErrorMessage } from '../lib/api';
import type { Category } from '../types';
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

type CategoryForm = { name: string; description: string; parentId: string };
const emptyForm: CategoryForm = { name: '', description: '', parentId: '' };

export function CategoriesPage() {
  const { t } = useTranslation();
  const { activeOrganization, canManage } = useOrganization();
  const isCatalogOrganization = Boolean(activeOrganization);
  const client = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm | null>(null);
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['categories', activeOrganization?.id],
    queryFn: () =>
      api.get<Category[]>('/categories/workspace', {
        organization: activeOrganization?.id,
      }),
    enabled: isCatalogOrganization,
  });
  const saveMutation = useMutation({
    mutationFn: (payload: CategoryForm) =>
      editing
        ? api.put<Category>(`/categories/${editing.id}`, {
            name: payload.name,
            description: payload.description || undefined,
            parentId: payload.parentId || undefined,
          })
        : api.post<Category>('/categories', {
            name: payload.name,
            description: payload.description || undefined,
            parentId: payload.parentId || undefined,
          }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['categories'] });
      void invalidateDashboard(client, activeOrganization?.id);
      setForm(null);
      setEditing(null);
      setError('');
    },
    onError: (saveError) => setError(getErrorMessage(saveError)),
  });
  const deleteMutation = useMutation({
    mutationFn: (category: Category) =>
      api.delete(`/categories/${category.id}`),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['categories'] });
      void invalidateDashboard(client, activeOrganization?.id);
    },
  });
  const categories = query.data ?? [];

  function openCreate(parentId = '') {
    setEditing(null);
    setError('');
    setForm({ ...emptyForm, parentId });
  }
  function openEdit(category: Category) {
    setEditing(category);
    setError('');
    setForm({
      name: category.name,
      description: category.description ?? '',
      parentId: category.parentId ?? '',
    });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    saveMutation.mutate(form);
  }

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="CATALOG · TAXONOMY"
        title="Categories"
        description="Organize products into a hierarchy your teams can browse and request."
        action={
          canManage && isCatalogOrganization ? (
            <Button onClick={() => openCreate()}>
              <Plus size={16} /> {t('New category')}{' '}
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
            'Category changes require the OWNER or MANAGER organization role.',
          )}{' '}
        </Notice>
      )}
      <div className="category-overview-strip">
        <span className="category-overview-icon">
          <FolderTree size={18} />
        </span>
        <div>
          <strong>
            {t('{{count}} categories', { count: categories.length })}
          </strong>
          <span>
            {t('including immediate child categories returned by the API')}
          </span>
        </div>
        <span className="category-overview-end">{t('HIERARCHY VIEW')}</span>
      </div>
      <Panel
        title="Category structure"
        subtitle="Parent and child categories from the live catalog"
      >
        {!isCatalogOrganization ? (
          <EmptyState
            title="Categories unavailable"
            description="Choose an organization to continue."
          />
        ) : query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState
            error={query.error}
            onRetry={() => void query.refetch()}
          />
        ) : !categories.length ? (
          <EmptyState
            title="No categories yet"
            description="Create a root category, then add child categories as needed."
            action={
              canManage ? (
                <Button onClick={() => openCreate()}>
                  <Plus size={15} /> {t('Create category')}{' '}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="category-tree">
            {categories
              .filter((category) => !category.parentId)
              .map((category) => (
                <div className="category-tree-group" key={category.id}>
                  <CategoryRow
                    category={category}
                    canManage={canManage}
                    onAddChild={() => openCreate(category.id)}
                    onEdit={() => openEdit(category)}
                    onDelete={() => {
                      if (
                        window.confirm(
                          t(
                            'Soft-delete {{name}}? Categories with active products cannot be removed.',
                            { name: category.name },
                          ),
                        )
                      )
                        deleteMutation.mutate(category);
                    }}
                  />
                  {category.children?.map((child) => (
                    <CategoryRow
                      key={child.id}
                      category={child}
                      child
                      canManage={canManage}
                      onAddChild={() => openCreate(child.id)}
                      onEdit={() => openEdit(child)}
                      onDelete={() => {
                        if (
                          window.confirm(
                            t('Soft-delete {{name}}?', { name: child.name }),
                          )
                        )
                          deleteMutation.mutate(child);
                      }}
                    />
                  ))}
                </div>
              ))}
          </div>
        )}
        {deleteMutation.isError && (
          <ErrorMessage error={deleteMutation.error} />
        )}
      </Panel>
      {form && (
        <Modal
          title={editing ? 'Edit category' : 'Create category'}
          onClose={() => setForm(null)}
        >
          <form className="modal-form" onSubmit={submit}>
            <FormField label="Category name">
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                maxLength={100}
                required
                autoFocus
              />
            </FormField>
            <FormField
              label="Parent category"
              hint="Leave empty to create a root category."
            >
              <NativeSelect
                value={form.parentId}
                onChange={(event) =>
                  setForm({ ...form, parentId: event.target.value })
                }
              >
                <option value="">{t('No parent')}</option>
                {categories
                  .filter((category) => category.id !== editing?.id)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                {categories.flatMap((category) =>
                  (category.children ?? [])
                    .filter((child) => child.id !== editing?.id)
                    .map((child) => (
                      <option key={child.id} value={child.id}>
                        — {child.name}
                      </option>
                    )),
                )}
              </NativeSelect>
            </FormField>
            <FormField label="Description">
              <Textarea
                rows={3}
                maxLength={500}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </FormField>
            {error && <ErrorMessage error={error} />}
            <div className="modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setForm(null)}
              >
                {' '}
                {t('Cancel')}{' '}
              </Button>
              <Button type="submit" loading={saveMutation.isPending}>
                {editing ? 'Save changes' : 'Create category'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  child = false,
  canManage,
  onAddChild,
  onEdit,
  onDelete,
}: {
  category: Category;
  child?: boolean;
  canManage: boolean;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={`category-row ${child ? 'category-row-child' : ''}`}>
      <span
        className={`category-folder ${child ? 'category-folder-child' : ''}`}
      >
        <FolderTree size={17} />
      </span>
      <span className="category-row-copy">
        <strong>{category.name}</strong>
        <small>
          {category.description || t(child ? 'Subcategory' : 'Root category')}
        </small>
      </span>
      <span className="category-id">
        {category.id.slice(0, 8).toUpperCase()}
      </span>
      {canManage && (
        <div className="row-actions">
          <button
            className="icon-button"
            title={t('Add child category')}
            aria-label={t('Add child category under {{name}}', {
              name: category.name,
            })}
            onClick={onAddChild}
          >
            <Plus size={15} />
          </button>
          <button
            className="icon-button"
            aria-label={t('Edit {{name}}', { name: category.name })}
            onClick={onEdit}
          >
            <Pencil size={15} />
          </button>
          <button
            className="icon-button danger-icon"
            aria-label={t('Delete {{name}}', { name: category.name })}
            onClick={onDelete}
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
