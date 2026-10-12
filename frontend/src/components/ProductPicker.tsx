import { useId, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ChevronsUpDown,
  LoaderCircle,
  PackageSearch,
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { money } from '../lib/format';
import { useDebouncedValue } from '../lib/use-debounced-value';
import type { PageData, Product } from '../types';
import { Button, ErrorMessage } from './ui';
import { Command, CommandInput, CommandItem, CommandList } from './ui/command';
import { fieldControl } from './ui/field-styles';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export type SelectedProduct = Pick<Product, 'id' | 'name' | 'sku'>;
type ProductPickerProps = {
  organizationId: string;
  value: SelectedProduct | null;
  onSelect: (product: Product | null) => void;
  disabled?: boolean;
  label?: string;
  emptyLabel?: string;
  clearLabel?: string;
};

export function ProductPicker({
  organizationId,
  value,
  onSelect,
  disabled,
  label = 'Catalog product (optional)',
  emptyLabel = 'Custom item',
  clearLabel = 'Use a custom item',
}: ProductPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();
  const selectedLabel = value
    ? [value.name, value.sku].filter(Boolean).join(' · ')
    : t(emptyLabel);
  return (
    <div className="form-field min-w-0">
      <label id={`${id}-label`} htmlFor={id}>
        {t(label)}
      </label>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            aria-labelledby={`${id}-label ${id}-value`}
            disabled={disabled || !organizationId}
            className={cn(
              fieldControl,
              'flex min-h-11 items-center justify-between gap-3 text-left',
            )}
          >
            <span
              id={`${id}-value`}
              className="min-w-0 truncate"
              title={value ? selectedLabel : undefined}
            >
              {selectedLabel}
            </span>
            <ChevronsUpDown
              size={16}
              className="shrink-0 text-muted"
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          aria-label={t('Choose a catalog product')}
          data-dialog-escape-boundary
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
            }
          }}
        >
          {open && (
            <ProductSearch
              key={organizationId}
              organizationId={organizationId}
              value={value}
              clearLabel={clearLabel}
              onSelect={(product) => {
                onSelect(product);
                setOpen(false);
              }}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ProductSearch({
  organizationId,
  value,
  onSelect,
  clearLabel = 'Use a custom item',
}: ProductPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim());
  const typing = search.trim() !== term;
  const query = useInfiniteQuery({
    queryKey: ['products', organizationId, 'picker', term],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: '20',
      });
      if (term) params.set('search', term);
      return api.get<PageData<Product>>(`/products/workspace?${params}`, {
        organization: organizationId,
        signal,
      });
    },
    getNextPageParam: (page) =>
      page.meta.hasNext ? page.meta.page + 1 : undefined,
    staleTime: 30_000,
  });
  // The API filters the entire organization catalog; cmdk must not filter only loaded rows.
  const products = [
    ...new Map(
      query.data?.pages
        .flatMap((page) => page.items)
        .map((product) => [product.id, product]) ?? [],
    ).values(),
  ];
  const waiting = typing || query.isPending;
  return (
    <div className="flex max-h-[min(440px,var(--radix-popover-content-available-height))] flex-col">
      <Command shouldFilter={false} label={t('Choose a catalog product')}>
        <CommandInput
          placeholder={t('Search by product name or code…')}
          aria-label={t('Search by product name or code…')}
          value={search}
          onValueChange={setSearch}
          maxLength={100}
          autoComplete="off"
        />
        <CommandList aria-busy={waiting || query.isFetching}>
          {waiting ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted"
            >
              <LoaderCircle
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
              {t('Searching products…')}
            </div>
          ) : (
            <>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => onSelect(product)}
                >
                  <Check
                    size={16}
                    className={cn(
                      'shrink-0 text-brand',
                      value?.id !== product.id && 'invisible',
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="break-words font-medium [overflow-wrap:anywhere]">
                      {product.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm text-muted">
                      <span className="break-all">{product.sku}</span>
                      <span>{money(product.unit_price)}</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
              {!products.length && !query.isError && (
                <div
                  role="status"
                  className="space-y-2 px-4 py-6 text-center text-sm text-muted"
                >
                  <PackageSearch
                    className="mx-auto"
                    size={24}
                    aria-hidden="true"
                  />
                  <p>
                    {t(
                      term
                        ? 'No matching products found.'
                        : 'No products in this catalog',
                    )}
                  </p>
                  <p>{t('Try another product name or code, or use a custom item.')}</p>
                </div>
              )}
            </>
          )}
        </CommandList>
      </Command>
      {!typing && query.isError && (
        <div className="shrink-0 space-y-2 border-t border-line p-3 text-sm">
          <ErrorMessage error={query.error} />
          <Button
            variant="secondary"
            size="small"
            loading={query.isFetching}
            onClick={() =>
              void (query.isFetchNextPageError
                ? query.fetchNextPage()
                : query.refetch())
            }
          >
            {t('Try again')}
          </Button>
        </div>
      )}
      {!waiting && !query.isError && Boolean(products.length) && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
          <span role="status" className="text-sm text-muted">
            {t('{{shown}} of {{total}} products', {
              shown: products.length,
              total: query.data?.pages[0].meta.total ?? 0,
            })}
          </span>
          {query.hasNextPage && (
            <Button
              variant="secondary"
              size="small"
              loading={query.isFetchingNextPage}
              disabled={query.isFetching}
              onClick={() => void query.fetchNextPage()}
            >
              {t('Load more products')}
            </Button>
          )}
        </div>
      )}
      <div className="shrink-0 border-t border-line p-1">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-ink outline-none hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-blue-950"
        >
          <Check
            size={16}
            className={cn('shrink-0 text-brand', value && 'invisible')}
            aria-hidden="true"
          />
          {t(clearLabel)}
        </button>
      </div>
    </div>
  );
}
