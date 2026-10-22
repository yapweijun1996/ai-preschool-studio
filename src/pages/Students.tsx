import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { EmptyIllustration } from '../components/EmptyIllustration';
import { Avatar, ScrollRow, StatusLabel } from '../components/ui';
import { CLASS_NAME, STUDENTS, daysAgo, type ReportStatus } from '../data/demo';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { usePortfolio } from '../store/PortfolioContext';
import { allSummaries } from '../store/selectors';

const FILTERS: (ReportStatus | 'all')[] = ['all', 'notStarted', 'draft', 'review', 'changes', 'approved'];

/** "Last observed 3 days ago" in the current language. */
export function useLastObservedLabel() {
  const { t } = useI18n();
  return (iso: string | undefined): string => {
    if (!iso) return t('pages.shared.notObserved');
    const n = daysAgo(iso);
    if (n <= 0) return t('pages.shared.lastObservedToday');
    return t('pages.shared.lastObservedDays', { count: n });
  };
}

/** "3 days ago" for a column already headed "Last observed". */
export function useAgoLabel() {
  const { t } = useI18n();
  return (iso: string | undefined): string => {
    if (!iso) return t('pages.shared.notObserved');
    const n = daysAgo(iso);
    return n <= 0 ? t('pages.shared.today') : t('pages.shared.daysAgo', { count: n });
  };
}

export function Students() {
  const { t } = useI18n();
  const { status: statusLabel, term: periodLabel } = useLabels();
  const lastObservedLabel = useLastObservedLabel();
  const agoLabel = useAgoLabel();
  const { state } = usePortfolio();
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get('status') as ReportStatus | 'all' | null;
  const filter: ReportStatus | 'all' = fromUrl && fromUrl !== 'all' && FILTERS.includes(fromUrl) ? fromUrl : 'all';
  // The filter lives in the URL so the Reports panel can deep-link to a status.
  const setFilter = (f: ReportStatus | 'all') => setParams(f === 'all' ? {} : { status: f }, { replace: true });
  const [query, setQuery] = useState('');
  // Simulated fetch so the loading state is part of the real flow.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const rows = allSummaries(state).filter(
    (s) => (filter === 'all' || s.report.status === filter) && s.student.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const term = periodLabel(4);
  const addLabel = t('pages.shared.addObservation');

  return (
    <AppShell
      module="students"
      mobileTitle={t('pages.students.title')}
      mobileSubtitle={`${CLASS_NAME} · ${term} · ${t('pages.students.count', { count: STUDENTS.length })}`}
      mobileActions={<Link className="btn btn-primary btn-block" to="/students/aria/observe"><Icon name="plus" size={18} />{addLabel}</Link>}
    >
      {(bp) => (
        <div className="page">
          {bp !== 'mobile' && (
            <div className="page-title-row">
              <div className="grow">
                <h1 className="h1">{t('pages.students.title')}</h1>
                <p className="sec muted">{CLASS_NAME} · {term} · {t('pages.students.count', { count: STUDENTS.length })}</p>
              </div>
              <Link className="btn btn-primary" to="/students/aria/observe"><Icon name="plus" size={18} />{addLabel}</Link>
            </div>
          )}
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <div className="search-wrap" style={{ width: bp === 'mobile' ? '100%' : 320 }}>
              <label className="sr-only" htmlFor="st-search">{t('pages.students.search')}</label>
              <Icon name="search" />
              <input id="st-search" className="input" type="search" placeholder={t('pages.students.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <ScrollRow className="chip-row scroll" role="group" aria-label={t('pages.students.filterLabel')}>
              {FILTERS.map((f) => (
                <button key={f} className="chip" type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'all' ? t('pages.shared.all') : statusLabel(f)}
                </button>
              ))}
            </ScrollRow>
          </div>

          {loading ? (
            <section className="card" aria-busy="true" style={{ overflow: 'hidden' }}>
              <p className="sec muted table-head" role="status">{t('pages.students.loading')}</p>
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
              <EmptyIllustration name="no-results" />
              <h2 className="h2">{t('pages.students.noMatch')}</h2>
              <p className="sec muted" style={{ maxWidth: '44ch' }}>{t('pages.students.noMatchBody', { class: CLASS_NAME })}</p>
              <button className="btn btn-secondary" type="button" onClick={() => { setFilter('all'); setQuery(''); }}>{t('pages.students.clearFilters')}</button>
            </section>
          ) : (
            <section className="card" aria-label={t('pages.students.listLabel', { class: CLASS_NAME })} style={{ overflow: 'hidden' }}>
              {bp === 'desktop' && (
                <div className="table-head" aria-hidden="true">
                  <span className="grow">{t('pages.students.colStudent')}</span>
                  <span style={{ width: 200 }}>{t('pages.students.colLastObserved')}</span>
                  <span style={{ width: 180 }}>{t('pages.students.colCount')}</span>
                  <span style={{ width: 200 }}>{t('pages.students.colStatus')}</span>
                  <span style={{ width: 20 }} />
                </div>
              )}
              {rows.map((s) => (
                <Link key={s.student.id} className="row-link" to={`/students/${s.student.id}`}>
                  <span className="grow row" style={{ flexWrap: 'nowrap', gap: 12 }}>
                    <Avatar initials={s.student.initials} />
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 2 }}>
                      <span className="strong">{s.student.name}</span>
                      {bp !== 'desktop' && <span className="cap muted">{lastObservedLabel(s.lastObserved)}</span>}
                      {bp === 'mobile' && <span><StatusLabel status={s.report.status} /></span>}
                    </span>
                  </span>
                  {bp === 'desktop' && <span className="sec num" style={{ width: 200 }}>{agoLabel(s.lastObserved)}</span>}
                  {bp === 'desktop' && <span className="sec num" style={{ width: 180 }}>{t('pages.shared.observations', { count: s.count })}</span>}
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
