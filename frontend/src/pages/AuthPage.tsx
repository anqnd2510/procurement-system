import { ErrorMessage } from '../components/ui';
import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Boxes,
  Command,
  Eye,
  EyeOff,
  Languages,
  LockKeyhole,
  Mail,
  Moon,
  Sun,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../lib/api';
import { Button } from '../components/ui';
import { usePreferences } from '../preferences/PreferencesProvider';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';
  const { t } = useTranslation();
  const { language, setLanguage, theme, toggleTheme } = usePreferences();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) await signUp(email, password);
      else await signIn(email, password);
      const next = searchParams.get('next');
      navigate(
        next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\')
          ? next
          : '/',
        { replace: true },
      );
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout font-sans">
      <section className="auth-story bg-brand-navy bg-none text-slate-100 dark:bg-slate-950">
        <Link
          className="auth-brand font-sans font-bold [&>span:last-child]:text-blue-300"
          to="/login"
        >
          <span className="brand-mark">
            <Command size={18} />
          </span>{' '}
          Supply<span>Desk</span>
        </Link>
        <div className="auth-story-copy">
          <div className="eyebrow eyebrow-light text-blue-200">
            {t('PROCUREMENT WORKSPACE')}
          </div>
          <h1 className="font-sans text-4xl leading-tight font-bold tracking-tight xl:text-5xl">
            {t('Bring every purchase decision into focus.')}
          </h1>
          <p className="text-base leading-relaxed text-slate-300">
            {t(
              'A clear operating view across requests, inventory, and the teams behind every order.',
            )}
          </p>
          <div className="auth-feature-list text-base text-blue-100">
            <span>
              <span className="feature-check">✓</span>{' '}
              {t('Organization-scoped workspaces')}
            </span>
            <span>
              <span className="feature-check">✓</span>{' '}
              {t('Traceable request approvals')}
            </span>
            <span>
              <span className="feature-check">✓</span>{' '}
              {t('Inventory-aware receiving')}
            </span>
          </div>
        </div>
        <div className="auth-story-foot text-sm text-slate-300">
          <span>{t('Built for the work behind the purchase.')}</span>
          <span>{t('SECURE WORKSPACE')}</span>
        </div>
      </section>
      <section className="auth-form-side bg-slate-50 dark:bg-slate-900">
        <div className="auth-preferences" aria-label={t('Preferences')}>
          <button
            className="preference-control"
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            title={t('Change language')}
            aria-label={t('Change language')}
          >
            <Languages size={16} />
            <span>{language.toUpperCase()}</span>
          </button>
          <button
            className="preference-control icon-only"
            onClick={toggleTheme}
            title={t(
              theme === 'light'
                ? 'Switch to dark mode'
                : 'Switch to light mode',
            )}
            aria-label={t(
              theme === 'light'
                ? 'Switch to dark mode'
                : 'Switch to light mode',
            )}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
        <div className="auth-form-card rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-8 [&_input]:text-base [&_label]:text-sm">
          <div className="auth-form-icon">
            <Boxes size={19} />
          </div>
          <span className="eyebrow">{t('WELCOME TO SUPPLYDESK')}</span>
          <h2 className="font-sans text-2xl leading-snug font-bold text-ink">
            {t(
              isRegister ? 'Create your account' : 'Sign in to your workspace',
            )}
          </h2>
          <p className="auth-subtitle text-base leading-relaxed text-muted">
            {t(
              isRegister
                ? 'Start with an employee account. Ask a manager to add you to your organization after signing in.'
                : 'Enter your account details to continue to procurement operations.',
            )}
          </p>
          <form onSubmit={(event) => void submit(event)} className="auth-form">
            <label className="form-field">
              <span>{t('Work email')}</span>
              <div className="input-with-icon">
                <Mail size={16} />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </label>
            <label className="form-field">
              <span>{t('Password')}</span>
              <div className="input-with-icon">
                <LockKeyhole size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={
                    isRegister ? 'new-password' : 'current-password'
                  }
                  placeholder="••••••••"
                  minLength={isRegister ? 6 : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-visibility"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={t(
                    showPassword ? 'Hide password' : 'Show password',
                  )}
                  title={t(showPassword ? 'Hide password' : 'Show password')}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {isRegister && <small>{t('Use at least 6 characters.')}</small>}
            </label>
            {error && <ErrorMessage error={error} />}
            <Button type="submit" loading={loading} className="auth-submit">
              {t(isRegister ? 'Create account' : 'Sign in')}{' '}
              <ArrowRight size={16} />
            </Button>
          </form>
          <div className="auth-switch">
            {t(
              isRegister
                ? 'Already have an account?'
                : 'New to this workspace?',
            )}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {t(isRegister ? 'Sign in' : 'Create an account')}
            </Link>
          </div>
          <div className="auth-security">
            <LockKeyhole size={13} />{' '}
            {t('Your credentials are sent only to the configured API.')}
          </div>
        </div>
        <div className="auth-form-footer">
          © {new Date().getFullYear()} SupplyDesk · {t('Procurement workspace')}
        </div>
      </section>
    </main>
  );
}
