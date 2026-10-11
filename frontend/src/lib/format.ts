export function currentLocale() {
  if (typeof document === 'undefined') return 'en-US';
  return document.documentElement.lang === 'vi' ? 'vi-VN' : 'en-US';
}

export function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(currentLocale(), {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function dateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(currentLocale(), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

export function dateOnly(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(currentLocale(), {
        dateStyle: 'medium',
      }).format(date);
}

export function initials(value: string) {
  return value
    .split(/[.@\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
