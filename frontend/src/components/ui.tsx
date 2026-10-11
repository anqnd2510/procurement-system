import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { LoaderCircle, X } from 'lucide-react';
import { getErrorMessage, isNotFound } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { localizeReactNode } from '../lib/localize-react-node';

export { Button } from './ui/button';
export { Input } from './ui/input';
export { Textarea } from './ui/textarea';
export { NativeSelect } from './ui/native-select';

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{t(eyebrow)}</div>}
        <h1>{t(title)}</h1>
        {description && <p>{t(description)}</p>}
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <section className={`panel ${className}`.trim()}>
      {(title || action) && (
        <div className="panel-heading">
          <div>
            {title && <h2>{t(title)}</h2>}
            {subtitle && <p>{t(subtitle)}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span className="status-dot" />
      {t(status, { defaultValue: status.replaceAll('_', ' ') })}
    </span>
  );
}

export function LoadingState({
  label = 'Loading workspace data…',
}: {
  label?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="state-box">
      <LoaderCircle size={20} className="spin" />
      <span>{t(label)}</span>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  onBack,
}: {
  error: unknown;
  onRetry?: () => void;
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  if (isNotFound(error))
    return (
      <div
        className="state-box rounded-lg border border-line bg-surface text-ink"
        role="status"
      >
        <div>
          <strong>{t('Not found')}</strong>
          <p>{t(getErrorMessage(error))}</p>
          <p>{t('Check the link or return to the list to continue.')}</p>
        </div>
        {onBack ? (
          <Button variant="secondary" onClick={onBack}>
            {t('Back to list')}
          </Button>
        ) : (
          onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              {t('Check again')}
            </Button>
          )
        )}
      </div>
    );
  return (
    <div className="state-box state-error" role="alert">
      <div>
        <strong>{t('We couldn’t load this data.')}</strong>
        <p>{t(getErrorMessage(error))}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('Try again')}
        </Button>
      )}
    </div>
  );
}

export function ErrorMessage({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const missing = isNotFound(error);
  return (
    <div
      className={missing ? 'notice notice-info' : 'form-error'}
      role={missing ? 'status' : 'alert'}
    >
      {t(typeof error === 'string' ? error : getErrorMessage(error))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <div className="empty-icon">—</div>
      <strong>{t(title)}</strong>
      <p>{t(description)}</p>
      {action}
    </div>
  );
}

export function RefreshIndicator({ fetching }: { fetching: boolean }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex min-h-7 items-center gap-2 px-5 text-sm text-muted"
      role="status"
      aria-live="polite"
    >
      {fetching && (
        <>
          <LoaderCircle size={14} className="spin" aria-hidden="true" />
          <span>{t('Updating data…')}</span>
        </>
      )}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop">
          <Dialog.Content
            aria-describedby={undefined}
            className={`modal ${wide ? 'modal-wide' : ''}`}
            onEscapeKeyDown={(event) => {
              // Nested editors own Escape, including the brief interval before
              // Radix updates its active layer after a popup opens.
              if (
                event.target instanceof HTMLElement &&
                event.target.closest('[data-dialog-escape-boundary]')
              )
                event.preventDefault();
            }}
          >
            <div className="modal-heading">
              <Dialog.Title asChild>
                <h2>{t(title)}</h2>
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="icon-button" aria-label={t('Close dialog')}>
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Notice({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'warning' | 'success';
}) {
  const { t } = useTranslation();
  return (
    <div className={`notice notice-${tone}`}>
      {localizeReactNode(children, (key) => t(key))}
    </div>
  );
}

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <label className="form-field">
      <span>{t(label)}</span>
      {children}
      {hint && <small>{t(hint)}</small>}
    </label>
  );
}
