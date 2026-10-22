import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CLASS_NAME } from '../data/demo';
import { useBottomTabs, useBreakpoint, type Breakpoint } from '../hooks/useBreakpoint';
import type { Theme, ThemePref } from '../hooks/useTheme';
import { LANGS, useI18n, type TKey } from '../i18n';
import { usePwa } from '../pwa';
import { usePortfolio } from '../store/PortfolioContext';
import { GlobalSearch } from './GlobalSearch';
import { Icon, type IconName } from './Icon';
import { Menu } from './Menu';
import { ModulePanel } from './ModulePanel';
import { DEMO_ROLES } from '../roles';
import { useRole } from '../roles/RoleContext';
import type { Capability } from '../roles';

export type Module = 'dashboard' | 'students' | 'observations' | 'reports' | 'settings';

export const ThemeContext = createContext<{ pref: ThemePref; theme: Theme; setPref: (p: ThemePref) => void }>({
  pref: 'light',
  theme: 'light',
  setPref: () => {}
});

/** Live desktop context-panel state, so Settings can bind to it. */
export const ShellPanelContext = createContext<{ panelOpen: boolean; setPanelOpen: (v: boolean) => void }>({
  panelOpen: true,
  setPanelOpen: () => {}
});
export const useShellPanel = () => useContext(ShellPanelContext);

type NavModule = Exclude<Module, 'settings'>;
const NAV: { key: NavModule; to: string; icon: IconName; capability: Capability }[] = [
  { key: 'dashboard', to: '/', icon: 'home', capability: 'dashboard.view' },
  { key: 'students', to: '/students', icon: 'users', capability: 'students.view' },
  { key: 'observations', to: '/students/aria/observe', icon: 'clipboard', capability: 'observation.add' },
  { key: 'reports', to: '/students?status=review', icon: 'fileText', capability: 'report.view' }
];

const visibleNav = (hasCapability: (capability: Capability) => boolean) => NAV.filter((item) => hasCapability(item.capability));

export const PANEL_KEY = 'aps-panel-open';

export function readPanelOpen() {
  try {
    return localStorage.getItem(PANEL_KEY) !== 'false';
  } catch {
    return true;
  }
}

function writePanelOpen(v: boolean) {
  try {
    localStorage.setItem(PANEL_KEY, String(v));
  } catch {
    /* ignore */
  }
}

const THEME_OPTIONS: { key: ThemePref; icon: IconName }[] = [
  { key: 'light', icon: 'sun' },
  { key: 'dark', icon: 'moon' },
  { key: 'system', icon: 'monitor' }
];

function ThemeMenu() {
  const { pref, theme, setPref } = useContext(ThemeContext);
  const { t } = useI18n();
  const name = t(`shell.theme.${pref === 'system' ? 'system' : theme}`);
  return (
    <Menu
      label={t('shell.theme.label')}
      style={{ top: 'calc(100% + 8px)', right: 0 }}
      trigger={({ onClick, expanded, ref }) => (
        <button ref={ref} className="icon-btn has-tip tip-below" type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={expanded} aria-label={t('shell.theme.current', { name })} data-tip={t('shell.theme.label')}>
          <Icon name={pref === 'system' ? 'monitor' : theme === 'dark' ? 'moon' : 'sun'} />
        </button>
      )}
    >
      {(close) =>
        THEME_OPTIONS.map((o) => (
          <button key={o.key} className="menu-item" type="button" role="menuitemradio" aria-checked={pref === o.key} onClick={() => { setPref(o.key); close(); }}>
            <Icon name={o.icon} size={18} />
            <span className="grow">{t(`shell.theme.${o.key}`)}</span>
            {pref === o.key && <Icon name="check" size={18} className="ic-primary" />}
          </button>
        ))
      }
    </Menu>
  );
}

/** English / 中文 / Bahasa Melayu as menuitemradio items; each name is shown in its own language. */
function LanguageItems({ close }: { close: () => void }) {
  const { lang, setLang } = useI18n();
  return (
    <>
      {LANGS.map((l) => (
        <button key={l.key} className="menu-item" type="button" role="menuitemradio" aria-checked={lang === l.key} onClick={() => { setLang(l.key); close(); }}>
          <span className="grow" lang={l.htmlLang}>{l.label}</span>
          {lang === l.key && <Icon name="check" size={18} className="ic-primary" />}
        </button>
      ))}
    </>
  );
}

