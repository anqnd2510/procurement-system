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
      navigate(searchParams.get('next') || '/', { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Link className="auth-brand" to="/login">
          <span className="brand-mark">
            <Command size={18} />
          </span>{' '}
          Supply<span>Desk</span>
        </Link>
        <div className="auth-story-copy">
          <div className="eyebrow eyebrow-light">
            {t('PROCUREMENT WORKSPACE')}
          </div>
          <h1>{t('Bring every purchase decision into focus.')}</h1>
          <p>
            {t(
              'A clear operating view across requests, inventory, and the teams behind every order.',
            )}
          </p>
          <div className="auth-feature-list">
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
        <div className="auth-story-foot">
          <span>{t('Built for the work behind the purchase.')}</span>
          <span>{t('SECURE WORKSPACE')}</span>
        </div>
      </section>
      <section className="auth-form-side">
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
        <div className="auth-form-card">
          <div className="auth-form-icon">
            <Boxes size={19} />
          </div>
          <span className="eyebrow">{t('WELCOME TO SUPPLYDESK')}</span>
          <h2>
            {t(
              isRegister ? 'Create your account' : 'Sign in to your workspace',
            )}
          </h2>
          <p className="auth-subtitle">
            {t(
              isRegister
                ? 'Start with an employee account. You can create or join an organization after signing in.'
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
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
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
