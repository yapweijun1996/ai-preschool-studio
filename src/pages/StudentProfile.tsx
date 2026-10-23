import { Suspense, lazy } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useNavMemory, useVisit } from '../hooks/useNavMemory';
import { AppShell } from '../components/AppShell';
import { AccessDenied } from '../components/AccessDenied';
import { Icon } from '../components/Icon';
import { EmptyIllustration } from '../components/EmptyIllustration';
import { ReportFlow } from '../components/ReportFlow';
import { StudentTabs } from '../components/StudentTabs';
import { Avatar, MilestoneDots, SourceChip, StatusLabel, VerifyLabel } from '../components/ui';
import { CLASS_NAME, TEACHER, TODAY } from '../data/demo';
import { isLate } from '../attendance/domain';
import { DOMAINS } from '../framework';
import { useI18n, type TKey } from '../i18n';
import { useLabels } from '../i18n/labels';
import { usePortfolio } from '../store/PortfolioContext';
import { observationsFor } from '../store/reducer';
import { milestonesFor, studentSummary } from '../store/selectors';
import { NotFound } from './NotFound';
import { useLastObservedLabel } from '../hooks/useStudentLabels';
import { useRole } from '../roles/RoleContext';

const FamilyEnrolment = lazy(() => import('../components/FamilyEnrolment').then((module) => ({ default: module.FamilyEnrolment })));

