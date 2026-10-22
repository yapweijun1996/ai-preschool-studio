import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CLASS_NAME, REPORT_STATUS_LABEL, STUDENTS, domainShort, formatDate, type ReportStatus } from '../data/demo';
import { useNavMemory } from '../hooks/useNavMemory';
import { usePortfolio } from '../store/PortfolioContext';
import type { Module } from './AppShell';
import { Icon } from './Icon';
import { Avatar } from './ui';

export const MODULE_LABEL: Record<Module, string> = {
  dashboard: 'Home',
  students: 'Students',
  observations: 'Observations',
  reports: 'Reports'
};

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
  const location = useLocation();
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) input.current?.focus();
  }, [searchOpen]);

  const path = location.pathname;
  const status = new URLSearchParams(location.search).get('status');
  const matches = query.trim() ? STUDENTS.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())) : [];
  const recentShown = recent.filter((id) => !pinned.includes(id)).slice(0, 5);
  const counts = (st: ReportStatus) => Object.values(state.reports).filter((r) => r.status === st).length;
  const latestObs = [...state.observations].filter((o) => o.term === 4).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const studentId = currentStudentId ?? 'aria';

  return (
    <>
      <div className="ctx-head">
        <p className="strong grow">{MODULE_LABEL[module]}</p>
        <button className="icon-btn has-tip tip-below" type="button" data-tip="Search students" aria-label="Search students" aria-expanded={searchOpen} onClick={() => { setSearchOpen(!searchOpen); setQuery(''); }}>
          <Icon name="search" />
        </button>
        <button className="icon-btn has-tip tip-below" type="button" data-tip="Close sidebar · Ctrl+Shift+S" aria-label="Close sidebar" aria-keyshortcuts="Control+Shift+S Meta+Shift+S" onClick={onToggle}>
          <Icon name="panel" />
        </button>
      </div>

      {searchOpen && (
        <div className="ctx-search">
          <div className="search-wrap">
            <label className="sr-only" htmlFor="ctx-search">Search students</label>
            <Icon name="search" />
            <input ref={input} id="ctx-search" className="input" type="search" placeholder="Search students" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)} />
          </div>
          {query.trim() && (
            <div className="ctx-group" aria-live="polite">
              {matches.length === 0 ? <p className="sec muted" style={{ padding: '8px 12px' }}>No students match “{query.trim()}”.</p> : matches.map((s) => <StudentLink key={s.id} id={s.id} current={currentStudentId} />)}
            </div>
          )}
        </div>
      )}

      <nav className="ctx-group" aria-label={`${MODULE_LABEL[module]} pages`}>
        {module === 'dashboard' && (
          <>
            <Link className="nav-link" to="/" aria-current={path === '/' ? 'page' : undefined}><Icon name="home" size={18} />Overview</Link>
            <Link className="nav-link" to="/students"><Icon name="users" size={18} />{CLASS_NAME}</Link>
          </>
        )}
        {module === 'students' && (
          <Link className="nav-link" to="/students" aria-current={path === '/students' && !status ? 'page' : undefined}><Icon name="users" size={18} />{CLASS_NAME}<span className="cap muted nav-meta">12</span></Link>
        )}
        {module === 'observations' && (
          <>
            <Link className="nav-link" to={`/students/${studentId}/observe`} aria-current={path.endsWith('/observe') ? 'page' : undefined}><Icon name="plus" size={18} />Add observation</Link>
            <p className="cap ctx-label">Latest</p>
            {latestObs.map((o) => (
              <Link key={o.id} className="nav-link" to={`/students/${o.studentId}`}>
                <span className="src">{o.id}</span>
                <span className="grow nav-text">{byId(o.studentId)?.name.split(' ')[0]} · {domainShort(o.domain).split(' ')[0]}</span>
                <span className="cap muted nav-meta num">{formatDate(o.date).replace(' 2026', '')}</span>
              </Link>
            ))}
          </>
        )}
        {module === 'reports' && (
          <>
            <p className="cap ctx-label" style={{ paddingTop: 4 }}>Report queue · Term 4</p>
            {(['review', 'changes', 'draft', 'notStarted', 'approved'] as ReportStatus[]).map((st) => (
              <Link key={st} className="nav-link" to={`/students?status=${st}`} aria-current={status === st ? 'page' : undefined}>
                <span className="grow">{REPORT_STATUS_LABEL[st]}</span>
                <span className="cap muted nav-meta num">{counts(st)}</span>
              </Link>
            ))}
            {currentStudentId && (
              <Link className="nav-link" to={`/students/${currentStudentId}/report`} aria-current={path.endsWith('/report') ? 'page' : undefined}><Icon name="fileText" size={18} />{byId(currentStudentId)?.name} · report</Link>
            )}
          </>
        )}
      </nav>

      {(module === 'students' || module === 'dashboard') && (
        <>
          <p className="cap ctx-label">Pinned</p>
          {pinned.length === 0 ? (
            <p className="cap muted" style={{ padding: '0 12px' }}>Pin a student from their profile to keep them here.</p>
          ) : (
            <div className="ctx-group">{pinned.map((id) => <StudentLink key={id} id={id} current={currentStudentId} />)}</div>
          )}
          {recentShown.length > 0 && (
            <>
              <p className="cap ctx-label">Recent</p>
              <div className="ctx-group">{recentShown.map((id) => <StudentLink key={id} id={id} current={currentStudentId} />)}</div>
            </>
          )}
        </>
      )}
    </>
  );
}
