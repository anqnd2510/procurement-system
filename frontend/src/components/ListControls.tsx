import { useId } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PageMeta } from '../types';
import { cn } from '../lib/cn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NativeSelect } from './ui/native-select';

type Choice = { value: string; label: string };

export function ListToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end gap-3 border-b border-line/70 px-5 py-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListSearch({
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="w-full min-w-0 grow basis-auto space-y-1.5 sm:w-auto">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {t(label)}
      </label>
      <div className="relative">
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        />
        <Input
          id={id}
          value={value}
          maxLength={100}
          disabled={disabled}
          placeholder={t(placeholder)}
          onChange={(event) => onChange(event.target.value)}
          className="pl-10 pr-10"
        />
        {value && (
          <button
            type="button"
            disabled={disabled}
            aria-label={t('Clear search')}
            onClick={() => onChange('')}
            className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-brand/10 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export function ListFilter({
  label,
  allLabel,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  allLabel: string;
  value: string;
  options: Choice[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="w-full min-w-0 flex-1 basis-44 space-y-1.5 sm:w-auto sm:max-w-60">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {t(label)}
      </label>
      <NativeSelect
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t(allLabel)}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.label)}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

export function ListPagination({
  meta,
  onPageChange,
  busy = false,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  if (meta.total === 0) return null;
  const pageCount = Math.max(1, meta.totalPages);
  const page = Math.min(Math.max(1, meta.page), pageCount);
  const from = (page - 1) * meta.limit + 1;
  const to = Math.min(page * meta.limit, meta.total);
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => {
    const start = Math.max(1, Math.min(page - 2, pageCount - 4));
    return start + index;
  });
  return (
    <nav
      aria-label={t('Pagination')}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 px-5 py-4 text-sm text-muted"
    >
      <span>
        {t('Showing {{from}}–{{to}} of {{total}} records', {
          from,
          to,
          total: meta.total,
        })}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="icon"
          className="size-11 p-0"
          aria-label={t('Previous page')}
          disabled={busy || !meta.hasPrev}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={17} />
        </Button>
        <span className="min-w-16 rounded-md bg-brand/10 px-2 py-2 text-center font-semibold text-brand sm:hidden">
          {page} / {pageCount}
        </span>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((number) => (
            <Button
              key={number}
              size="icon"
              variant="ghost"
              className="size-11 p-0"
              style={
                number === page
                  ? { backgroundColor: 'var(--color-brand)', color: '#fff' }
                  : undefined
              }
              aria-label={t('Page {{page}}', { page: number })}
              aria-current={number === page ? 'page' : undefined}
              disabled={busy}
              onClick={() => onPageChange(number)}
            >
              {number}
            </Button>
          ))}
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="size-11 p-0"
          aria-label={t('Next page')}
          disabled={busy || !meta.hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={17} />
        </Button>
      </div>
    </nav>
  );
}
