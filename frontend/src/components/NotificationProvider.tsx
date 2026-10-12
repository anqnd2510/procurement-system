import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; kind: ToastKind; message: string };
type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
};
type NotificationContextValue = {
  notify: (kind: ToastKind, message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};
type PendingConfirmation = {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(
    null,
  );
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const pendingResolve = useRef<((confirmed: boolean) => void) | null>(null);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, kind, message }].slice(-4));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 5000),
      );
    },
    [dismiss],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      pendingResolve.current?.(false);
      pendingResolve.current = resolve;
      setConfirmation({ options, resolve });
    });
  }, []);

  const resolveConfirmation = useCallback((confirmed: boolean) => {
    pendingResolve.current?.(confirmed);
    pendingResolve.current = null;
    setConfirmation(null);
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      pendingResolve.current?.(false);
      pendingResolve.current = null;
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}
      <div className="app-toasts" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => {
          const Icon =
            toast.kind === 'success'
              ? CheckCircle2
              : toast.kind === 'error'
                ? AlertCircle
                : Info;
          return (
            <div
              className={`app-toast app-toast-${toast.kind}`}
              key={toast.id}
              role={toast.kind === 'error' ? 'alert' : 'status'}
            >
              <Icon size={19} aria-hidden="true" />
              <p>{t(toast.message)}</p>
              <button
                className="app-toast-close"
                aria-label={t('Dismiss notification')}
                onClick={() => dismiss(toast.id)}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <Dialog.Root
        open={Boolean(confirmation)}
        onOpenChange={(open) => !open && resolveConfirmation(false)}
      >
        <Dialog.Portal>
          {confirmation && (
            <Dialog.Overlay className="modal-backdrop">
              <Dialog.Content className="modal app-confirm-dialog">
                <Dialog.Title asChild>
                  <h2>{t(confirmation.options.title)}</h2>
                </Dialog.Title>
                <Dialog.Description className="app-confirm-description">
                  {t(confirmation.options.description)}
                </Dialog.Description>
                <div className="app-confirm-actions">
                  <Button
                    variant="secondary"
                    onClick={() => resolveConfirmation(false)}
                  >
                    {t('Keep it')}
                  </Button>
                  <Button
                    variant={
                      confirmation.options.destructive ? 'danger' : 'primary'
                    }
                    onClick={() => resolveConfirmation(true)}
                  >
                    {t(confirmation.options.confirmLabel ?? 'Continue')}
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Overlay>
          )}
        </Dialog.Portal>
      </Dialog.Root>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      'useNotifications must be used within NotificationProvider',
    );
  return context;
}
