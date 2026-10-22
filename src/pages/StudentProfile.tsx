import { Link, useParams } from 'react-router-dom';
import { useNavMemory, useVisit } from '../hooks/useNavMemory';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { StudentTabs } from '../components/StudentTabs';
import { Avatar, MilestoneDots, SourceChip, StatusLabel, VerifyLabel } from '../components/ui';
import { CLASS_NAME, DOMAINS, TEACHER, TERM, domainShort, formatDate, lastObservedLabel } from '../data/demo';
import { usePortfolio } from '../store/PortfolioContext';
import { observationsFor } from '../store/reducer';
import { studentSummary } from '../store/selectors';
import { NotFound } from './NotFound';

export function StudentProfile() {
  const { id = '' } = useParams();
  const { state } = usePortfolio();
  const sum = studentSummary(state, id);
  const { isPinned, togglePin } = useNavMemory();
  useVisit(id, !!sum);
  if (!sum) return <NotFound />;
  const pinned = isPinned(id);
  const { student, report } = sum;
  const obs = observationsFor(state, id).sort((a, b) => b.date.localeCompare(a.date));
  const byDomain = (k: string) => obs.filter((o) => o.domain === k);

  return (
    <AppShell
      module="students"
      currentStudentId={id}
      mobileTitle={student.name}
      mobileSubtitle={`${CLASS_NAME} · Demo student`}
      mobileBack="/students"
      mobileActions={
        <>
          <Link className="icon-btn icon-btn-outline" to={`/students/${id}/observe`} aria-label="Add observation" title="Add observation"><Icon name="plus" /></Link>
          <Link className="btn btn-primary grow" to={`/students/${id}/studio`}>Open AI Portfolio Studio</Link>
        </>
      }
    >
      {(bp) => (
        <div className="page">
          <div className="row" style={{ gap: 16 }}>
            {bp !== 'mobile' && <Link className="icon-btn" to="/students" aria-label="Back to My Students" title="Back"><Icon name="arrowLeft" /></Link>}
            <Avatar initials={student.initials} size="lg" label={`Photo placeholder for ${student.name}`} />
            <div className="grow">
              <div className="row">
                {bp !== 'mobile' && <h1 className="h1">{student.name}</h1>}
                <span className="status st-draft">Demo student</span>
              </div>
              <p className="sec muted">{CLASS_NAME} · Age {student.age} · {lastObservedLabel(sum.lastObserved)}</p>
            </div>
            <button className="icon-btn icon-btn-outline has-tip tip-below" type="button" aria-pressed={pinned} onClick={() => togglePin(id)} aria-label={pinned ? 'Unpin from sidebar' : 'Pin to sidebar'} data-tip={pinned ? 'Unpin from sidebar' : 'Pin to sidebar'}>
              <Icon name="pin" />
            </button>
            {bp !== 'mobile' && (
              <>
                <Link className="btn btn-secondary" to={`/students/${id}/observe`}><Icon name="plus" size={18} />Add observation</Link>
                <Link className="btn btn-primary" to={`/students/${id}/studio`}>Open AI Portfolio Studio</Link>
              </>
            )}
          </div>
          <StudentTabs id={id} active="overview" />
          <div className="grid-main-side">
            <section aria-labelledby="ld-h" className="stack" style={{ gap: 16 }}>
              <div className="row"><h2 id="ld-h" className="h2 grow">Learning domains · Term 4</h2><Link className="btn btn-secondary" to={`/students/${id}/progress`}><Icon name="compare" size={18} />Compare Term 3 and Term 4</Link></div>
              <div className="grid-2">
                {DOMAINS.map((d) => {
                  const list = byDomain(d.key);
                  return (
                    <article key={d.key} className="card card-pad stack">
                      <h3 className="strong">{d.full}</h3>
                      <MilestoneDots milestone={student.term4[d.key]} />
                      <p className="sec muted num">{list.length ? `${list.length} ${list.length === 1 ? 'observation' : 'observations'} · Last observed ${formatDate(list[0].date)}` : 'Observation details not seeded in this demo'}</p>
                    </article>
                  );
                })}
              </div>
              <p className="cap muted">Milestones describe what was observed: Emerging · Developing · Consistently demonstrated. They are not scores.</p>
              <section className="card" aria-labelledby="ro-h" style={{ overflow: 'hidden' }}>
                <div className="card-head"><h2 id="ro-h" className="h2 grow">Recent observations</h2></div>
                {obs.length === 0 ? (
                  <div className="empty">
                    <div className="state-icon"><Icon name="clipboard" size={24} /></div>
                    <p className="strong">No observations for {student.name.split(' ')[0]} in Term 4 yet</p>
                    <p className="sec muted">Observations you add become evidence the portfolio narrative can cite.</p>
                    <Link className="btn btn-primary" to={`/students/${id}/observe`}><Icon name="plus" size={18} />Add observation</Link>
                  </div>
                ) : (
                  obs.slice(0, 4).map((o) => (
                    <div key={o.id} className="row-link" style={{ alignItems: 'flex-start' }}>
                      <span className="grow stack" style={{ gap: 4 }}>
                        <span className="row"><SourceChip id={o.id} /><span className="cap muted num">{formatDate(o.date)} · {domainShort(o.domain)}</span></span>
                        <span className="sec">{o.text}</span>
                      </span>
                    </div>
                  ))
                )}
              </section>
            </section>
            <aside className="stack" style={{ gap: 16 }}>
              <section className="card card-pad stack" aria-labelledby="pr-h">
                <h2 id="pr-h" className="h2">Portfolio report</h2>
                <p className="sec muted">{TERM}</p>
                <div className="row">
                  <StatusLabel status={report.status} />
                  {sum.unverified > 0 && <VerifyLabel>{sum.unverified} {sum.unverified === 1 ? 'claim needs' : 'claims need'} teacher verification</VerifyLabel>}
                </div>
                <Link className="btn btn-secondary" to={`/students/${id}/report`} style={{ alignSelf: 'flex-start' }}><Icon name="eye" size={18} />Preview PDF</Link>
              </section>
              <section className="card card-pad stack" aria-labelledby="ab-h">
                <h2 id="ab-h" className="h2">About</h2>
                <dl className="sec" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
                  <dt className="muted">Class</dt><dd>{CLASS_NAME}</dd>
                  <dt className="muted">Home languages</dt><dd>{student.homeLanguages}</dd>
                  <dt className="muted">Key teacher</dt><dd>{TEACHER}</dd>
                  <dt className="muted">Photo</dt><dd>Placeholder only in demo mode</dd>
                </dl>
              </section>
            </aside>
          </div>
        </div>
      )}
    </AppShell>
  );
}
