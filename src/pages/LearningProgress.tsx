import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { StudentTabs } from '../components/StudentTabs';
import { MilestoneDots, Notice, SourceChip } from '../components/ui';
import { DOMAINS, MILESTONES } from '../data/demo';
import { usePortfolio } from '../store/PortfolioContext';
import { observationsFor } from '../store/reducer';
import { studentSummary } from '../store/selectors';
import { useVisit } from '../hooks/useNavMemory';
import { NotFound } from './NotFound';

// Teacher-written change notes for the demo student; other students show a neutral line.
const NOTES: Record<string, Record<string, string>> = {
  aria: {
    en: 'Now retells familiar stories in order without picture prompts.',
    zh: 'Joins group songs and names familiar animals in 华语.',
    ma: 'Same milestone; counting has extended from 10 to 18 objects.',
    se: 'Takes turns in block play and is beginning to name feelings.'
  }
};

const label = (m: string) => MILESTONES.find((x) => x.key === m)!.label;

export function LearningProgress() {
  const { id = '' } = useParams();
  const { state } = usePortfolio();
  const sum = studentSummary(state, id);
  useVisit(id, !!sum);
  if (!sum) return <NotFound />;
  const { student } = sum;
  const t4 = observationsFor(state, id, 4);
  const t3 = observationsFor(state, id, 3);

  return (
    <AppShell
      module="students"
      currentStudentId={id}
      mobileTitle="Learning progress"
      mobileSubtitle={`${student.name} · Term 3 vs Term 4`}
      mobileBack={`/students/${id}`}
      mobileActions={<Link className="btn btn-primary btn-block" to={`/students/${id}/studio`}>Open AI Portfolio Studio</Link>}
    >
      {(bp) => (
        <div className="page">
          <div className="row" style={{ gap: 16 }}>
            {bp !== 'mobile' && <Link className="icon-btn" to={`/students/${id}`} aria-label={`Back to ${student.name}'s profile`} title="Back"><Icon name="arrowLeft" /></Link>}
            <div className="grow">
              {bp !== 'mobile' && <h1 className="h1">Learning progress</h1>}
              <p className="sec muted">{student.name} · Demo student · 2026 Term 3 compared with 2026 Term 4</p>
            </div>
            {bp !== 'mobile' && <Link className="btn btn-primary" to={`/students/${id}/studio`}>Open AI Portfolio Studio</Link>}
          </div>
          <StudentTabs id={id} active="progress" />
          <div className="row" style={{ gap: 20 }} aria-label="Milestone key">
            <span className="sec semibold">Milestones</span>
            {MILESTONES.map((m) => <MilestoneDots key={m.key} milestone={m.key} />)}
            <span className="cap muted">Descriptions of observed learning — not scores or rankings.</span>
          </div>
          <section className="card" aria-label="Term 3 and Term 4 comparison" style={{ overflow: 'hidden' }}>
            {bp !== 'mobile' && (
              <div className="table-head" aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1.6fr', gap: 16 }}>
                <span>Domain</span><span>2026 Term 3</span><span>2026 Term 4</span><span>What changed, in the teacher’s words</span>
              </div>
            )}
            {DOMAINS.map((d) => {
              const sources = t4.filter((o) => o.domain === d.key).map((o) => o.id);
              const n3 = t3.filter((o) => o.domain === d.key).length;
              const n4 = sources.length;
              const before = student.term3[d.key];
              const after = student.term4[d.key];
              const note = NOTES[id]?.[d.key] ?? (before === after ? `Still ${label(after)}.` : `Moved from ${label(before)} to ${label(after)}.`);
              return (
                <div key={d.key} style={{ display: 'grid', gridTemplateColumns: bp === 'mobile' ? '1fr 1fr' : '1.3fr 1fr 1fr 1.6fr', gap: 16, padding: 20, borderTop: '1px solid var(--color-border)', alignItems: 'start' }}>
                  <h2 className="strong" style={{ gridColumn: bp === 'mobile' ? '1 / -1' : undefined }}>{d.full}</h2>
                  <div className="stack" style={{ gap: 6 }}>
                    <span className={bp === 'mobile' ? 'cap muted' : 'sr-only'}>Term 3</span>
                    <MilestoneDots milestone={before} />
                    {n3 > 0 && <span className="cap muted num">{n3} {n3 === 1 ? 'observation' : 'observations'}</span>}
                  </div>
                  <div className="stack" style={{ gap: 6 }}>
                    <span className={bp === 'mobile' ? 'cap muted' : 'sr-only'}>Term 4</span>
                    <MilestoneDots milestone={after} />
                    {n4 > 0 && <span className="cap muted num">{n4} {n4 === 1 ? 'observation' : 'observations'}</span>}
                  </div>
                  <div className="stack" style={{ gap: 8, gridColumn: bp === 'mobile' ? '1 / -1' : undefined }}>
                    <p className="sec">{note}</p>
                    {sources.length > 0 && <span className="row" style={{ gap: 6 }}>{sources.map((s) => <SourceChip key={s} id={s} />)}</span>}
                  </div>
                </div>
              );
            })}
          </section>
          <Notice tone="info" icon="info">
            <p className="body-text">Term 4 milestones flow into the portfolio narrative. Each sentence there must cite an observation, or it is flagged “Needs teacher verification”.</p>
          </Notice>
        </div>
      )}
    </AppShell>
  );
}
