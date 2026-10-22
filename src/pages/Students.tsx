import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { StudentsPanel } from '../components/StudentsPanel';
import { Avatar, StatusLabel } from '../components/ui';
import { CLASS_NAME, REPORT_STATUS_LABEL, TERM, lastObservedLabel, type ReportStatus } from '../data/demo';
import { usePortfolio } from '../store/PortfolioContext';
import { allSummaries } from '../store/selectors';

const FILTERS: (ReportStatus | 'all')[] = ['all', 'notStarted', 'draft', 'review', 'changes', 'approved'];

export function Students() {
  const { state } = usePortfolio();
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  // Simulated fetch so the loading state is part of the real flow.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(t);
  }, []);

  const rows = allSummaries(state).filter(
    (s) => (filter === 'all' || s.report.status === filter) && s.student.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <AppShell
      module="students"
      panelTitle="Students"
      panel={<StudentsPanel />}
      mobileTitle="My Students"
      mobileSubtitle={`${CLASS_NAME} · ${TERM}`}
      mobileActions={<Link className="btn btn-primary btn-block" to="/students/aria/observe"><Icon name="plus" size={18} />Add observation</Link>}
    >
      {(bp) => (
        <div className="page">
          <div className="page-title-row">
            <div className="grow">
              {bp !== 'mobile' && <h1 className="h1">My Students</h1>}
              <p className="sec muted">{CLASS_NAME} · {TERM} · 12 students</p>
            </div>
            {bp !== 'mobile' && <Link className="btn btn-primary" to="/students/aria/observe"><Icon name="plus" size={18} />Add observation</Link>}
          </div>
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <div className="search-wrap" style={{ width: bp === 'mobile' ? '100%' : 320 }}>
              <label className="sr-only" htmlFor="st-search">Search students</label>
              <Icon name="search" />
              <input id="st-search" className="input" type="search" placeholder="Search students" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="chip-row scroll" role="group" aria-label="Filter by report status">
              {FILTERS.map((f) => (
                <button key={f} className="chip" type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : REPORT_STATUS_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <section className="card" aria-busy="true" style={{ overflow: 'hidden' }}>
              <p className="sec muted table-head" role="status">Loading students…</p>
              {[1, 2, 3, 4, 5].map((k) => (
                <div key={k} className="row" style={{ minHeight: 64, padding: '12px 16px', borderTop: '1px solid var(--color-border)', flexWrap: 'nowrap' }}>
                  <div className="skel" style={{ width: 40, height: 40, borderRadius: 999 }} />
                  <div className="grow stack" style={{ gap: 6 }}><div className="skel" style={{ width: 180, height: 14 }} /><div className="skel" style={{ width: 96, height: 10 }} /></div>
                  <div className="skel" style={{ width: 100, height: 24 }} />
                </div>
              ))}
            </section>
          ) : rows.length === 0 ? (
            <section className="card empty">
              <div className="state-icon"><Icon name="users" size={24} /></div>
              <h2 className="h2">No students match</h2>
              <p className="sec muted" style={{ maxWidth: '44ch' }}>Try another report status or search, or clear the filters to see everyone in {CLASS_NAME}.</p>
              <button className="btn btn-secondary" type="button" onClick={() => { setFilter('all'); setQuery(''); }}>Clear filters</button>
            </section>
          ) : (
            <section className="card" aria-label={`Students in ${CLASS_NAME}`} style={{ overflow: 'hidden' }}>
              {bp === 'desktop' && (
                <div className="table-head" aria-hidden="true">
                  <span className="grow">Student</span>
                  <span style={{ width: 200 }}>Last observed</span>
                  <span style={{ width: 180 }}>Observations this term</span>
                  <span style={{ width: 200 }}>Report status</span>
                  <span style={{ width: 20 }} />
                </div>
              )}
              {rows.map((s) => (
                <Link key={s.student.id} className="row-link" to={`/students/${s.student.id}`}>
                  <span className="grow row" style={{ flexWrap: 'nowrap', gap: 12 }}>
                    <Avatar initials={s.student.initials} />
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 2 }}>
                      <span className="strong">{s.student.name}</span>
                      <span className="cap muted">{bp === 'desktop' ? 'Demo student' : `Demo student · ${lastObservedLabel(s.lastObserved)}`}</span>
                      {bp === 'mobile' && <StatusLabel status={s.report.status} />}
                    </span>
                  </span>
                  {bp === 'desktop' && <span className="sec num" style={{ width: 200 }}>{lastObservedLabel(s.lastObserved)}</span>}
                  {bp === 'desktop' && <span className="sec num" style={{ width: 180 }}>{s.count} observations</span>}
                  {bp !== 'mobile' && <span style={{ width: bp === 'desktop' ? 200 : 'auto' }}><StatusLabel status={s.report.status} /></span>}
                  <Icon name="chevronRight" />
                </Link>
              ))}
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