export function StudentProfile() {
  const { id = '' } = useParams();
  const { t, fmtDate } = useI18n();
  const { domainFull, domainShort, milestone, term: periodLabel, termShort } = useLabels();
  const terms = { term3: termShort(3), term4: termShort(4) };
  const lastObservedLabel = useLastObservedLabel();
  const { state } = usePortfolio();
  const role = useRole();
  const sum = studentSummary(state, id);
  const { isPinned, togglePin } = useNavMemory();
  useVisit(id, !!sum);
  if (!role.can('students.view')) return <AppShell module="students" mobileTitle={t('pages.children.accessTitle')}>
    {() => <AccessDenied />}
  </AppShell>;
  if (!sum) return <NotFound />;
  const pinned = isPinned(id);
  const term4 = milestonesFor(state, id, 4);
  const { student, report } = sum;
  const obs = observationsFor(state, id).sort((a, b) => b.date.localeCompare(a.date));
  const byDomain = (k: string) => obs.filter((o) => o.domain === k);
  const demo = t('common.demoStudent');
  const addLabel = t('pages.shared.addObservation');
  const openStudio = t('pages.shared.openStudio');
  const pinLabel = pinned ? t('pages.profile.unpin') : t('pages.profile.pin');

  return (
    <AppShell
      module="students"
      currentStudentId={id}
      crumbs={[{ label: t('shell.module.students'), to: '/students' }, { label: student.name }]}
      mobileTitle={student.name}
      mobileSubtitle={`${CLASS_NAME} · ${demo}`}
      mobileBack="/students"
      mobileActions={
        <>
          {role.can('observation.add') && <Link className="icon-btn icon-btn-outline" to={`/students/${id}/observe`} aria-label={addLabel} title={addLabel}><Icon name="plus" /></Link>}
          {role.can('report.view') && <Link className="btn btn-primary grow" to={`/students/${id}/studio`}>{openStudio}</Link>}
        </>
      }
    >
      {(bp) => (
        <div className="page">
          <div className="row profile-head">
            <Avatar initials={student.initials} size="md" label={t('pages.shared.photoPlaceholderFor', { name: student.name })} />
            <div className="grow">
              <div className="row">
                {bp !== 'mobile' && <h1 className="h1">{student.name}</h1>}
                <span className="status st-draft">{demo}</span>
              </div>
              <p className="sec muted"><span className="nowrap">{CLASS_NAME}</span> · <span className="nowrap">{t('pages.profile.age', { age: student.age })}</span> · <span className="nowrap">{lastObservedLabel(sum.lastObserved)}</span></p>
            </div>
            {role.role !== 'admin' && <button className="icon-btn pin-btn has-tip tip-below" type="button" aria-pressed={pinned} onClick={() => togglePin(id)} aria-label={pinLabel} data-tip={pinLabel}>
              <Icon name="pin" />
            </button>}
            {bp !== 'mobile' && (
              <>
                {role.can('observation.add') && <Link className="btn btn-secondary" to={`/students/${id}/observe`}><Icon name="plus" size={18} />{addLabel}</Link>}
                {role.can('report.view') && <Link className="btn btn-primary" to={`/students/${id}/studio`}>{openStudio}</Link>}
              </>
            )}
          </div>
          <StudentTabs id={id} active="overview" />
          {role.can('attendance.view') && <AttendanceProfileStrip childId={id} />}
          <div className="grid-main-side profile-grid">
            <section aria-labelledby="ld-h" className="stack profile-main" style={{ gap: 16 }}>
              <div className="row"><h2 id="ld-h" className="h2 grow">{t('pages.profile.domainsHeading', { term: termShort(4) })}</h2><Link className="btn btn-ghost" to={`/students/${id}/progress`}><Icon name="compare" size={18} />{t('pages.profile.compare', terms)}</Link></div>
              <p className="sec muted note-line"><Icon name="info" size={16} />{t('pages.profile.milestoneNote', { emerging: milestone('emerging'), developing: milestone('developing'), consistent: milestone('consistent') })}</p>
              <div className="grid-2 domain-grid">
                {DOMAINS.map((d) => {
                  const list = byDomain(d.key);
                  return (
                    <article key={d.key} className="card card-pad stack card-link">
                      <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                        <h3 className="strong grow">
                          <Link className="stretched" to={`/students/${id}/progress?domain=${d.key}`}>
                            {domainFull(d.key)}<span className="sr-only"> · {t('pages.profile.domainLinkHint', terms)}</span>
                          </Link>
                        </h3>
                        <Icon name="chevronRight" size={18} className="card-link-chevron" />
                      </div>
                      <MilestoneDots milestone={term4[d.key]} />
                      <p className="sec muted num">{list.length ? t('pages.profile.domainObs', { count: list.length, date: fmtDate(list[0].date) }) : t('pages.profile.noObsDomain')}</p>
                    </article>
                  );
                })}
              </div>
              <section className="card" aria-labelledby="ro-h" style={{ overflow: 'hidden' }}>
                <div className="card-head"><h2 id="ro-h" className="h2 grow">{t('pages.profile.recentObservations')}</h2></div>
                {obs.length === 0 ? (
                  <div className="empty">
                    <EmptyIllustration name="no-observations" />
                    <p className="strong">{t('pages.profile.emptyTitle', { name: student.name.split(' ')[0], term: termShort(4) })}</p>
                    <p className="sec muted">{t('pages.profile.emptyBody')}</p>
                    {role.can('observation.add') && <Link className="btn btn-primary" to={`/students/${id}/observe`}><Icon name="plus" size={18} />{addLabel}</Link>}
                  </div>
                ) : (
                  obs.slice(0, 4).map((o) => (
                    <div key={o.id} className="row-link" style={{ alignItems: 'flex-start' }}>
                      <span className="grow stack" style={{ gap: 4 }}>
                        <span className="row"><SourceChip id={o.id} /><span className="cap muted num">{fmtDate(o.date)} · {domainShort(o.domain)}</span></span>
                        <span className="sec measure">{o.text}</span>
                      </span>
                    </div>
                  ))
                )}
              </section>
            </section>
            <aside className="stack" style={{ gap: 16 }}>
              {role.can('report.view') && <section className="card card-pad stack" aria-labelledby="pr-h">
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <div className="grow">
                    <h2 id="pr-h" className="h2">{t('pages.profile.portfolioReport')}</h2>
                    <p className="sec muted">{periodLabel(4)}</p>
                  </div>
                  <StatusLabel status={report.status} />
                </div>
                <ReportFlow status={report.status} hadChanges={report.hadChanges} compact />
                {sum.unverified > 0 && (
                  <div className="notice notice-warning" style={{ flexDirection: 'column', gap: 8 }}>
                    <VerifyLabel>{t('pages.shared.claims', { count: sum.unverified })}</VerifyLabel>
                    <p className="body-text">{t('pages.profile.claimsBody')}</p>
                    <Link className="btn btn-secondary" to={`/students/${id}/studio?focus=claims`} style={{ alignSelf: 'flex-start' }}>{t('pages.profile.reviewClaims')}<Icon name="arrowRight" size={18} /></Link>
                  </div>
                )}
                <Link className="btn btn-ghost" to={`/students/${id}/report`} style={{ alignSelf: 'flex-start' }}><Icon name="eye" size={18} />{t('pages.shared.previewPdf')}</Link>
              </section>}
              <section className="card card-pad stack" aria-labelledby="ab-h">
                <h2 id="ab-h" className="h2">{t('pages.profile.about')}</h2>
                <dl className="sec" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
                  <dt className="muted">{t('pages.profile.class')}</dt><dd>{CLASS_NAME}</dd>
                  <dt className="muted">{t('pages.profile.homeLanguages')}</dt><dd>{student.homeLanguages}</dd>
                  <dt className="muted">{t('pages.profile.keyTeacher')}</dt><dd>{TEACHER}</dd>
                  <dt className="muted">{t('pages.profile.photo')}</dt><dd>{t('pages.profile.photoValue')}</dd>
                </dl>
              </section>
            </aside>
          </div>
          <Suspense fallback={<section className="card card-pad" aria-busy="true" style={{ minHeight: 320 }}><p className="sec muted" role="status">{t('pages.children.loadingFamily')}</p></section>}>
            <FamilyEnrolment key={id} childId={id} />
          </Suspense>
        </div>
      )}
    </AppShell>
  );
}


function AttendanceProfileStrip({ childId }: { childId: string }) {
  const { t, fmtDate } = useI18n();
  const { state } = usePortfolio();
  const dates = [...new Set(state.attendanceRecords.filter((record) => record.date <= TODAY).map((record) => record.date))].sort().slice(-10);
  const entries = dates.map((date) => {
    const record = state.attendanceRecords.find((item) => item.childId === childId && item.date === date);
    const status = !record ? 'notMarked' : record.status === 'absent' ? 'absent' : isLate(record.arrivedAt) ? 'late' : 'present';
    return { date, status };
  });
  return <section className="card card-pad attendance-profile" aria-labelledby="attendance-profile-title"><h2 id="attendance-profile-title" className="h2">{t('pages.attendance.lastTenDays')}</h2><div className="attendance-day-strip">{entries.map(({date,status}) => <div className={`attendance-day attendance-day-${status}`} key={date}><span className="cap muted">{fmtDate(date,{day:'numeric',month:'short'})}</span><span className="attendance-day-mark" aria-hidden="true"/><span className="cap">{t(({ present: 'pages.attendance.present', late: 'pages.attendance.late', absent: 'pages.attendance.absent', notMarked: 'pages.attendance.attendanceNotMarked' } as Record<string,TKey>)[status])}</span></div>)}</div></section>;
}
