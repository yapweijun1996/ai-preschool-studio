import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useBreakpoint, type Breakpoint } from '../hooks/useBreakpoint';
import type { Theme } from '../hooks/useTheme';
import { usePortfolio } from '../store/PortfolioContext';
import { Icon, type IconName } from './Icon';

export type Module = 'dashboard' | 'students' | 'observations' | 'reports';

export const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} });

const NAV: { key: Module; label: string; to: string; icon: IconName }[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/', icon: 'home' },
  { key: 'students', label: 'Students', to: '/students', icon: 'users' },
  { key: 'observations', label: 'Observations', to: '/students/aria/observe', icon: 'clipboard' },
  { key: 'reports', label: 'Reports', to: '/students/aria/report', icon: 'fileText' }
];

const PANEL_KEY = 'aps-panel-open';

function ThemeButton() {
  const { theme, toggle } = useContext(ThemeContext);
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <button className="icon-btn" type="button" onClick={toggle} aria-label={label} title={label}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

/** Demo-only controls so empty/failure states can be reached without a backend. */
function MoreMenu({ trigger, above }: { trigger: (props: { onClick: () => void; expanded: boolean }) => ReactNode; above?: boolean }) {
  const { state, dispatch } = usePortfolio();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flex: above ? '1 1 0' : undefined, minWidth: 0 }}>
      {trigger({ onClick: () => setOpen((o) => !o), expanded: open })}
      {open && (
        <div className="menu-pop" role="group" aria-label="Demo controls" style={above ? { bottom: 'calc(100% + 8px)', right: 0 } : { bottom: 0, left: 'calc(100% + 8px)' }}>
          <p className="cap muted" style={{ padding: '4px 12px' }}>Demo controls</p>
          <button className="menu-item" type="button" aria-pressed={state.sim.aiDown} onClick={() => dispatch({ type: 'setSim', key: 'aiDown', value: !state.sim.aiDown })}>
            <Icon name={state.sim.aiDown ? 'check' : 'cloudOff'} size={18} />
            Simulate AI unavailable
          </button>
          <button className="menu-item" type="button" aria-pressed={state.sim.saveFail} onClick={() => dispatch({ type: 'setSim', key: 'saveFail', value: !state.sim.saveFail })}>
            <Icon name={state.sim.saveFail ? 'check' : 'alertCircle'} size={18} />
            Simulate save failure
          </button>
          <button className="menu-item" type="button" onClick={() => { dispatch({ type: 'reset' }); setOpen(false); }}>
            <Icon name="undo" size={18} />
            Reset demo data
          </button>
        </div>
      )}
    </div>
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
      <MoreMenu
        above
        trigger={({ onClick, expanded }) => (
          <button className="tabbar-item" type="button" onClick={onClick} aria-expanded={expanded}>
            <span className="tab-pill"><Icon name="more" /></span>
            <span className="tab-label">More</span>
          </button>
        )}
      />
    </nav>
  );
}

export interface AppShellProps {
  module: Module;
  panel?: ReactNode;
  panelTitle?: string;
  mobileTitle: string;
  mobileSubtitle?: string;
  mobileBack?: string;
  mobileTrailing?: ReactNode;
  mobileActions?: ReactNode;
  children: (bp: Breakpoint) => ReactNode;
}

export function AppShell({ module, panel, panelTitle, mobileTitle, mobileSubtitle, mobileBack, mobileTrailing, mobileActions, children }: AppShellProps) {
  const bp = useBreakpoint();
  const [desktopOpen, setDesktopOpen] = useState(() => {
    try {
      return localStorage.getItem(PANEL_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const [overlayOpen, setOverlayOpen] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(PANEL_KEY, String(desktopOpen));
    } catch {
      /* ignore */
    }
  }, [desktopOpen]);

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
          <ThemeButton />
        </header>
        <DemoStrip compact />
        <main className="main" id="main">{children(bp)}</main>
        {mobileActions && <div className="action-bar">{mobileActions}</div>}
        <TabBar active={module} />
      </div>
    );
  }

  const panelVisible = panel && (bp === 'desktop' ? desktopOpen : overlayOpen);
  const togglePanel = () => (bp === 'desktop' ? setDesktopOpen((o) => !o) : setOverlayOpen((o) => !o));

  return (
    <div className={`app is-${bp}`}>
      <header className="topbar">
        {panel && !panelVisible && (
          <button className="icon-btn" type="button" onClick={togglePanel} aria-label="Show context panel" title="Show context panel">
            <Icon name="panel" />
          </button>
        )}
        <Link className="brand" to="/"><span className="monogram">AP</span><span>AI Preschool Studio</span></Link>
        <div className="grow" />
        <ThemeButton />
        <button className="avatar" type="button" aria-label="Account menu, Ms. Lim (demo teacher)">ML</button>
      </header>
      <DemoStrip />
      <div className="shell-body">
        <nav className="rail" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.key} className="rail-item" to={n.to} aria-label={n.label} title={n.label} aria-current={module === n.key ? 'page' : undefined}>
              <Icon name={n.icon} />
            </Link>
          ))}
          <MoreMenu
            trigger={({ onClick, expanded }) => (
              <button className="rail-item" type="button" onClick={onClick} aria-expanded={expanded} aria-label="More" title="More">
                <Icon name="more" />
              </button>
            )}
          />
        </nav>
        {panelVisible && (
          <aside className={`ctx${bp === 'tablet' ? ' is-overlay' : ''}`} aria-label={`${panelTitle ?? 'Context'} navigation`}>
            <div className="ctx-head">
              <p className="strong">{panelTitle}</p>
              <button className="icon-btn" type="button" onClick={togglePanel} aria-label="Hide context panel" title="Hide panel">
                <Icon name="panel" />
              </button>
            </div>
            {panel}
          </aside>
        )}
        <main className="main" id="main">{children(bp)}</main>
      </div>
    </div>
  );
}
