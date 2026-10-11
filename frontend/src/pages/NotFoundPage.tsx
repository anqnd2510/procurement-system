import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-6 text-ink">
      <section className="max-w-lg space-y-5 text-center">
        <p className="text-sm font-semibold tracking-widest text-muted">404</p>
        <h1 className="text-3xl font-semibold">{t('Page not found')}</h1>
        <p className="text-base text-muted">
          {t('This link may have changed or the page may no longer exist.')}
        </p>
        <Button asChild>
          <Link to="/">{t('Back to workspace')}</Link>
        </Button>
      </section>
    </main>
  );
}
