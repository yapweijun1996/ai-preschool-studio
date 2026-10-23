import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CLASS_NAME, STUDENTS, TODAY, type ReportStatus } from '../data/demo';
import { useNavMemory } from '../hooks/useNavMemory';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { APP_VERSION, BUILD_ID, usePwa } from '../pwa';
import { usePortfolio } from '../store/PortfolioContext';
import type { Module } from './AppShell';
import { Icon, type IconName } from './Icon';
import { Avatar } from './ui';
import { useRole } from '../roles/RoleContext';

export type SettingsSection = 'appearance' | 'language' | 'framework' | 'about' | 'demo';

export const SETTINGS_SECTIONS: { key: SettingsSection; icon: IconName }[] = [
  { key: 'appearance', icon: 'palette' },
  { key: 'language', icon: 'languages' },
  { key: 'framework', icon: 'layers' },
  { key: 'about', icon: 'info' },
  { key: 'demo', icon: 'flask' }
];

const byId = (id: string) => STUDENTS.find((s) => s.id === id);

function StudentLink({ id, current }: { id: string; current?: string }) {
  const s = byId(id);
  if (!s) return null;
  return (
    <Link className="nav-link" to={`/students/${id}`} aria-current={current === id ? 'page' : undefined}>
      <Avatar initials={s.initials} size="sm" />
      <span className="grow nav-text">{s.name}</span>
    </Link>
  );
}

/**
 * Context panel content. It depends on the rail module and never mixes modules;
 * Pinned and Recent are student shortcuts kept on this device.
 */
