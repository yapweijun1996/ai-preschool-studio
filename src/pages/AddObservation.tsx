import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { Avatar, Notice, SourceChip } from '../components/ui';
import { CLASS_NAME, TODAY } from '../data/demo';
import { DOMAINS, MILESTONES, TERM4_END, TERM4_START, type DomainKey, type Milestone } from '../framework';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { useDirtyGuard } from '../pwa';
import { usePortfolio } from '../store/PortfolioContext';
import { studentSummary } from '../store/selectors';
import { useVisit } from '../hooks/useNavMemory';
import { NotFound } from './NotFound';
import { useRole } from '../roles/RoleContext';

function openPicker(el: HTMLInputElement) {
  try {
    el.showPicker?.();
  } catch {
    /* not allowed without a user gesture, or unsupported: the input still takes typed dates */
  }
}

type Phase = { kind: 'editing' } | { kind: 'saving' } | { kind: 'saved'; id: string } | { kind: 'failed' };

const TIPS = ['tip1', 'tip2', 'tip3'] as const;

// Prefilled demo text is teacher content, not UI copy: it stays as written.
const DEMO_TEXT = 'Sorted 12 shells into “big” and “small” groups at the nature table, then pointed and said “this group has more”.';

type Form = { date: string; domain: DomainKey; milestone: Milestone; text: string };
const formKey = (f: Form) => JSON.stringify([f.date, f.domain, f.milestone, f.text.trim()]);

