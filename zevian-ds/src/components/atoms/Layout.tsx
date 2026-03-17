/**
 * Sidebar + Header — layout shell atoms.
 *
 * Usage:
 *   <AppShell sidebar={<Sidebar ... />}>
 *     <Header title="Goals" actions={<Button>New Goal</Button>} />
 *     <main>...</main>
 *   </AppShell>
 */

import React from 'react';
import { colors, layout, typography, radius, shadows, animation, zIndex, componentTokens } from '../../design/tokens';

// ─── AppShell ─────────────────────────────────
export const AppShell: React.FC<{ children: React.ReactNode; sidebar: React.ReactNode }> = ({
  children,
  sidebar,
}) => (
  <>
    {sidebar}
    <div style={{ marginLeft: layout.sidebarWidth, paddingTop: layout.headerHeight, minHeight: '100vh' }}>
      {children}
    </div>
  </>
);

// ─── Sidebar ──────────────────────────────────
export type NavItem = {
  id:       string;
  label:    string;
  icon:     React.ReactNode;
  badge?:   number;
  badgeVariant?: 'danger' | 'warn';
};

interface SidebarProps {
  activeId:   string;
  items:      NavItem[];
  onNavigate: (id: string) => void;
  ctaLabel?:  string;
  onCta?:     () => void;
  ctaIcon?:   React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeId,
  items,
  onNavigate,
  ctaLabel = 'New',
  onCta,
  ctaIcon,
}) => {
  const t = componentTokens.sidebar;

  return (
    <aside style={t.root}>
      {/* Logo */}
      <div style={t.logo}>
        <div style={t.logoMark}>Z</div>
        <span style={t.logoText}>Zevian</span>
      </div>

      {/* Nav */}
      <nav style={t.nav}>
        <div style={t.navLabel}>Workspace</div>
        {items.map(item => {
          const isActive = item.id === activeId;
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                ...t.navItem.base,
                ...(isActive ? t.navItem.active : {}),
              }}
              onMouseEnter={e => {
                if (!isActive) Object.assign((e.currentTarget as HTMLElement).style, t.navItem.hover);
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = '';
                  (e.currentTarget as HTMLElement).style.color = colors.text2;
                }
              }}
            >
              <span style={{ width: t.navItem.iconSize, height: t.navItem.iconSize, display: 'flex', flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
              {item.badge !== undefined && (
                <span style={{
                  ...t.badge,
                  background: item.badgeVariant === 'warn' ? colors.warn : colors.danger,
                }}>
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer CTA */}
      {onCta && (
        <div style={t.footer}>
          <button
            onClick={onCta}
            style={t.ctaButton}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = colors.accentHover)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = colors.accent)}
          >
            {ctaIcon && <span style={{ display: 'flex', width: '14px', height: '14px' }}>{ctaIcon}</span>}
            {ctaLabel}
          </button>
        </div>
      )}
    </aside>
  );
};

// ─── Header ───────────────────────────────────
interface HeaderProps {
  /** Plain string title OR breadcrumb array */
  title?:       string;
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  actions?:     React.ReactNode;
  search?:      boolean;
  onSearch?:    (q: string) => void;
  userInitials?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  breadcrumbs,
  actions,
  search,
  onSearch,
  userInitials = 'JD',
}) => {
  const t = componentTokens.header;

  return (
    <header style={t.root}>
      {breadcrumbs ? (
        <div style={t.breadcrumb}>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: colors.text3 }}>/</span>}
              {crumb.onClick ? (
                <span
                  style={t.breadcrumbLink}
                  onClick={crumb.onClick}
                  onMouseEnter={e => ((e.currentTarget as HTMLSpanElement).style.color = colors.accent)}
                  onMouseLeave={e => ((e.currentTarget as HTMLSpanElement).style.color = colors.text2)}
                >
                  {crumb.label}
                </span>
              ) : (
                <span style={t.breadcrumbCurrent}>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <span style={t.title}>{title}</span>
      )}

      <div style={{ flex: 1 }} />

      {search && (
        <div style={t.searchBar}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={colors.text3} strokeWidth="1.6">
            <circle cx="7" cy="7" r="4.5"/><path d="M11 11l2.5 2.5"/>
          </svg>
          <input
            type="text"
            placeholder="Search…"
            onChange={e => onSearch?.(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontFamily: typography.fonts.body,
              fontSize: '13px', color: colors.text, width: '100%',
            }}
          />
        </div>
      )}

      {actions}

      {/* Bell icon */}
      <div style={t.iconButton}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={colors.text2} strokeWidth="1.6">
          <path d="M8 2a5 5 0 0 1 5 5v2l1.5 2.5h-13L3 9V7a5 5 0 0 1 5-5z"/>
          <path d="M6 13.5a2 2 0 0 0 4 0"/>
        </svg>
      </div>

      {/* User avatar */}
      <div style={t.avatar}>{userInitials}</div>
    </header>
  );
};

export default Sidebar;