export function ModulePanel({ module, currentStudentId, onToggle, searchOpen, setSearchOpen }: {
  module: Module;
  currentStudentId?: string;
  onToggle: () => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
}) {
  const { pinned, recent } = useNavMemory();
  const { state } = usePortfolio();
  const { t, fmtDate } = useI18n();
  const role = useRole();
  const labels = useLabels();
  const pwa = usePwa();
  const moduleLabel = t(`shell.module.${module}`);
  const location = useLocation();
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) input.current?.focus();
  }, [searchOpen]);

  const path = location.pathname;
  const status = new URLSearchParams(location.search).get('status');
  const matches = role.can('students.view') && query.trim() ? STUDENTS.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())) : [];
  const recentShown = recent.filter((id) => !pinned.includes(id)).slice(0, 5);
  const attendanceRecords = state.attendanceRecords.filter((record) => record.classId === 'k2-sunflower-2026' && record.date === TODAY);
  const attendanceCounts = { present: attendanceRecords.filter((record) => record.status === 'present').length, absent: attendanceRecords.filter((record) => record.status === 'absent').length, notMarked: Object.values(state.children).filter((child) => child.status === 'active').length - attendanceRecords.length };
  const counts = (st: ReportStatus) => Object.values(state.reports).filter((r) => r.status === st).length;
  const latestObs = [...state.observations].filter((o) => o.term === 4).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const studentId = currentStudentId ?? 'aria';

  return (
    <>
      <div className="ctx-head">
        <p className="strong grow">{moduleLabel}</p>
        {role.can('students.view') && <button className="icon-btn has-tip tip-below" type="button" data-tip={t('shell.panel.search')} aria-label={t('shell.panel.search')} aria-expanded={searchOpen} onClick={() => { setSearchOpen(!searchOpen); setQuery(''); }}>
          <Icon name="search" />
        </button>}
        <button className="icon-btn has-tip tip-below" type="button" data-tip={t('shell.panel.closeTip')} aria-label={t('shell.panel.close')} aria-keyshortcuts="Control+Shift+S Meta+Shift+S" onClick={onToggle}>
          <Icon name="panel" />
        </button>
      </div>

      {searchOpen && role.can('students.view') && (
        <div className="ctx-search">
          <div className="search-wrap">
            <label className="sr-only" htmlFor="ctx-search">{t('shell.panel.search')}</label>
            <Icon name="search" />
            <input ref={input} id="ctx-search" className="input" type="search" placeholder={t('shell.panel.search')} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)} />
          </div>
          {query.trim() && (
            <div className="ctx-group" aria-live="polite">
              {matches.length === 0 ? <p className="sec muted" style={{ padding: '8px 12px' }}>{t('shell.panel.noMatch', { query: query.trim() })}</p> : matches.map((s) => <StudentLink key={s.id} id={s.id} current={currentStudentId} />)}
            </div>
          )}
        </div>
      )}

      <nav className="ctx-group" aria-label={t('shell.panel.pages', { module: moduleLabel })}>
        {module === 'dashboard' && (
          <>
            <Link className="nav-link" to="/" aria-current={path === '/' ? 'page' : undefined}><Icon name="home" size={18} />{t('shell.panel.overview')}</Link>
            {role.can('students.view') && <Link className="nav-link" to="/students"><Icon name="users" size={18} />{CLASS_NAME}</Link>}
          </>
        )}
        {module === 'students' && (
          <>
            <Link className="nav-link" to="/students" aria-current={path === '/students' && !status ? 'page' : undefined}><Icon name="users" size={18} />{CLASS_NAME}<span className="cap muted nav-meta">{STUDENTS.length}</span></Link>
            {role.can('coverage.view') && <Link className="nav-link" to="/coverage" aria-current={path === '/coverage' ? 'page' : undefined}><Icon name="layers" size={18} />{t('pages.coverage.title')}</Link>}
          </>
        )}
        {module === 'attendance' && role.can('attendance.view') && (
          <>
            <Link className="nav-link" to="/attendance" aria-current={path === '/attendance' ? 'page' : undefined}><Icon name="calendarCheck" size={18} />{t('shell.panel.attendanceToday')}</Link>
            <Link className="nav-link" to="/attendance/kiosk" aria-current={path === '/attendance/kiosk' ? 'page' : undefined}><Icon name="scan" size={18} />{t('shell.panel.attendanceKiosk')}</Link>
            <Link className="nav-link" to="/attendance/history" aria-current={path === '/attendance/history' ? 'page' : undefined}><Icon name="calendar" size={18} />{t('shell.panel.attendanceHistory')}</Link>
            <div className="notice notice-info" style={{ margin: '8px 4px' }}><p className="cap">{t('shell.panel.attendanceSummary')}</p><p className="sec">{t('shell.panel.attendanceCounts', attendanceCounts)}</p></div>
          </>
        )}
        {module === 'observations' && role.can('observation.add') && (
          <>
            <Link className="nav-link" to={`/students/${studentId}/observe`} aria-current={path.endsWith('/observe') ? 'page' : undefined}><Icon name="plus" size={18} />{t('shell.panel.addObservation')}</Link>
            <p className="cap ctx-label">{t('shell.panel.latest')}</p>
            {latestObs.map((o) => (
              <Link key={o.id} className="nav-link nav-link-2" to={`/students/${o.studentId}`}>
                <span className="nav-2-top"><span className="src">{o.id}</span><span className="cap muted num">{fmtDate(o.date, { day: 'numeric', month: 'short' })}</span></span>
                <span className="nav-text">{byId(o.studentId)?.name} · {labels.domainShort(o.domain)}</span>
              </Link>
            ))}
          </>
        )}
        {module === 'reports' && (
          <>
            {(role.can('reviews.view') || role.can('reviews.changes')) && <Link className="nav-link" to="/reviews" aria-current={path === '/reviews' ? 'page' : undefined}><Icon name="fileText" size={18} />{t('pages.reviews.title')}</Link>}
            {role.can('report.view') && <>
              <p className="cap ctx-label" style={{ paddingTop: 4 }}>{t('shell.panel.reportQueue', { term: labels.termShort(4) })}</p>
              {(['review', 'changes', 'draft', 'notStarted', 'approved'] as ReportStatus[]).map((st) => (
                <Link key={st} className="nav-link" to={`/students?status=${st}`} aria-current={status === st ? 'page' : undefined}>
                  <span className="grow">{labels.status(st)}</span>
                  <span className="cap muted nav-meta num">{counts(st)}</span>
                </Link>
              ))}
            </>}
            {role.can('report.view') && currentStudentId && (
              <Link className="nav-link" to={`/students/${currentStudentId}/report`} aria-current={path.endsWith('/report') ? 'page' : undefined}><Icon name="fileText" size={18} />{t('shell.panel.studentReport', { name: byId(currentStudentId)?.name ?? '' })}</Link>
            )}
          </>
        )}
        {module === 'settings' && role.can('settings.view') && <>
          {SETTINGS_SECTIONS.filter((sec) => sec.key !== 'demo' || role.can('demo.controls')).map((sec) => (
            <Link key={sec.key} className="nav-link" to={`/settings/${sec.key}`} aria-current={path === `/settings/${sec.key}` ? 'page' : undefined}>
              <Icon name={sec.icon} size={18} />
              {t(`shell.settings.sections.${sec.key}`)}
            </Link>
          ))}
        </>}
        {module === 'settings' && role.can('catalog.view') && <Link className="nav-link" to="/catalog" aria-current={path === '/catalog' ? 'page' : undefined}><Icon name="layers" size={18} />{t('shell.panel.designReference')}</Link>}
      </nav>

      {role.can('students.view') && (module === 'students' || module === 'dashboard') && (
        <>
          <p className="cap ctx-label">{t('shell.panel.pinned')}</p>
          {pinned.length === 0 ? (
            <p className="cap muted" style={{ padding: '0 12px' }}>{t('shell.panel.pinnedEmpty')}</p>
          ) : (
            <div className="ctx-group">{pinned.map((id) => <StudentLink key={id} id={id} current={currentStudentId} />)}</div>
          )}
          {recentShown.length > 0 && (
            <>
              <p className="cap ctx-label">{t('shell.panel.recent')}</p>
              <div className="ctx-group">{recentShown.map((id) => <StudentLink key={id} id={id} current={currentStudentId} />)}</div>
            </>
          )}
        </>
      )}

      <div className="ctx-foot">
        <Link className="ctx-version" to="/settings/about" aria-current={path === '/settings/about' ? 'page' : undefined}>
          <span className="sr-only">{t('shell.panel.versionPrefix')} </span>
          <span className="num">v{APP_VERSION} · {BUILD_ID}</span>
        </Link>
        {pwa.updateOffered && (
          <span className="ctx-update cap">
            <Icon name="download" size={14} />
            {t('shell.panel.updateAvailable')}
          </span>
        )}
      </div>
    </>
  );
}
