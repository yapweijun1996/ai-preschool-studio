import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { Avatar, SourceChip, StatusLabel, VerifyLabel } from '../components/ui';
import { CLASS_NAME, STUDENTS, TEACHER, TODAY, daysAgo, type ReportStatus } from '../data/demo';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n';
import { useLabels } from '../i18n/labels';
import { usePortfolio } from '../store/PortfolioContext';
import { allSummaries } from '../store/selectors';
import { useLastObservedLabel } from './Students';
import { DEMO_ROLES } from '../roles';
import { useRole } from '../roles/RoleContext';

const ORDER: ReportStatus[] = ['notStarted', 'draft', 'review', 'changes', 'approved'];

export function Dashboard() {
  const { t, fmtDate } = useI18n();
  const { domainShort, status: statusLabel, term: periodLabel } = useLabels();
  const lastObservedLabel = useLastObservedLabel();
  const { state } = usePortfolio();
  const role = useRole();
  const activeRole = DEMO_ROLES.find((item) => item.role === role.role)!;
  const summaries = allSummaries(state);
  const counts = ORDER.map((st) => ({ st, n: summaries.filter((s) => s.report.status === st).length }));
  const reasons = [
    ...summaries.filter((s) => s.unverified > 0).map((s) => ({ s, to: `/students/${s.student.id}/studio`, text: t('pages.dashboard.draftClaims', { count: s.unverified }), label: <VerifyLabel /> })),
    ...summaries.filter((s) => s.report.status === 'changes').map((s) => ({ s, to: `/students/${s.student.id}/studio`, text: s.report.comment?.text ?? t('pages.dashboard.reviewerRequested'), label: <StatusLabel status="changes" /> })),
    ...summaries.filter((s) => s.lastObserved && daysAgo(s.lastObserved) >= 14).map((s) => ({ s, to: `/students/${s.student.id}/observe`, text: lastObservedLabel(s.lastObserved), label: <StatusLabel status={s.report.status} /> }))
  ];
  // One row per student: the most urgent reason sets the link and label; every reason is listed.
  const actions = reasons.reduce<{ s: (typeof reasons)[number]['s']; to: string; texts: string[]; label: (typeof reasons)[number]['label'] }[]>((acc, r) => {
    const row = acc.find((a) => a.s.student.id === r.s.student.id);
    if (row) row.texts.push(r.text);
    else acc.push({ s: r.s, to: r.to, texts: [r.text], label: r.label });
    return acc;
  }, []);
  const recent = [...state.observations].filter((o) => o.term === 4).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const nameOf = (id: string) => STUDENTS.find((s) => s.id === id)!.name;
  const term = periodLabel(4);
  const addLabel = t('pages.shared.addObservation');
  const today = t('pages.dashboard.today', { weekday: fmtDate(TODAY, { weekday: 'long' }), date: fmtDate(TODAY) });

  if (role.role === 'parent' || role.role === 'admin') {
    const modules: TKey[] = role.role === 'parent'
      ? ['shell.roles.familyModules', 'shell.roles.noticesModule']
      : ['shell.roles.schoolsModule', 'shell.roles.privacyModule', 'shell.roles.retentionModule', 'shell.roles.incidentsModule', 'shell.roles.principalReportsModule'];
    return (
      <AppShell module="dashboard" mobileTitle={t(activeRole.labelKey)}>
        {() => (
          <div className="page">
            <div className="page-title-row"><h1 className="h1">{t('shell.roles.plannedTitle', { role: t(activeRole.labelKey) })}</h1></div>
            <section className="card card-pad stack" aria-labelledby="planned-purpose">
              <h2 id="planned-purpose" className="h2">{t('shell.roles.planned')}</h2>
              <p className="sec">{t(role.role === 'parent' ? 'shell.roles.parentPurpose' : 'shell.roles.adminPurpose')}</p>
              <h3 className="sec semibold">{t('shell.roles.plannedModules')}</h3>
              <ul className="stack" style={{ paddingLeft: 24 }}>
                {modules.map((key) => <li key={key} className="sec">{t(key)}</li>)}
              </ul>
              <button className="btn btn-primary" type="button" onClick={() => role.setRole('teacher')}>{t('shell.roles.returnTeacher')}</button>
            </section>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell
      module="dashboard"
      mobileTitle={t('pages.dashboard.mobileTitle')}
      mobileSubtitle={`${CLASS_NAME} · ${term}`}
      mobileActions={<Link className="btn btn-primary btn-block" to="/students/aria/observe"><Icon name="plus" size={18} />{addLabel}</Link>}
    >
      {(bp) => (
        <div className="page">
          <div className="page-title-row">
            <div className="grow">
              <h1 className="h1">{t('pages.dashboard.greeting', { name: TEACHER })}</h1>
              <p className="sec muted num">{today} · {CLASS_NAME} · {term}</p>
            </div>
            {bp !== 'mobile' && <Link className="btn btn-primary" to="/students/aria/observe"><Icon name="plus" size={18} />{addLabel}</Link>}
          </div>
          <div className="grid-main-side">
            <div className="stack" style={{ gap: 24 }}>
              <section className="card" aria-labelledby="ar-h" style={{ overflow: 'hidden' }}>
                <div className="card-head"><h2 id="ar-h" className="h2 grow">{t('pages.dashboard.actionRequired')}</h2><span className="cap muted">{t('pages.dashboard.items', { count: actions.length })}</span></div>
                {actions.length === 0 && <p className="sec muted" style={{ padding: '0 20px 20px' }}>{t('pages.dashboard.nothing')}</p>}
                {actions.map(({ s, to, texts, label }) => (
                  <Link key={s.student.id} className="row-link" to={to}>
                    <Avatar initials={s.student.initials} />
                    <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="strong">{s.student.name}</span>
                      {texts.map((text, j) => <span key={j} className="sec muted">{text}</span>)}
                    </span>
                    {bp !== 'mobile' && label}
                    <Icon name="chevronRight" />
                  </Link>
                ))}
              </section>
              <section className="card card-pad stack" aria-labelledby="rp-h">
                <div className="row"><h2 id="rp-h" className="h2 grow">{t('pages.dashboard.reportsHeading', { term })}</h2><Link className="btn btn-ghost" to="/students">{t('pages.dashboard.viewStudents')}</Link></div>
                <ul style={{ display: 'grid', gridTemplateColumns: bp === 'mobile' ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
                  {counts.map(({ st, n }) => (
                    <li key={st} className="stack report-tile" style={{ gap: 8, padding: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <StatusLabel status={st} />
                      <span className="sec num"><span className="strong">{n}</span> {t('pages.dashboard.studentsUnit', { count: n })}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <div className="stack" style={{ gap: 24 }}>
              <section className="card card-pad stack" aria-labelledby="cw-h">
                <h2 id="cw-h" className="h2">{t('pages.dashboard.continueHeading')}</h2>
                <div className="row"><Avatar initials="AT" /><span className="grow" style={{ display: 'flex', flexDirection: 'column' }}><span className="strong">{t('pages.dashboard.portfolioOf', { name: 'Aria Tan' })}</span><span className="sec muted">{state.reports.aria.status === 'draft' ? statusLabel('draft') : t('pages.dashboard.report')} · {term}</span></span></div>
                <Link className="btn btn-secondary" to="/students/aria/studio" style={{ alignSelf: 'flex-start' }}>{t('pages.shared.openStudio')}</Link>
              </section>
              <section className="card" aria-labelledby="ro-h" style={{ overflow: 'hidden' }}>
                <div className="card-head"><h2 id="ro-h" className="h2 grow">{t('pages.dashboard.recentObservations')}</h2></div>
                {recent.map((o) => (
                  <Link key={o.id} className="row-link" to={`/students/${o.studentId}`}>
                    <span className="grow stack" style={{ gap: 4 }}>
                      <span className="row"><SourceChip id={o.id} /><span className="cap muted num">{fmtDate(o.date)}</span></span>
                      <span className="sec"><span className="semibold">{nameOf(o.studentId)}</span> · {domainShort(o.domain)}</span>
                    </span>
                    <Icon name="chevronRight" />
                  </Link>
                ))}
              </section>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
