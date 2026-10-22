import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TEACHER } from '../data/demo';
import { useBreakpoint, type Breakpoint } from '../hooks/useBreakpoint';
import type { Theme, ThemePref } from '../hooks/useTheme';
import { usePortfolio } from '../store/PortfolioContext';
import { Icon, type IconName } from './Icon';
import { Menu } from './Menu';
import { MODULE_LABEL, ModulePanel } from './ModulePanel';

export type Module = 'dashboard' | 'students' | 'observations' | 'reports';

export const ThemeContext = createContext<{ pref: ThemePref; theme: Theme; setPref: (p: ThemePref) => void }>({
  pref: 'light',
  theme: 'light',
  setPref: () => {}
});

const NAV: { key: Module; label: string; to: string; icon: IconName }[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/', icon: 'home' },
  { key: 'students', label: 'Students', to: '/students', icon: 'users' },
  { key: 'observations', label: 'Observations', to: '/students/aria/observe', icon: 'clipboard' },
  { key: 'reports', label: 'Reports', to: '/students?status=review', icon: 'fileText' }
];

const PANEL_KEY = 'aps-panel-open';

function readPanelOpen() {
  try {
    return localStorage.getItem(PANEL_KEY) !== 'false';
  } catch {
    return true;
  }
}

function ThemeMenu() {
  const { pref, theme, setPref } = useContext(ThemeContext);
  const options: { key: ThemePref; label: string; icon: IconName }[] = [
    { key: 'light', label: 'Light', icon: 'sun' },
    { key: 'dark', label: 'Dark', icon: 'moon' },
    { key: 'system', label: 'System', icon: 'monitor' }
  ];
  return (
    <Menu
      label="Theme"
      style={{ top: 'calc(100% + 8px)', right: 0 }}
      trigger={({ onClick, expanded, ref }) => (
        <button ref={ref} className="icon-btn has-tip tip-below" type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={expanded} aria-label={`Theme: ${pref === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}`} data-tip="Theme">
          <Icon name={pref === 'system' ? 'monitor' : theme === 'dark' ? 'moon' : 'sun'} />
        </button>
      )}
    >
      {(close) =>
        options.map((o) => (
          <button key={o.key} className="menu-item" type="button" role="menuitemradio" aria-checked={pref === o.key} onClick={() => { setPref(o.key); close(); }}>
            <Icon name={o.icon} size={18} />
            <span className="grow">{o.label}</span>
            {pref === o.key && <Icon name="check" size={18} className="ic-primary" />}
          </button>
        ))
      }
    </Menu>
  );
}

function AccountMenu() {
  return (
    <Menu
      label="Account"
      style={{ top: 'calc(100% + 8px)', right: 0, minWidth: 280 }}
      trigger={({ onClick, expanded, ref }) => (
        <button ref={ref} className="avatar" type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={expanded} aria-label={`Account menu, ${TEACHER} (demo teacher)`}>ML</button>
      )}
    >
      {() => (
        <>
          <div className="menu-head">
            <p className="strong">{TEACHER}</p>
            <p className="sec muted">Teacher · K2 Sunflower</p>
          </div>
          <div className="notice notice-warning" style={{ margin: 4 }}>
            <Icon name="info" size={16} />
            <p className="body-text">Demo mode: no sign-in, fictional data, AI is a Mock provider.</p>
          </div>
          <button className="menu-item" type="button" role="menuitem" aria-disabled="true">
            <Icon name="lock" size={18} />Sign out (not available in demo)
          </button>
        </>
      )}
    </Menu>
  );
}

/** Demo-only controls so failure states can be reached without a backend. */
function DemoMenuItems({ close }: { close: () => void }) {
  const { state, dispatch } = usePortfolio();
  return (
    <>
      <p className="cap muted menu-head">Demo controls</p>
      <button className="menu-item" type="button" role="menuitemcheckbox" aria-checked={state.sim.aiDown} onClick={() => dispatch({ type: 'setSim', key: 'aiDown', value: !state.sim.aiDown })}>
        <Icon name="cloudOff" size={18} /><span className="grow">Simulate AI unavailable</span>{state.sim.aiDown && <Icon name="check" size={18} className="ic-primary" />}
      </button>
      <button className="menu-item" type="button" role="menuitemcheckbox" aria-checked={state.sim.saveFail} onClick={() => dispatch({ type: 'setSim', key: 'saveFail', value: !state.sim.saveFail })}>
        <Icon name="alertCircle" size={18} /><span className="grow">Simulate save failure</span>{state.sim.saveFail && <Icon name="check" size={18} className="ic-primary" />}
      </button>
      <button className="menu-item" type="button" role="menuitem" onClick={() => { dispatch({ type: 'reset' }); close(); }}>
        <Icon name="undo" size={18} />Reset demo data
      </button>
    </>
  );
}

