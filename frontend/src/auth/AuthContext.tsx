import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';
import { clearSession, readAccessToken, saveSession } from '../lib/session';
import type { AuthResult, User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      if (!readAccessToken()) {
        if (active) setIsLoading(false);
        return;
      }
      try {
        const currentUser = await api.get<User>('/auth/me', {
          organization: false,
        });
        if (active) setUser(currentUser);
      } catch {
        clearSession();
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void initialize();
    const onExpired = () => {
      clearSession();
      setUser(null);
    };
    window.addEventListener('procurement:session-expired', onExpired);
    return () => {
      active = false;
      window.removeEventListener('procurement:session-expired', onExpired);
    };
  }, []);

  const authenticate = useCallback(
    async (
      path: '/auth/login' | '/auth/register',
      email: string,
      password: string,
    ) => {
      const result = await api.post<AuthResult>(
        path,
        { email, password },
        { organization: false, retryAuth: false },
      );
      saveSession(result);
      setUser(result.user);
    },
    [],
  );

  const signIn = useCallback(
    (email: string, password: string) =>
      authenticate('/auth/login', email, password),
    [authenticate],
  );
  const signUp = useCallback(
    (email: string, password: string) =>
      authenticate('/auth/register', email, password),
    [authenticate],
  );
  const signOut = useCallback(async () => {
    const refreshToken = sessionStorage.getItem('procurement.refresh-token');
    try {
      if (refreshToken) {
        await api.post(
          '/auth/logout',
          { refreshToken },
          { organization: false },
        );
      }
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut }),
    [user, isLoading, signIn, signUp, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