function LanguageMenu() {
  const { lang, t } = useI18n();
  const meta = LANGS.find((l) => l.key === lang)!;
  return (
    <Menu
      label={t('shell.language.label')}
      style={{ top: 'calc(100% + 8px)', right: 0 }}
      trigger={({ onClick, expanded, ref }) => (
        <button ref={ref} className="btn btn-ghost lang-btn" type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={expanded} aria-label={`${meta.short}, ${t('shell.language.current', { name: meta.label })}`}>
          <Icon name="languages" />
          <span lang={meta.htmlLang}>{meta.short}</span>
        </button>
      )}
    >
      {(close) => <LanguageItems close={close} />}
    </Menu>
  );
}

function SettingsLink({ close, labelKey }: { close: () => void; labelKey: TKey }) {
  const { t } = useI18n();
  return (
    <Link className="menu-item" role="menuitem" to="/settings" onClick={close}>
      <Icon name="settings" size={18} />
      <span className="grow">{t(labelKey)}</span>
    </Link>
  );
}

function AccountMenu() {
  const { t } = useI18n();
  const { role, setRole, can: hasCapability } = useRole();
  const account = DEMO_ROLES.find((item) => item.role === role)!;
  const initials = account.initials;
  return (
    <Menu
      label={t('shell.account.label')}
      style={{ top: 'calc(100% + 8px)', right: 0, minWidth: 280 }}
      trigger={({ onClick, expanded, ref }) => (
        <button ref={ref} className="avatar" type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={expanded} aria-label={`${initials}, ${t('shell.account.trigger', { name: account.name })}`}>{initials}</button>
      )}
    >
      {(close) => (
        <>
          <div className="menu-head">
            <p className="strong">{account.name}</p>
            <p className="sec muted">{t(account.labelKey)} · {CLASS_NAME}</p>
          </div>
          <RoleItems role={role} setRole={setRole} close={close} />
          <div className="notice notice-warning" style={{ margin: 4 }}>
            <Icon name="info" size={16} />
            <p className="body-text">{t('shell.account.demoNote')}</p>
          </div>
          {hasCapability('settings.view') && <SettingsLink close={close} labelKey="shell.account.settings" />}
          <button className="menu-item" type="button" role="menuitem" aria-disabled="true">
            <Icon name="lock" size={18} />{t('shell.account.signOut')}
          </button>
        </>
      )}
    </Menu>
  );
}

function RoleItems({ role, setRole, close }: { role: string; setRole: (role: 'teacher' | 'reviewer' | 'admin' | 'parent') => void; close: () => void }) {
  const { t } = useI18n();
  return (
    <>
      <p className="cap muted menu-head">{t('shell.roles.heading')}</p>
      {DEMO_ROLES.map((item) => (
        <button key={item.role} className="menu-item" type="button" role="menuitemradio" aria-checked={role === item.role} onClick={() => { setRole(item.role); close(); }}>
          <span className="grow">{t(item.labelKey)}</span>
          {role === item.role && <Icon name="check" size={18} className="ic-primary" />}
        </button>
      ))}
    </>
  );
}

/** Demo-only controls so failure states can be reached without a backend. */
function DemoMenuItems({ close }: { close: () => void }) {
  const { state, dispatch } = usePortfolio();
  const { t } = useI18n();
  return (
    <>
      <p className="cap muted menu-head">{t('shell.demo.heading')}</p>
      <button className="menu-item" type="button" role="menuitemcheckbox" aria-checked={state.sim.aiDown} onClick={() => dispatch({ type: 'setSim', key: 'aiDown', value: !state.sim.aiDown })}>
        <Icon name="cloudOff" size={18} /><span className="grow">{t('shell.demo.aiDown')}</span>{state.sim.aiDown && <Icon name="check" size={18} className="ic-primary" />}
      </button>
      <button className="menu-item" type="button" role="menuitemcheckbox" aria-checked={state.sim.saveFail} onClick={() => dispatch({ type: 'setSim', key: 'saveFail', value: !state.sim.saveFail })}>
        <Icon name="alertCircle" size={18} /><span className="grow">{t('shell.demo.saveFail')}</span>{state.sim.saveFail && <Icon name="check" size={18} className="ic-primary" />}
      </button>
      <button className="menu-item" type="button" role="menuitem" onClick={() => { dispatch({ type: 'reset' }); close(); }}>
        <Icon name="undo" size={18} />{t('shell.demo.reset')}
      </button>
    </>
  );
}