export function AddObservation() {
  const { id = '' } = useParams();
  const { t, fmtDate } = useI18n();
  const { domainShort, milestone: milestoneLabel, term: periodLabel, termShort } = useLabels();
  const { state, dispatch } = usePortfolio();
  const role = useRole();
  const [date, setDate] = useState(TODAY);
  const [domain, setDomain] = useState<DomainKey>('ma');
  const [milestone, setMilestone] = useState<Milestone>('developing');
  const [text, setText] = useState(DEMO_TEXT);
  const [phase, setPhase] = useState<Phase>({ kind: 'editing' });
  // The form as first shown (prefilled demo), last saved, or last cleared: only changes from it are unsaved work.
  const [baseline, setBaseline] = useState(() => formKey({ date: TODAY, domain: 'ma', milestone: 'developing', text: DEMO_TEXT }));
  const [error, setError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const sum = studentSummary(state, id);
  useVisit(id, !!sum);
  // Unsaved work: a non-empty observation the teacher changed and has not saved yet.
  const dirty = phase.kind !== 'saved' && text.trim().length > 0 && formKey({ date, domain, milestone, text }) !== baseline;
  useDirtyGuard(dirty);
  if (!sum) return <NotFound />;
  const { student } = sum;
  const demo = t('common.demoStudent');
  const term = periodLabel(4);
  const firstName = student.name.split(' ')[0];

  if (!role.can('observation.add')) {
    return <AppShell module="observations" mobileTitle={t('pages.observation.title')}>
      {() => <div className="page"><Notice tone="info" icon="lock" role="status">
        <p className="body-text">{t('shell.roles.observationBlocked')}</p>
        <button className="btn btn-secondary" type="button" onClick={() => role.setRole('teacher')}>{t('shell.roles.switchTeacher')}</button>
      </Notice></div>}
    </AppShell>;
  }

  // Observations can be dated up to today, and never past the end of Term 4.
  const lastDay = TODAY < TERM4_END ? TODAY : TERM4_END;
  const save = () => {
    if (phase.kind === 'saving' || phase.kind === 'saved') return;
    // The picker limits the range, but a typed or cleared date must not slip through.
    // Show every problem at once; focus the first one.
    const badDate = !date || date < TERM4_START || date > lastDay;
    const shortText = text.trim().length < 10;
    setDateError(badDate);
    setError(shortText);
    if (badDate) document.getElementById('obs-date')?.focus();
    else if (shortText) textRef.current?.focus();
    if (badDate || shortText) return;
    setPhase({ kind: 'saving' });
    window.setTimeout(() => {
      if (state.sim.saveFail) {
        setPhase({ kind: 'failed' });
        return;
      }
      const newId = `OBS-${String(state.nextObsNumber).padStart(4, '0')}`;
      const saved = text.trim();
      dispatch({ type: 'addObservation', obs: { studentId: id, date, domain, milestone, text: saved, hasPhoto: false, term: 4 } });
      setBaseline(formKey({ date, domain, milestone, text: saved }));
      setPhase({ kind: 'saved', id: newId });
    }, 800);
  };

  const saveButton = (block?: boolean) => (
    <button className={`btn btn-primary${block ? ' grow' : ''}`} type="button" onClick={save} aria-disabled={phase.kind === 'saving' || phase.kind === 'saved'}>
      {phase.kind === 'saving' ? <><Icon name="loader" size={18} className="spin" />{t('pages.observation.saving')}</> : t('pages.observation.save')}
    </button>
  );

  return (
    <AppShell
      module="observations"
      currentStudentId={id}
      crumbs={[{ label: t('shell.module.students'), to: '/students' }, { label: student.name, to: `/students/${id}` }, { label: t('pages.observation.title') }]}
      mobileTitle={t('pages.observation.title')}
      mobileSubtitle={`${student.name} · ${demo}`}
      mobileBack={`/students/${id}`}
      mobileActions={<><Link className="btn btn-secondary" to={`/students/${id}`}>{t('pages.shared.cancel')}</Link>{saveButton(true)}</>}
    >
      {(bp) => (
        <>
          {bp !== 'mobile' && (
            <div className="page-head">
              <Link className="icon-btn" to={`/students/${id}`} aria-label={t('pages.shared.backToProfileOf', { name: student.name })} title={t('pages.shared.backToProfile')}><Icon name="arrowLeft" /></Link>
              <div className="grow">
                <h1 className="h1">{t('pages.observation.title')}</h1>
                <p className="sec muted">{student.name} · {demo} · {CLASS_NAME} · {term}</p>
              </div>
              {phase.kind === 'editing' && dirty && <span className="save-state">{t('pages.shared.unsavedChanges')}</span>}
              {phase.kind === 'saved' && <span className="save-state" role="status"><Icon name="check" size={16} className="ic-primary" />{t('pages.shared.saved')}</span>}
              {phase.kind === 'failed' && <span className="status st-failed"><Icon name="alertCircle" size={14} />{t('pages.shared.saveFailed')}</span>}
              <Link className="btn btn-secondary" to={`/students/${id}`}>{t('pages.shared.cancel')}</Link>
              {saveButton()}
            </div>
          )}
          <div className="page" style={{ maxWidth: 1240 }}>
            <div className="grid-main-side" style={{ gridTemplateColumns: bp === 'mobile' ? undefined : 'minmax(0, 1fr) 320px' }}>
              <div className="stack" style={{ gap: 16 }}>
                {phase.kind === 'failed' && (
                  <Notice tone="danger" icon="alertCircle" role="alert">
                    <p className="semibold">{t('pages.shared.saveFailed')}</p>
                    <p className="body-text">{t('pages.observation.failedBody')}</p>
                    <button className="btn btn-secondary" type="button" onClick={save} style={{ alignSelf: 'flex-start' }}>
                      <Icon name="undo" size={18} />{t('pages.shared.retry')}
                    </button>
                  </Notice>
                )}
                {phase.kind === 'saved' && (
                  <Notice tone="success" icon="check" role="status">
                    <p className="semibold">{t('pages.observation.savedAs')} <SourceChip id={phase.id} /></p>
                    <p className="body-text">{t('pages.observation.savedBody', { name: firstName })}</p>
                    <div className="row">
                      <Link className="btn btn-secondary" to={`/students/${id}/progress`}>{t('pages.observation.viewProgress')}</Link>
                      <button className="btn btn-ghost" type="button" onClick={() => { setPhase({ kind: 'editing' }); setText(''); setBaseline(formKey({ date, domain, milestone, text: '' })); }}>{t('pages.observation.addAnother')}</button>
                    </div>
                  </Notice>
                )}
                <section className="card card-pad stack" style={{ gap: 24 }}>
                  <div className="grid-2">
                    <div className="field">
                      <span className="field-label">{t('pages.observation.student')}</span>
                      <div className="row" style={{ minHeight: 44, padding: '0 12px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-muted)', flexWrap: 'nowrap' }}>
                        <Avatar initials={student.initials} size="sm" /><span>{student.name}</span><span className="cap">{demo}</span>
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="obs-date">{t('pages.observation.date')}</label>
                      {/* Shown in the app's date format; the native picker opens on click, Enter or Space. */}
                      <div className="input date-field">
                        <span className="num grow" aria-hidden="true">{date ? fmtDate(date) : ''}</span>
                        <Icon name="calendar" size={18} />
                        <input
                          id="obs-date"
                          className="date-native"
                          type="date"
                          value={date}
                          min={TERM4_START}
                          max={lastDay}
                          onChange={(e) => { setDate(e.target.value); setDateError(false); }}
                          aria-invalid={dateError}
                          aria-describedby={dateError ? 'obs-date-error' : undefined}
                          onClick={(e) => openPicker(e.currentTarget)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(e.currentTarget); } }}
                        />
                      </div>
                      {dateError && <p id="obs-date-error" className="sec" style={{ color: 'var(--color-danger)' }}><Icon name="alertCircle" size={14} /> {t('pages.observation.dateRange', { term: termShort(4), from: fmtDate(TERM4_START), to: fmtDate(lastDay) })}</p>}
                    </div>
                  </div>
                  <fieldset>
                    <legend className="field-label">{t('pages.observation.domain')}</legend>
                    <div className="chip-row" role="radiogroup" aria-label={t('pages.observation.domain')}>
                      {DOMAINS.map((d) => (
                        <button key={d.key} className="chip" type="button" role="radio" aria-checked={domain === d.key} onClick={() => setDomain(d.key)}>{domainShort(d.key)}</button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="field">
                    <label className="field-label" htmlFor="obs-text">{t('pages.observation.what')}</label>
                    <p id="obs-help" className="sec muted">{t('pages.observation.help')}</p>
                    <textarea ref={textRef} id="obs-text" className="input" rows={5} value={text} onChange={(e) => { setText(e.target.value); if (phase.kind === 'saved') setPhase({ kind: 'editing' }); }} aria-describedby={error ? 'obs-help obs-error' : 'obs-help'} aria-invalid={error} />
                    {error && <p id="obs-error" className="sec" style={{ color: 'var(--color-danger)' }}><Icon name="alertCircle" size={14} /> {t('pages.observation.tooShort')}</p>}
                  </div>
                  <fieldset>
                    <legend className="field-label">{t('pages.observation.milestone')}</legend>
                    <div role="radiogroup" aria-label={t('pages.observation.milestone')} style={{ display: 'grid', gridTemplateColumns: bp === 'mobile' ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                      {MILESTONES.map((m) => (
                        <button key={m.key} className="chip" type="button" role="radio" aria-checked={milestone === m.key} onClick={() => setMilestone(m.key)} style={{ minHeight: 72, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 8, padding: '12px 16px', whiteSpace: 'normal', textAlign: 'left' }}>
                          <span className="dots" aria-hidden="true">{[1, 2, 3].map((i) => <span key={i} className={`dot${i <= m.filled ? ' on' : ''}`} />)}</span>
                          <span>{milestoneLabel(m.key)}</span>
                        </button>
                      ))}
                    </div>
                    <p className="cap muted" style={{ marginTop: 8 }}>{t('pages.observation.milestoneHelp')}</p>
                  </fieldset>
                  <div className="field">
                    <span className="field-label">{t('pages.observation.photo')}</span>
                    <div className="ph" style={{ flexDirection: 'column', gap: 8, padding: 20, minHeight: 120 }}>
                      <Icon name="image" size={24} />
                      <span className="sec">{t('pages.observation.photoHelp')}</span>
                    </div>
                  </div>
                </section>
              </div>
              {bp !== 'mobile' && (
                <aside className="card card-pad stack" aria-labelledby="tips-h">
                  <h2 id="tips-h" className="h2">{t('pages.observation.tipsHeading')}</h2>
                  <ul className="sec stack" style={{ gap: 10 }}>
                    {TIPS.map((k) => (
                      <li key={k} className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><Icon name="check" size={16} className="ic-primary" /><span>{t(`pages.observation.${k}`)}</span></li>
                    ))}
                  </ul>
                  <p className="cap muted">{t('pages.observation.idNote')}</p>
                </aside>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
