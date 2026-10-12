import { useState } from 'react';
import {
  Boxes,
  Building2,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Command,
  LayoutDashboard,
  Languages,
  LogOut,
  Moon,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Tags,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NativeSelect } from './ui/native-select';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { initials } from '../lib/format';
import { canViewAuditTrail, canViewDashboard } from '../lib/access';
import { usePreferences } from '../preferences/PreferencesProvider';
import { Button } from './ui';

const navigation = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Purchase requests', path: '/requests', icon: ClipboardList },
  { label: 'Purchase orders', path: '/purchase-orders', icon: ShoppingCart },
  { label: 'Inventory', path: '/inventory', icon: Boxes },
  { label: 'Products', path: '/products', icon: PackageSearch },
  { label: 'Categories', path: '/categories', icon: Tags },
];

const management = [
  { label: 'Organization', path: '/organization', icon: Building2 },
  { label: 'Activity history', path: '/audit', icon: ShieldCheck },
];

const titles: Record<string, string> = {
  '/': 'Overview',
  '/requests': 'Purchase requests',
  '/purchase-orders': 'Purchase orders',
  '/inventory': 'Inventory',
  '/products': 'Products',
  '/categories': 'Categories',
  '/organization': 'Organization',
  '/audit': 'Activity history',
};

export function AppShell() {
  const { user, signOut } = useAuth();
  const {
    organizations,
    activeOrganization,
    activeOrganizationId,
    selectOrganization,
    membershipRole,
  } = useOrganization();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { language, setLanguage, theme, toggleTheme } = usePreferences();
  const currentTitle = t(titles[location.pathname] ?? 'Procurement workspace');
  const visibleManagement = management.filter(
    ({ path }) => path !== '/audit' || canViewAuditTrail(membershipRole),
  );

  const logout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      queryClient.clear();
      navigate('/login');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className={`application ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">
            <Command size={18} strokeWidth={2.4} />
          </div>
          {!collapsed && (
            <div className="brand-name">
              Supply<span>Desk</span>
              <small>{t('PROCUREMENT')}</small>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="workspace-chip">
            <div className="workspace-avatar">
              <Building2 size={16} />
            </div>
            <div className="workspace-copy">
              <strong>
                {activeOrganization?.name ?? t('No organization')}
              </strong>
              <span>{activeOrganization?.slug ?? t('Create a workspace')}</span>
            </div>
            <ChevronDown size={15} />
          </div>
        )}
        <nav className="side-navigation" aria-label={t('Main navigation')}>
          <span className="nav-section-label">{t('Workspace')}</span>
          {navigation
            .filter(
              ({ path }) => path !== '/' || canViewDashboard(membershipRole),
            )
            .map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                title={collapsed ? t(label) : undefined}
              >
                <Icon size={18} />
                <span>{t(label)}</span>
                {path === '/requests' && (
                  <span className="nav-link-shortcut">R</span>
                )}
              </NavLink>
            ))}
          {visibleManagement.length > 0 && (
            <span className="nav-section-label nav-management-label">
              {t('Manage')}
            </span>
          )}
          {visibleManagement.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
              title={collapsed ? t(label) : undefined}
            >
              <Icon size={18} />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="collapse-control"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={t('Collapse sidebar')}
          >
            <ChevronLeft size={16} className={collapsed ? 'rotate-180' : ''} />
            {!collapsed && <span>{t('Collapse sidebar')}</span>}
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-context">
            <span className="topbar-root">{t('Workspace')}</span>
            <span className="crumb-divider">/</span>
            <strong>{currentTitle}</strong>
          </div>
          <div className="topbar-actions">
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
            <label
              className="organization-select-wrap"
              aria-label={t('Select organization')}
            >
              <Building2 size={16} />
              <NativeSelect
                className="h-full border-0 bg-transparent py-0 pl-0 shadow-none focus-visible:ring-0"
                value={activeOrganizationId ?? ''}
                onChange={(event) => selectOrganization(event.target.value)}
                disabled={!organizations.length}
                aria-label={t('Active organization')}
              >
                {!organizations.length && (
                  <option value="">{t('No organization')}</option>
                )}
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <div className="topbar-divider" />
            <div className="profile-wrap">
              <button
                className="profile-trigger"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
              >
                <span className="avatar">{initials(user?.email ?? 'U')}</span>
                <span className="profile-info">
                  <strong>{user?.email.split('@')[0]}</strong>
                  <small>{t(membershipRole ?? user?.role ?? '')}</small>
                </span>
                <ChevronDown size={15} />
              </button>
              {menuOpen && (
                <div className="profile-menu">
                  <div className="profile-menu-user">
                    <strong>{user?.email}</strong>
                    <span>{t(membershipRole ?? user?.role ?? '')}</span>
                  </div>
                  <Button
                    variant="ghost"
                    loading={signingOut}
                    onClick={() => void logout()}
                  >
                    <LogOut size={16} /> {t('Sign out')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet key={activeOrganizationId ?? 'no-organization'} />
        </main>
        <footer className="app-footer">
          <span>{t('Procurement workspace')}</span>
        </footer>
      </div>
    </div>
  );
}
