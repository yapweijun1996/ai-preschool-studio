import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EmptyIllustration } from '../components/EmptyIllustration';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/ui';
import { TEACHER } from '../data/demo';
import { useI18n } from '../i18n';
import { usePortfolio } from '../store/PortfolioContext';
import { useRole } from '../roles/RoleContext';

type StatusFilter = 'active' | 'withdrawn';
const STATUSES: StatusFilter[] = ['active', 'withdrawn'];

export function Classes() {
  const { t } = useI18n();
  const { state } = usePortfolio();
  const role = useRole();
  const [filter, setFilter] = useState<StatusFilter>('active');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);
  const classRecord = state.classes[0];
  const children = Object.values(state.children).filter((child) => child.classId === classRecord?.id);
  const rows = children.filter((child) => child.status === filter);

  if (!role.can('students.view')) return <AppShell module="students" mobileTitle={t('pages.children.accessTitle')}>
    {() => <div className="page"><section className="card card-pad stack"><h1 className="h1">{t('pages.children.accessTitle')}</h1><p className="sec muted">{t('shell.roles.accessDenied')}</p><Link className="btn btn-secondary" to="/">{t('pages.shared.back')}</Link></section></div>}
  </AppShell>;

  return (
    <AppShell module="students" mobileTitle={t('pages.children.classesTitle')} mobileSubtitle={classRecord?.name ?? ''}>
      {(bp) => (
        <div className="page">
          <div className="page-title-row">
            <div className="grow">
              <h1 className="h1">{t('pages.children.classesTitle')}</h1>
              <p className="sec muted">{t('pages.children.classCount', { name: classRecord?.name ?? '', count: children.length })}</p>
            </div>
            <Link className="btn btn-secondary" to="/students">{t('pages.children.portfolioStudents')}</Link>
          </div>
          {classRecord ? (
            <>
              <section className="card card-pad row class-summary">
                <div className="grow">
                  <h2 className="h2">{classRecord.name}</h2>
                  <p className="sec muted">{t('pages.children.levelYear', { level: classRecord.level, year: classRecord.year })}</p>
                </div>
                <div className="class-teacher"><span className="cap muted">{t('pages.children.teacher')}</span><strong>{TEACHER}</strong></div>
                <div className="class-total"><span className="cap muted">{t('pages.children.enrolled')}</span><strong>{children.length}</strong></div>
              </section>
              <div className="row class-filters" role="group" aria-label={t('pages.children.statusFilter')}>
                {STATUSES.map((status) => (
                  <button key={status} className="chip" type="button" aria-pressed={filter === status} onClick={() => setFilter(status)}>
                    {t(`pages.children.${status}`)} ({children.filter((child) => child.status === status).length})
                  </button>
                ))}
              </div>
              {loading ? (
                <section className="card" aria-busy="true" style={{ minHeight: 460 }}>
                  <p className="sec muted table-head" role="status">{t('pages.children.loading')}</p>
                  {children.slice(0, 6).map((child) => <div key={child.id} className="row-link"><span className="skel" style={{ width: 40, height: 40, borderRadius: 999 }} /><span className="skel" style={{ height: 14, width: 180 }} /></div>)}
                </section>
              ) : rows.length ? (
                <section className="card class-roster" aria-label={t('pages.children.rosterLabel', { name: classRecord.name })}>
                  {bp === 'desktop' && <div className="table-head"><span className="grow">{t('pages.children.child')}</span><span style={{ width: 130 }}>{t('pages.children.age')}</span><span style={{ width: 160 }}>{t('pages.children.status')}</span><span style={{ width: 24 }} /></div>}
                  {rows.map((child) => (
                    <Link className="row-link" to={`/students/${child.id}`} key={child.id}>
                      <span className="grow row" style={{ flexWrap: 'nowrap' }}><Avatar initials={child.initials} /><span className="stack" style={{ gap: 2 }}><strong>{child.name}</strong>{bp !== 'desktop' && <span className="cap muted">{t('pages.children.ageValue', { age: child.age })}</span>}</span></span>
                      {bp === 'desktop' && <span className="sec" style={{ width: 130 }}>{t('pages.children.ageValue', { age: child.age })}</span>}
                      <span style={{ width: bp === 'desktop' ? 160 : 'auto' }}><span className={`status ${child.status === 'active' ? 'st-approved' : 'st-notstarted'}`}>{t(`pages.children.${child.status}`)}</span></span>
                      <Icon name="chevronRight" />
                    </Link>
                  ))}
                </section>
              ) : (
                <section className="card empty">
                  <EmptyIllustration name="no-results" />
                  <h2 className="h2">{t('pages.children.emptyRoster')}</h2>
                  <p className="sec muted">{t('pages.children.emptyRosterBody')}</p>
                </section>
              )}
            </>
          ) : (
            <section className="card empty"><EmptyIllustration name="no-results" /><p className="strong">{t('pages.children.noClass')}</p></section>
          )}
        </div>
      )}
    </AppShell>
  );
}

export default Classes;
