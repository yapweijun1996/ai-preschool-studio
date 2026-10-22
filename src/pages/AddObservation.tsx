import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { Avatar, Notice, SourceChip } from '../components/ui';
import { CLASS_NAME, DOMAINS, MILESTONES, TERM, TODAY, type DomainKey, type Milestone } from '../data/demo';
import { usePortfolio } from '../store/PortfolioContext';
import { studentSummary } from '../store/selectors';
import { NotFound } from './NotFound';

type Phase = { kind: 'editing' } | { kind: 'saving' } | { kind: 'saved'; id: string } | { kind: 'failed' };

export function AddObservation() {
  const { id = '' } = useParams();
  const { state, dispatch } = usePortfolio();
  const [date, setDate] = useState(TODAY);
  const [domain, setDomain] = useState<DomainKey>('ma');
  const [milestone, setMilestone] = useState<Milestone>('developing');
  const [text, setText] = useState('Sorted 12 shells into “big” and “small” groups at the nature table, then pointed and said “this group has more”.');
  const [phase, setPhase] = useState<Phase>({ kind: 'editing' });
  const [error, setError] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const sum = studentSummary(state, id);
  if (!sum) return <NotFound />;
  const { student } = sum;

  const save = () => {
    if (phase.kind === 'saving' || phase.kind === 'saved') return;
    if (text.trim().length < 10) {
      setError('Describe what you observed in at least one sentence.');
      textRef.current?.focus();
      return;
    }
    setError('');
    setPhase({ kind: 'saving' });
    window.setTimeout(() => {
      if (state.sim.saveFail) {
        setPhase({ kind: 'failed' });
        return;
      }
      const newId = `OBS-${String(state.nextObsNumber).padStart(4, '0')}`;
      dispatch({ type: 'addObservation', obs: { studentId: id, date, domain, milestone, text: text.trim(), hasPhoto: false, term: 4 } });
      setPhase({ kind: 'saved', id: newId });
    }, 800);
  };

  const saveButton = (block?: boolean) => (
    <button className={`btn btn-primary${block ? ' grow' : ''}`} type="button" onClick={save} aria-disabled={phase.kind === 'saving' || phase.kind === 'saved'}>
      {phase.kind === 'saving' ? <><Icon name="loader" size={18} className="spin" />Saving…</> : 'Save observation'}
    </button>
  );

  return (
    <AppShell
      module="observations"
      mobileTitle="Add observation"
      mobileSubtitle={`${student.name} · Demo student`}
      mobileBack={`/students/${id}`}
      mobileActions={<><Link className="btn btn-secondary" to={`/students/${id}`}>Cancel</Link>{saveButton(true)}</>}
    >
      {(bp) => (
        <>
          {bp !== 'mobile' && (
            <div className="page-head">
              <Link className="icon-btn" to={`/students/${id}`} aria-label={`Back to ${student.name}'s profile`} title="Back to profile"><Icon name="arrowLeft" /></Link>
              <div className="grow">
                <h1 className="h1">Add observation</h1>
                <p className="sec muted">{student.name} · Demo student · {CLASS_NAME} · {TERM}</p>
              </div>
              {phase.kind === 'editing' && <span className="save-state">Unsaved changes</span>}
              {phase.kind === 'saved' && <span className="save-state" role="status"><Icon name="check" size={16} className="ic-primary" />Saved</span>}
              {phase.kind === 'failed' && <span className="status st-failed"><Icon name="alertCircle" size={14} />Save failed</span>}
              <Link className="btn btn-secondary" to={`/students/${id}`}>Cancel</Link>
              {saveButton()}
            </div>
          )}
          <div className="page" style={{ maxWidth: 1240 }}>
            <div className="grid-main-side" style={{ gridTemplateColumns: bp === 'mobile' ? undefined : 'minmax(0, 1fr) 320px' }}>
              <div className="stack" style={{ gap: 16 }}>
                {phase.kind === 'failed' && (
                  <Notice tone="danger" icon="alertCircle" role="alert">
                    <p className="semibold">Save failed</p>
                    <p className="body-text">We couldn’t save this observation. Your text is still here. Check your connection and retry.</p>
                    <button className="btn btn-secondary" type="button" onClick={save} style={{ alignSelf: 'flex-start' }}>
                      <Icon name="undo" size={18} />Retry
                    </button>
                  </Notice>
                )}
                {phase.kind === 'saved' && (
                  <Notice tone="success" icon="check" role="status">
                    <p className="semibold">Observation saved as <SourceChip id={phase.id} /></p>
                    <p className="body-text">It now counts as evidence for {student.name.split(' ')[0]}’s learning progress and portfolio.</p>
                    <div className="row">
                      <Link className="btn btn-secondary" to={`/students/${id}/progress`}>View learning progress</Link>
                      <button className="btn btn-ghost" type="button" onClick={() => { setPhase({ kind: 'editing' }); setText(''); }}>Add another</button>
                    </div>
                  </Notice>
                )}
                <section className="card card-pad stack" style={{ gap: 24 }}>
                  <div className="grid-2">
                    <div className="field">
                      <span className="field-label">Student</span>
                      <div className="row" style={{ minHeight: 44, padding: '0 12px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-muted)', flexWrap: 'nowrap' }}>
                        <Avatar initials={student.initials} size="sm" /><span>{student.name}</span><span className="cap muted">Demo student</span>
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="obs-date">Date observed</label>
                      <input id="obs-date" className="input num" type="date" value={date} max={TODAY} onChange={(e) => setDate(e.target.value)} />
                    </div>
                  </div>
                  <fieldset>
                    <legend className="field-label">Learning domain</legend>
                    <div className="chip-row" role="radiogroup" aria-label="Learning domain">
                      {DOMAINS.map((d) => (
                        <button key={d.key} className="chip" type="button" role="radio" aria-checked={domain === d.key} onClick={() => setDomain(d.key)}>{d.short}</button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="field">
                    <label className="field-label" htmlFor="obs-text">What did you observe?</label>
                    <p id="obs-help" className="sec muted">Describe what the child did and said. Keep judgements out; the milestone below carries them.</p>
                    <textarea ref={textRef} id="obs-text" className="input" rows={5} value={text} onChange={(e) => { setText(e.target.value); if (phase.kind === 'saved') setPhase({ kind: 'editing' }); }} aria-describedby={error ? 'obs-help obs-error' : 'obs-help'} aria-invalid={!!error} />
                    {error && <p id="obs-error" className="sec" style={{ color: 'var(--color-danger)' }}><Icon name="alertCircle" size={14} /> {error}</p>}
                  </div>
                  <fieldset>
                    <legend className="field-label">Milestone</legend>
                    <div role="radiogroup" aria-label="Milestone" style={{ display: 'grid', gridTemplateColumns: bp === 'mobile' ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                      {MILESTONES.map((m) => (
                        <button key={m.key} className="chip" type="button" role="radio" aria-checked={milestone === m.key} onClick={() => setMilestone(m.key)} style={{ minHeight: 72, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 8, padding: '12px 16px', whiteSpace: 'normal', textAlign: 'left' }}>
                          <span className="dots" aria-hidden="true">{[1, 2, 3].map((i) => <span key={i} className={`dot${i <= m.filled ? ' on' : ''}`} />)}</span>
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="cap muted" style={{ marginTop: 8 }}>Milestones are descriptive — no scores, percentages or rankings.</p>
                  </fieldset>
                  <div className="field">
                    <span className="field-label">Photo (optional)</span>
                    <div className="ph" style={{ flexDirection: 'column', gap: 8, padding: 20, minHeight: 120 }}>
                      <Icon name="image" size={24} />
                      <span className="sec">Demo mode: placeholders only. Do not upload real child photos.</span>
                    </div>
                  </div>
                </section>
              </div>
              {bp !== 'mobile' && (
                <aside className="card card-pad stack" aria-labelledby="tips-h">
                  <h2 id="tips-h" className="h2">Strong evidence</h2>
                  <ul className="sec stack" style={{ gap: 10 }}>
                    {['Quote what the child said, in the language they used.', 'Note the setting: circle time, block corner, snack.', 'One moment per observation keeps source chips precise.'].map((t) => (
                      <li key={t} className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><Icon name="check" size={16} className="ic-primary" /><span>{t}</span></li>
                    ))}
                  </ul>
                  <p className="cap muted">Each saved observation gets an ID (OBS-xxxx) that the portfolio narrative cites as its source.</p>
                </aside>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