function DemoStrip({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const { role } = useRole();
  const selected = DEMO_ROLES.find((item) => item.role === role)!;
  return (
    <div className="demo-strip" role="note">
      <Icon name="alert" size={16} />
      <span>{compact ? t('shell.demoStripCompact') : t('shell.demoStrip')}</span>
      <span className="role-chip" role="status" aria-live="polite">{t('shell.roles.viewingAs', { role: t(selected.labelKey) })}</span>
    </div>
  );
}

/**
 * "Update to vX" button ("Update now" when the new version is unknown). Never reloads over
 * unsaved work: with dirty work it shows a small notice instead and the waiting release stays queued.
 * Also shown after a failed install while the new release is still there to install.
 */
function UpdateButton({ inBanner }: { inBanner?: boolean }) {
  const pwa = usePwa();
  const { t } = useI18n();
  const [notice, setNotice] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!notice) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setNotice(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotice(false);
        btn.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [notice]);

  if (!pwa.updateOffered) return null;
  const onClick = () => {
    if (pwa.hasDirtyWork) setNotice((n) => !n);
    else pwa.applyUpdate();
  };
  return (
    <div ref={wrap} className="menu-wrap">
      <button ref={btn} className={`btn ${inBanner ? 'btn-secondary' : 'btn-primary'} btn-compact`} type="button" onClick={onClick} aria-expanded={pwa.hasDirtyWork ? notice : undefined}>
        <Icon name="download" size={18} />
        {pwa.availableVersion ? t('shell.update.button', { version: pwa.availableVersion }) : t('shell.update.buttonGeneric')}
      </button>
      <span className="sr-only" role="status">{notice ? t('shell.update.waitNotice') : ''}</span>
      {notice && (
        <div className={`update-pop${inBanner ? ' is-above' : ''}`}>
          <Icon name="info" size={18} />
          <p className="grow sec">{t('shell.update.waitNotice')}</p>
          <button className="icon-btn" type="button" aria-label={t('shell.update.dismiss')} onClick={() => { setNotice(false); btn.current?.focus(); }}>
            <Icon name="x" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

/** Full-screen loader while the waiting release activates and the page reloads once. */
function UpdateOverlay() {
  const pwa = usePwa();
  const { t } = useI18n();
  if (pwa.status !== 'applying') return null;
  return (
    <div className="update-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="update-overlay-card">
        <Icon name="loader" size={24} className="spin ic-primary" />
        <p className="h2">{t('shell.update.applyingTitle')}</p>
        <p className="sec muted">{pwa.availableVersion ? t('shell.update.applyingBody', { version: pwa.availableVersion }) : t('shell.update.applyingBodyGeneric')}</p>
      </div>
    </div>
  );
}

// Dismissal survives page changes (each page mounts its own AppShell) until the next failure.
let dismissedErrorKey: string | undefined;
const errorKey = (kind: string | undefined, seq: number | undefined, error: string | undefined) => `${kind ?? 'check'}|${seq ?? 0}|${error ?? ''}`;

/**
 * A failed check (Retry re-checks, and re-registers the worker if that failed) or a failed install
 * (own message; Retry re-offers the update while it is still waiting).
 */
function UpdateError() {
  const pwa = usePwa();
  const { t } = useI18n();
  const [, force] = useState(0);
  const key = errorKey(pwa.errorKind, pwa.errorSeq, pwa.error);
  if (pwa.status !== 'error' || dismissedErrorKey === key) return null;
  return (
    <div className="notice notice-danger update-error" role="alert">
      <Icon name="alertCircle" size={18} />
      <p className="grow body-text">{t(pwa.errorKind === 'apply' ? 'shell.update.applyErrorText' : 'shell.update.errorText')}</p>
      <div className="row">
        <button className="btn btn-secondary" type="button" onClick={() => void pwa.checkNow()}>
          <Icon name="refresh" size={18} />
          {t('shell.update.retry')}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => { dismissedErrorKey = key; force((n) => n + 1); }}>
          {t('shell.update.keep', { version: pwa.currentVersion })}
        </button>
      </div>
    </div>
  );
}

function TabBar({ active }: { active: Module }) {
  const { t } = useI18n();
  const roleContext = useRole();
  return (
    <nav className="tabbar" aria-label={t('shell.nav.main')}>
      {visibleNav(roleContext.can).map((n) => (
        <Link key={n.key} className="tabbar-item" to={n.to} aria-current={active === n.key ? 'page' : undefined}>
          <span className="tab-pill"><Icon name={n.icon} /></span>
          <span className="tab-label">{t(`shell.nav.${n.key}`)}</span>
        </Link>
      ))}
      <Menu
        label={t('shell.nav.more')}
        sheet
        trigger={({ onClick, expanded, ref }) => (
          <button ref={ref} className="tabbar-item" type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={expanded} data-active={active === 'settings' ? 'true' : undefined}>
            <span className="tab-pill"><Icon name="more" /></span>
            <span className="tab-label">{t('shell.nav.more')}</span>
          </button>
        )}
      >
        {(close) => (
          <>
            {roleContext.can('settings.view') && <SettingsLink close={close} labelKey="shell.more.settings" />}
            {roleContext.can('catalog.view') && <Link className="menu-item" role="menuitem" to="/catalog" onClick={close}><Icon name="layers" size={18} />{t('shell.panel.designReference')}</Link>}
            <RoleItems role={roleContext.role} setRole={roleContext.setRole} close={close} />
            <p className="cap muted menu-head">{t('shell.more.language')}</p>
            <LanguageItems close={close} />
            {roleContext.can('demo.controls') && <DemoMenuItems close={close} />}
          </>
        )}
      </Menu>
    </nav>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

/** Top-bar breadcrumb; the last item is the current page. Defaults to the module name. */
function Crumbs({ items }: { items: Crumb[] }) {
  const { t } = useI18n();
  return (
    <nav className="topbar-context crumbs" aria-label={t('shell.breadcrumb')}>
      <ol>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${c.label}`}>
              {i > 0 && <Icon name="chevronRight" size={16} className="crumb-sep" />}
              {c.to && !last ? <Link className="crumb-link" to={c.to}>{c.label}</Link> : <span className="crumb-current" aria-current={last && items.length > 1 ? 'page' : undefined}>{c.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface AppShellProps {
  module: Module;
  /** Breadcrumb trail for the top bar (desktop and tablet); defaults to the module name. */
  crumbs?: Crumb[];
  /** Focus mode (Studio): the desktop context panel starts closed here; opening it is not persisted. */
  focus?: boolean;
  currentStudentId?: string;
  mobileTitle: string;
  mobileSubtitle?: string;
  mobileBack?: string;
  mobileTrailing?: ReactNode;
  mobileActions?: ReactNode;
  children: (bp: Breakpoint) => ReactNode;
}

export function AppShell({ module, crumbs, focus, currentStudentId, mobileTitle, mobileSubtitle, mobileBack, mobileTrailing, mobileActions, children }: AppShellProps) {
  const bp = useBreakpoint();
  // Tablets up to 1024px keep the tablet page layouts but navigate with the bottom tab bar (no rail, no panel).
  const tabNav = useBottomTabs();
  const { t } = useI18n();
  const roleContext = useRole();
  const pwa = usePwa();
  // Read synchronously so the panel state is right on first paint (no flash).
  const [desktopOpen, setDesktopOpen] = useState(readPanelOpen);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const setPanelOpen = useCallback((v: boolean) => {
    writePanelOpen(v);
    setDesktopOpen(v);
  }, []);

  const toggle = useCallback(() => {
    if (bp === 'desktop' && focus) setFocusOpen((o) => !o);
    else if (bp === 'desktop') {
      setDesktopOpen((o) => {
        writePanelOpen(!o);
        return !o;
      });
    } else setOverlayOpen((o) => !o);
  }, [bp, focus]);

  // Layout effect: the shortcut must work as soon as the page is visible after a route change.
  useLayoutEffect(() => {
    if (tabNav) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && bp === 'tablet') setOverlayOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bp, tabNav, toggle]);

  const moduleLabel = t(`shell.module.${module}`);
  const trail = crumbs ?? [{ label: moduleLabel }];
  const content = <ShellPanelContext.Provider value={{ panelOpen: desktopOpen, setPanelOpen }}>{children(bp)}</ShellPanelContext.Provider>;

  if (bp === 'mobile') {
    const showBanner = pwa.updateOffered;
    return (
      <div className={`app is-mobile${showBanner ? ' has-update' : ''}`}>
        <header className="m-header">
          {mobileBack ? (
            <Link className="icon-btn" to={mobileBack} aria-label={t('shell.back')} title={t('shell.back')}><Icon name="arrowLeft" /></Link>
          ) : (
            <span className="monogram" aria-hidden="true">AP</span>
          )}
          <div className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="strong">{mobileTitle}</h1>
            {mobileSubtitle && <p className="cap muted">{mobileSubtitle}</p>}
          </div>
          {mobileTrailing}
          <ThemeMenu />
        </header>
        <DemoStrip compact />
        <UpdateError />
        <main className="main" id="main">{content}</main>
        {showBanner && (
          <div className={`update-banner${mobileActions ? ' above-actions' : ''}`}>
            <Icon name="download" size={18} className="ic-primary" />
            <span className="grow sec semibold">{t('shell.update.bannerText')}</span>
            {/* Secondary here: the action bar below keeps the screen's one primary action. */}
            <UpdateButton inBanner />
          </div>
        )}
        {mobileActions && <div className="action-bar">{mobileActions}</div>}
        <TabBar active={module} />
        <UpdateOverlay />
      </div>
    );
  }

  if (tabNav) {
    return (
      <div className={`app is-${bp} has-tabbar`}>
        <a className="skip-link" href="#main">{t('shell.skipToContent')}</a>
        <header className="topbar">
          <Link className="brand" to="/"><span className="monogram">AP</span><span>{t('shell.appName')}</span></Link>
          <Crumbs items={trail} />
          <div className="grow" />
          <GlobalSearch />
          <UpdateButton />
          <LanguageMenu />
          <ThemeMenu />
          <AccountMenu />
        </header>
        <main className="main" id="main" tabIndex={-1}>
          <DemoStrip />
          <UpdateError />
          {content}
        </main>
        <TabBar active={module} />
        <UpdateOverlay />
      </div>
    );
  }

  const panelVisible = bp === 'desktop' ? (focus ? focusOpen : desktopOpen) : overlayOpen;

  return (
    <div className={`app is-${bp}`}>
      <a className="skip-link" href="#main">{t('shell.skipToContent')}</a>
      <header className="topbar">
        <Link className="brand" to="/"><span className="monogram">AP</span><span>{t('shell.appName')}</span></Link>
        {/* A one-level page already names itself in the open panel's header. */}
        {!(trail.length === 1 && panelVisible) && <Crumbs items={trail} />}
        <div className="grow" />
        <GlobalSearch />
        <div className="grow" />
        <UpdateButton />
        <LanguageMenu />
        <ThemeMenu />
        <AccountMenu />
      </header>
      <div className="shell-body">
        <nav className="rail" aria-label={t('shell.nav.main')}>
          {!panelVisible && (
            <button className="rail-item has-tip" type="button" onClick={toggle} aria-label={t('shell.panel.open')} data-tip={t('shell.panel.openTip')} aria-keyshortcuts="Control+Shift+S Meta+Shift+S">
              <Icon name="panel" />
            </button>
          )}
          {visibleNav(roleContext.can).map((n) => (
            <Link key={n.key} className="rail-item has-tip" to={n.to} aria-label={t(`shell.nav.${n.key}`)} data-tip={t(`shell.nav.${n.key}`)} aria-current={module === n.key ? 'page' : undefined}>
              <Icon name={n.icon} />
            </Link>
          ))}
          <Menu
            label={t('shell.nav.more')}
            style={{ top: 0, left: 'calc(100% + 8px)' }}
            trigger={({ onClick, expanded, ref }) => (
              <button ref={ref} className="rail-item has-tip" type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={expanded} aria-label={t('shell.nav.more')} data-tip={t('shell.nav.more')} data-active={module === 'settings' ? 'true' : undefined}>
                <Icon name="more" />
              </button>
            )}
          >
            {(close) => (
              <>
                {roleContext.can('settings.view') && <SettingsLink close={close} labelKey="shell.more.settings" />}
                {roleContext.can('catalog.view') && <Link className="menu-item" role="menuitem" to="/catalog" onClick={close}><Icon name="layers" size={18} />{t('shell.panel.designReference')}</Link>}
                <RoleItems role={roleContext.role} setRole={roleContext.setRole} close={close} />
                {roleContext.can('demo.controls') && <DemoMenuItems close={close} />}
              </>
            )}
          </Menu>
        </nav>
        {panelVisible && bp === 'tablet' && <div className="scrim" aria-hidden="true" onMouseDown={() => setOverlayOpen(false)} />}
        {panelVisible && (
          <aside className={`ctx${bp === 'tablet' ? ' is-overlay' : ''}`} aria-label={t('shell.panel.label', { module: moduleLabel })}>
            <ModulePanel module={module} currentStudentId={currentStudentId} onToggle={toggle} searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
          </aside>
        )}
        <main className="main" id="main" tabIndex={-1}>
          <DemoStrip />
          <UpdateError />
          {content}
        </main>
      </div>
      <UpdateOverlay />
    </div>
  );
}