function DemoStrip({ compact }: { compact?: boolean }) {
  return (
    <div className="demo-strip" role="note">
      <Icon name="alert" size={16} />
      <span>{compact ? 'Demo mode · fictional sample data' : 'Demo mode — all students and observations are fictional sample data'}</span>
    </div>
  );
}

function TabBar({ active }: { active: Module }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {NAV.map((n) => (
        <Link key={n.key} className="tabbar-item" to={n.to} aria-current={active === n.key ? 'page' : undefined}>
          <span className="tab-pill"><Icon name={n.icon} /></span>
          <span className="tab-label">{n.label}</span>
        </Link>
      ))}
      <Menu
        label="More"
        sheet
        trigger={({ onClick, expanded, ref }) => (
          <button ref={ref} className="tabbar-item" type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={expanded}>
            <span className="tab-pill"><Icon name="more" /></span>
            <span className="tab-label">More</span>
          </button>
        )}
      >
        {(close) => <DemoMenuItems close={close} />}
      </Menu>
    </nav>
  );
}

export interface AppShellProps {
  module: Module;
  currentStudentId?: string;
  mobileTitle: string;
  mobileSubtitle?: string;
  mobileBack?: string;
  mobileTrailing?: ReactNode;
  mobileActions?: ReactNode;
  children: (bp: Breakpoint) => ReactNode;
}

export function AppShell({ module, currentStudentId, mobileTitle, mobileSubtitle, mobileBack, mobileTrailing, mobileActions, children }: AppShellProps) {
  const bp = useBreakpoint();
  // Read synchronously so the panel state is right on first paint (no flash).
  const [desktopOpen, setDesktopOpen] = useState(readPanelOpen);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggle = useCallback(() => {
    if (bp === 'desktop') {
      setDesktopOpen((o) => {
        try {
          localStorage.setItem(PANEL_KEY, String(!o));
        } catch {
          /* ignore */
        }
        return !o;
      });
    } else setOverlayOpen((o) => !o);
  }, [bp]);

  useEffect(() => {
    if (bp === 'mobile') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && bp === 'tablet') setOverlayOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bp, toggle]);

  if (bp === 'mobile') {
    return (
      <div className="app is-mobile">
        <header className="m-header">
          {mobileBack ? (
            <Link className="icon-btn" to={mobileBack} aria-label="Back" title="Back"><Icon name="arrowLeft" /></Link>
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
        <main className="main" id="main">{children(bp)}</main>
        {mobileActions && <div className="action-bar">{mobileActions}</div>}
        <TabBar active={module} />
      </div>
    );
  }

  const panelVisible = bp === 'desktop' ? desktopOpen : overlayOpen;

  return (
    <div className={`app is-${bp}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <Link className="brand" to="/"><span className="monogram">AP</span><span>AI Preschool Studio</span></Link>
        <span className="topbar-context">{MODULE_LABEL[module]}</span>
        <div className="grow" />
        <ThemeMenu />
        <AccountMenu />
      </header>
      <div className="shell-body">
        <nav className="rail" aria-label="Main">
          {!panelVisible && (
            <button className="rail-item has-tip" type="button" onClick={toggle} aria-label="Open sidebar" data-tip="Open sidebar · Ctrl+Shift+S" aria-keyshortcuts="Control+Shift+S Meta+Shift+S">
              <Icon name="panel" />
            </button>
          )}
          {NAV.map((n) => (
            <Link key={n.key} className="rail-item has-tip" to={n.to} aria-label={n.label} data-tip={n.label} aria-current={module === n.key ? 'page' : undefined}>
              <Icon name={n.icon} />
            </Link>
          ))}
          <Menu
            label="More"
            style={{ top: 0, left: 'calc(100% + 8px)' }}
            trigger={({ onClick, expanded, ref }) => (
              <button ref={ref} className="rail-item has-tip" type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={expanded} aria-label="More" data-tip="More">
                <Icon name="more" />
              </button>
            )}
          >
            {(close) => <DemoMenuItems close={close} />}
          </Menu>
        </nav>
        {panelVisible && bp === 'tablet' && <div className="scrim" aria-hidden="true" onMouseDown={() => setOverlayOpen(false)} />}
        {panelVisible && (
          <aside className={`ctx${bp === 'tablet' ? ' is-overlay' : ''}`} aria-label={`${MODULE_LABEL[module]} sidebar`}>
            <ModulePanel module={module} currentStudentId={currentStudentId} onToggle={toggle} searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
          </aside>
        )}
        <main className="main" id="main" tabIndex={-1}>
          <DemoStrip />
          {children(bp)}
        </main>
      </div>
    </div>
  );
}
