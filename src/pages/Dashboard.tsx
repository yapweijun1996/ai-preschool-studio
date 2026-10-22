import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { Avatar, SourceChip, StatusLabel, VerifyLabel } from '../components/ui';
import { CLASS_NAME, STUDENTS, TEACHER, TERM, daysAgo, domainShort, formatDate, lastObservedLabel, type ReportStatus } from '../data/demo';
import { usePortfolio } from '../store/PortfolioContext';
import { allSummaries } from '../store/selectors';

const ORDER: ReportStatus[] = ['notStarted', 'draft', 'review', 'changes', 'approved'];

export function Dashboard() {
  const { state } = usePortfolio();
  const summaries = allSummaries(state);
  const counts = ORDER.map((st) => ({ st, n: summaries.filter((s) => s.report.status === st).length }));
  const actions = [
    ...summaries.filter((s) => s.unverified > 0).map((s) => ({ s, to: `/students/${s.student.id}/studio`, text: `Portfolio draft · ${s.unverified} ${s.unverified === 1 ? 'claim needs' : 'claims need'} teacher verification`, label: <VerifyLabel /> })),
    ...summaries.filter((s) => s.report.status === 'changes').map((s) => ({ s, to: `/students/${s.student.id}/studio`, text: s.report.comment?.text ?? 'Reviewer requested changes', label: <StatusLabel status="changes" /> })),
    ...summaries.filter((s) => s.lastObserved && daysAgo(s.lastObserved) >= 14).map((s) => ({ s, to: `/students/${s.student.id}/observe`, text: lastObservedLabel(s.lastObserved), label: <StatusLabel status={s.report.status} /> }))
  ];
  const recent = [...state.observations].filter((o) => o.term === 4).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const nameOf = (id: string) => STUDENTS.find((s) => s.id === id)!.name;

  return (
    <AppShell
      module="dashboard"
      mobileTitle="Dashboard"
      mobileSubtitle={`${CLASS_NAME} · ${TERM}`}
      mobileActions={<Link className="btn btn-primary btn-block" to="/students/aria/observe"><Icon name="plus" size={18} />Add observation</Link>}
    >
      {(bp) => (
        <div className="page">
          <div className="page-title-row">
            <div className="grow">
              <h1 className="h1">Good morning, {TEACHER}</h1>
              <p className="sec muted num">Wednesday, 22 Oct 2026 · {CLASS_NAME} · {TERM}</p>
            </div>
            {bp !== 'mobile' && <Link className="btn btn-primary" to="/students/aria/observe"><Icon name="plus" size={18} />Add observation</Link>}
          </div>
          <div className="grid-main-side">
            <div className="stack" style={{ gap: 24 }}>
              <section className="card" aria-labelledby="ar-h" style={{ overflow: 'hidden' }}>
                <div className="card-head"><h2 id="ar-h" className="h2 grow">Action required</h2><span className="cap muted">{actions.length} items</span></div>
                {actions.length === 0 && <p className="sec muted" style={{ padding: '0 20px 20px' }}>Nothing needs you right now.</p>}
                {actions.map(({ s, to, text, label }, i) => (
                  <Link key={i} className="row-link" to={to}>
                    <Avatar initials={s.student.initials} />
                    <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="strong">{s.student.name}</span>
                      <span className="sec muted">{text}</span>
                    </span>
                    {bp !== 'mobile' && label}
                    <Icon name="chevronRight" />
                  </Link>
                ))}
              </section>
              <section className="card card-pad stack" aria-labelledby="rp-h">
                <div className="row"><h2 id="rp-h" className="h2 grow">Reports · {TERM}</h2><Link className="btn btn-ghost" to="/students">View students</Link></div>
                <ul style={{ display: 'grid', gridTemplateColumns: bp === 'mobile' ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
                  {counts.map(({ st, n }) => (
                    <li key={st} className="stack" style={{ gap: 8, padding: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <StatusLabel status={st} />
                      <span className="sec num"><span className="strong">{n}</span> {n === 1 ? 'student' : 'students'}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <div className="stack" style={{ gap: 24 }}>
              <section className="card card-pad stack" aria-labelledby="cw-h">
                <h2 id="cw-h" className="h2">Continue where you left off</h2>
                <div className="row"><Avatar initials="AT" /><span className="grow" style={{ display: 'flex', flexDirection: 'column' }}><span className="strong">Aria Tan · portfolio</span><span className="sec muted">{state.reports.aria.status === 'draft' ? 'Draft' : 'Report'} · {TERM}</span></span></div>
                <Link className="btn btn-secondary" to="/students/aria/studio" style={{ alignSelf: 'flex-start' }}>Open AI Portfolio Studio</Link>
              </section>
              <section className="card" aria-labelledby="ro-h" style={{ overflow: 'hidden' }}>
                <div className="card-head"><h2 id="ro-h" className="h2 grow">Recent observations</h2></div>
                {recent.map((o) => (
                  <Link key={o.id} className="row-link" to={`/students/${o.studentId}`}>
                    <span className="grow stack" style={{ gap: 4 }}>
                      <span className="row"><SourceChip id={o.id} /><span className="cap muted num">{formatDate(o.date)}</span></span>
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
