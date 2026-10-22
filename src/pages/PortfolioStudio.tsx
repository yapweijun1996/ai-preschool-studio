import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { AiPanel, type AiState } from '../components/studio/AiPanel';
import { EvidencePanel } from '../components/studio/EvidencePanel';
import { NarrativePanel } from '../components/studio/NarrativePanel';
import { Avatar, Notice, SaveIndicator, StatusLabel, VerifyLabel } from '../components/ui';
import { CLASS_NAME, TERM } from '../data/demo';
import { useAutosave } from '../hooks/useAutosave';
import { ProviderUnavailableError, requestSuggestion, type AiAction } from '../services/mockProvider';
import { usePortfolio } from '../store/PortfolioContext';
import { observationsFor, unverifiedClaims } from '../store/reducer';
import { studentSummary } from '../store/selectors';
import { NotFound } from './NotFound';

type MobileTab = 'evidence' | 'write' | 'ai';

export function PortfolioStudio() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = usePortfolio();
  const sum = studentSummary(state, id);
  const paragraphs = state.paragraphs[id] ?? [];
  const [targetId, setTargetId] = useState('p-se');
  const [ai, setAi] = useState<AiState>({ kind: 'idle' });
  const [variant, setVariant] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [drawer, setDrawer] = useState<'evidence' | 'ai' | null>('ai');
  const [tab, setTab] = useState<MobileTab>('write');
  const requestSeq = useRef(0);

  const [reflection, setReflection] = useState(state.reflections[id] ?? '');
  const persist = useCallback((text: string) => dispatch({ type: 'setReflection', studentId: id, text }), [dispatch, id]);
  const { status: saveStatus, retry } = useAutosave(reflection, persist, state.sim.saveFail);

  const run = useCallback(
    async (action: AiAction, paragraphId: string, v: number) => {
      const paragraph = (state.paragraphs[id] ?? []).find((p) => p.id === paragraphId);
      if (!paragraph) return;
      const seq = ++requestSeq.current;
      setAi({ kind: 'loading', action });
      try {
        const s = await requestSuggestion({ paragraph, action, variant: v, available: !state.sim.aiDown });
        if (seq !== requestSeq.current) return;
        setAi(s ? { kind: 'ready', suggestion: s } : { kind: 'none', action });
      } catch (e) {
        if (seq !== requestSeq.current) return;
        if (e instanceof ProviderUnavailableError) setAi({ kind: 'unavailable', action });
        else throw e;
      }
    },
    [id, state.paragraphs, state.sim.aiDown]
  );

  // Open with one suggestion so the teacher sees how AI edits are proposed.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || paragraphs.length === 0) return;
    started.current = true;
    void run('clearer', 'p-se', 0);
  }, [paragraphs.length, run]);

  if (!sum) return <NotFound />;
  const { student, report } = sum;
  const observations = observationsFor(state, id);
  const claims = unverifiedClaims(state, id);
  const linkedIds = new Set(paragraphs.flatMap((p) => p.sentences.flatMap((s) => s.sources)));
  const locked = report.status === 'approved';
  const pendingId = ai.kind === 'ready' ? ai.suggestion.paragraphId : ai.kind === 'loading' ? targetId : undefined;
  const appliedId = ai.kind === 'applied' ? ai.previous.id : undefined;

  const request = (action: AiAction) => {
    if (ai.kind === 'loading' || locked) return;
    setVariant(0);
    void run(action, targetId, 0);
  };
  const regenerate = () => {
    if (!('suggestion' in ai)) return;
    const next = variant + 1;
    setVariant(next);
    void run(ai.suggestion.action, ai.suggestion.paragraphId, next);
  };
  const apply = () => {
    if (ai.kind !== 'ready') return;
    const previous = paragraphs.find((p) => p.id === ai.suggestion.paragraphId)!;
    dispatch({ type: 'applySuggestion', studentId: id, suggestion: ai.suggestion });
    setAi({ kind: 'applied', suggestion: ai.suggestion, previous });
  };
  const undo = () => {
    if (ai.kind !== 'applied') return;
    dispatch({ type: 'restoreParagraph', studentId: id, paragraph: ai.previous });
    setAi({ kind: 'ready', suggestion: ai.suggestion });
  };
  const submit = () => {
    dispatch({ type: 'submitForReview', studentId: id });
    navigate(`/students/${id}/report`);
  };

  const evidence = (headerless?: boolean) => (
    <EvidencePanel studentId={id} observations={observations} linkedIds={linkedIds} selected={selected} onSelect={setSelected} headerless={headerless} />
  );
  const narrative = (headerless?: boolean) =>
    paragraphs.length === 0 ? (
      <div className="panel-body">
        <div className="empty">
          <div className="state-icon"><Icon name="fileText" size={24} /></div>
          <p className="strong">No narrative drafted yet</p>
          <p className="sec muted">In this demo, Aria Tan has a full draft. Add observations first; the narrative cites them as evidence.</p>
          <Link className="btn btn-secondary" to="/students/aria/studio">Open Aria Tan’s draft</Link>
        </div>
      </div>
    ) : (
      <NarrativePanel
        headerless={headerless}
        paragraphs={paragraphs}
        milestones={student.term4}
        observations={observations}
        pendingParagraphId={pendingId}
        appliedParagraphId={appliedId}
        locked={locked}
        reflection={reflection}
        onReflection={setReflection}
        onLink={(sentenceId, obsId) => dispatch({ type: 'linkSource', studentId: id, sentenceId, obsId })}
        onRemove={(sentenceId) => dispatch({ type: 'removeSentence', studentId: id, sentenceId })}
        onUndo={undo}
      />
    );
  const assistant = (headerless?: boolean) => (
    <AiPanel
      headerless={headerless}
      ai={ai}
      paragraphs={paragraphs}
      targetId={targetId}
      onTarget={setTargetId}
      onRequest={request}
      onApply={apply}
      onReject={() => ai.kind === 'ready' && setAi({ kind: 'rejected', suggestion: ai.suggestion })}
      onRegenerate={regenerate}
      claims={claims}
      locked={locked}
    />
  );

  const statusNotice =
    report.status === 'approved' ? (
      <Notice tone="success" icon="lock"><p className="body-text">This report is approved and locked. Editing is turned off.</p></Notice>
    ) : report.status === 'changes' && report.comment ? (
      <Notice tone="warning" icon="alert"><p className="body-text"><span className="semibold">Changes requested by {report.comment.by}:</span> {report.comment.text}</p></Notice>
    ) : null;

  return (
    <AppShell
      module="students"
      mobileTitle={student.name}
      mobileSubtitle={`Portfolio · ${TERM}`}
      mobileBack={`/students/${id}`}
      mobileTrailing={<StatusLabel status={report.status} />}
      mobileActions={
        <>
          <Link className="btn btn-secondary" to={`/students/${id}/report`}>Preview</Link>
          <button className="btn btn-primary grow" type="button" onClick={submit} aria-disabled={locked || report.status === 'review'}>Submit for review</button>
        </>
      }
    >
      {(bp) => (
        <>
          {bp !== 'mobile' && (
            <div className="page-head">
              <Link className="icon-btn" to={`/students/${id}`} aria-label={`Back to ${student.name}'s profile`} title="Back to profile"><Icon name="arrowLeft" /></Link>
              {bp === 'desktop' && <Avatar initials={student.initials} />}
              <div className="grow">
                <h1 className="h1">AI Portfolio Studio</h1>
                <p className="sec muted">{student.name} · Demo student · {CLASS_NAME} · {TERM}</p>
              </div>
              <div className="row">
                <StatusLabel status={report.status} />
                {claims.length > 0 && <VerifyLabel>{claims.length} {claims.length === 1 ? 'claim needs' : 'claims need'} teacher verification</VerifyLabel>}
                <SaveIndicator status={saveStatus} onRetry={retry} />
                {bp === 'tablet' && (
                  <>
                    <button className="chip" type="button" aria-pressed={drawer === 'evidence'} onClick={() => setDrawer(drawer === 'evidence' ? null : 'evidence')}><Icon name="clipboard" size={18} />Evidence</button>
                    <button className="chip" type="button" aria-pressed={drawer === 'ai'} onClick={() => setDrawer(drawer === 'ai' ? null : 'ai')}><Icon name="sparkles" size={18} />AI Assistant</button>
                  </>
                )}
                {bp === 'desktop' && <Link className="btn btn-secondary" to={`/students/${id}/report`}><Icon name="eye" size={18} />Preview PDF</Link>}
                <button className="btn btn-primary" type="button" onClick={submit} aria-disabled={locked || report.status === 'review'}>Submit for review</button>
              </div>
            </div>
          )}

          {bp === 'desktop' && (
            <>
              {statusNotice && <div style={{ padding: '16px 24px 0' }}>{statusNotice}</div>}
              <div className="studio-cols">
                <section className="panel col-evidence" aria-labelledby="ev-h">{evidence()}</section>
                <section className="panel col-narrative" aria-labelledby="nar-h">{narrative()}</section>
                <section className="panel col-ai" aria-labelledby="ai-h">{assistant()}</section>
              </div>
            </>
          )}

          {bp === 'tablet' && (
            <>
            {statusNotice && <div style={{ padding: '16px 24px 0' }}>{statusNotice}</div>}
            <div className="studio-tablet" style={{ flexDirection: drawer === 'evidence' ? 'row-reverse' : 'row' }}>
              <section className="panel" aria-labelledby="nar-h">{narrative()}</section>
              {drawer && (
                <aside className="panel drawer" aria-label={drawer === 'ai' ? 'AI Assistant' : 'Evidence'}>
                  <div className="panel-head">
                    <div className="grow">
                      {drawer === 'ai' ? <div className="row"><h2 className="h2">AI Assistant</h2><span className="status st-draft">Mock provider</span></div> : <h2 className="h2">Evidence</h2>}
                    </div>
                    <button className="icon-btn" type="button" onClick={() => setDrawer(null)} aria-label={`Close ${drawer === 'ai' ? 'AI Assistant' : 'Evidence'}`}><Icon name="x" /></button>
                  </div>
                  {drawer === 'ai' ? assistant(true) : evidence(true)}
                </aside>
              )}
            </div>
            </>
          )}

          {bp === 'mobile' && (
            <div className="studio-mobile">
              <div style={{ padding: '8px 16px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="seg" role="tablist" aria-label="Studio sections">
                  {(['evidence', 'write', 'ai'] as MobileTab[]).map((t) => (
                    <button key={t} className="seg-btn" type="button" role="tab" aria-selected={tab === t} aria-controls="studio-tabpanel" onClick={() => setTab(t)}>
                      {t === 'evidence' ? 'Evidence' : t === 'write' ? 'Write' : 'AI'}
                    </button>
                  ))}
                </div>
              </div>
              <div id="studio-tabpanel" role="tabpanel" className="stack" style={{ gap: 0 }}>
                {statusNotice && <div style={{ padding: '16px 16px 0' }}>{statusNotice}</div>}
                <div className="row" style={{ padding: '12px 16px 0' }}><SaveIndicator status={saveStatus} onRetry={retry} /></div>
                {tab === 'evidence' && evidence(true)}
                {tab === 'write' && narrative(true)}
                {tab === 'ai' && (
                  <>
                    <div className="row" style={{ padding: '16px 16px 0' }}><h2 className="h2">AI Assistant</h2><span className="status st-draft">Mock provider</span></div>
                    {assistant(true)}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
