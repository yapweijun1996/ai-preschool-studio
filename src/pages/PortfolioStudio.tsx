import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { AiPanel, type AiState } from '../components/studio/AiPanel';
import { EvidencePanel } from '../components/studio/EvidencePanel';
import { NarrativePanel } from '../components/studio/NarrativePanel';
import { Avatar, MockProviderLabel, Notice, SaveIndicator, StatusLabel, VerifyLabel } from '../components/ui';
import { CLASS_NAME } from '../data/demo';
import { useAutosave } from '../hooks/useAutosave';
import { useI18n } from '../i18n';
import { useDirtyGuard } from '../pwa';
import { ProviderUnavailableError, requestSuggestion, type AiAction } from '../services/mockProvider';
import { usePortfolio } from '../store/PortfolioContext';
import { observationsFor, unverifiedClaims } from '../store/reducer';
import { studentSummary } from '../store/selectors';
import { useVisit } from '../hooks/useNavMemory';
import { NotFound } from './NotFound';

type MobileTab = 'evidence' | 'write' | 'ai';

export function PortfolioStudio() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { state, dispatch } = usePortfolio();
  const sum = studentSummary(state, id);
  useVisit(id, !!sum);
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
  // Reflection edits not yet saved (unsaved, saving or failed) block PWA reloads.
  useDirtyGuard(saveStatus.kind !== 'saved');

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
  const term = t('common.term4');
  const demo = t('common.demoStudent');
  const submitLabel = t('pages.shared.submitForReview');
  const evidenceLabel = t('pages.studio.evidence');
  const aiLabel = t('pages.studio.aiAssistant');
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
          <p className="strong">{t('pages.studio.noNarrative')}</p>
          <p className="sec muted">{t('pages.studio.noNarrativeBody')}</p>
          <Link className="btn btn-secondary" to="/students/aria/studio">{t('pages.studio.openAriaDraft')}</Link>
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
      <Notice tone="success" icon="lock"><p className="body-text">{t('pages.studio.approvedLocked')}</p></Notice>
    ) : report.status === 'changes' && report.comment ? (
      <Notice tone="warning" icon="alert"><p className="body-text"><span className="semibold">{t('pages.studio.changesBy', { name: report.comment.by })}</span> {report.comment.text}</p></Notice>
    ) : null;

  return (
    <AppShell
      module="students"
      currentStudentId={id}
      mobileTitle={student.name}
      mobileSubtitle={t('pages.studio.mobileSubtitle', { term })}
      mobileBack={`/students/${id}`}
      mobileTrailing={<StatusLabel status={report.status} />}
      mobileActions={
        <>
          <Link className="btn btn-secondary" to={`/students/${id}/report`}>{t('pages.studio.preview')}</Link>
          <button className="btn btn-primary grow" type="button" onClick={submit} aria-disabled={locked || report.status === 'review'}>{submitLabel}</button>
        </>
      }
    >
      {(bp) => (
        <>
          {bp !== 'mobile' && (
            <div className="page-head">
              <Link className="icon-btn" to={`/students/${id}`} aria-label={t('pages.shared.backToProfileOf', { name: student.name })} title={t('pages.shared.backToProfile')}><Icon name="arrowLeft" /></Link>
              {bp === 'desktop' && <Avatar initials={student.initials} />}
              <div className="grow">
                <h1 className="h1">{t('pages.studio.title')}</h1>
                <p className="sec muted">{student.name} · {demo} · {CLASS_NAME} · {term}</p>
              </div>
              <div className="row">
                <StatusLabel status={report.status} />
                {claims.length > 0 && <VerifyLabel>{t('pages.shared.claims', { count: claims.length })}</VerifyLabel>}
                <SaveIndicator status={saveStatus} onRetry={retry} />
                {bp === 'tablet' && (
                  <>
                    <button className="chip" type="button" aria-pressed={drawer === 'evidence'} onClick={() => setDrawer(drawer === 'evidence' ? null : 'evidence')}><Icon name="clipboard" size={18} />{evidenceLabel}</button>
                    <button className="chip" type="button" aria-pressed={drawer === 'ai'} onClick={() => setDrawer(drawer === 'ai' ? null : 'ai')}><Icon name="sparkles" size={18} />{aiLabel}</button>
                  </>
                )}
                {bp === 'desktop' && <Link className="btn btn-secondary" to={`/students/${id}/report`}><Icon name="eye" size={18} />{t('pages.shared.previewPdf')}</Link>}
                <button className="btn btn-primary" type="button" onClick={submit} aria-disabled={locked || report.status === 'review'}>{submitLabel}</button>
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
                <aside className="panel drawer" aria-label={drawer === 'ai' ? aiLabel : evidenceLabel}>
                  <div className="panel-head">
                    <div className="grow">
                      {drawer === 'ai' ? <div className="row"><h2 className="h2">{aiLabel}</h2><MockProviderLabel /></div> : <h2 className="h2">{evidenceLabel}</h2>}
                    </div>
                    <button className="icon-btn" type="button" onClick={() => setDrawer(null)} aria-label={t('pages.studio.close', { panel: drawer === 'ai' ? aiLabel : evidenceLabel })}><Icon name="x" /></button>
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
                <div className="seg" role="tablist" aria-label={t('pages.studio.sectionsLabel')}>
                  {(['evidence', 'write', 'ai'] as MobileTab[]).map((tb) => (
                    <button key={tb} className="seg-btn" type="button" role="tab" aria-selected={tab === tb} aria-controls="studio-tabpanel" onClick={() => setTab(tb)}>
                      {tb === 'evidence' ? t('pages.studio.tabEvidence') : tb === 'write' ? t('pages.studio.tabWrite') : t('pages.studio.tabAi')}
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
                    <div className="row" style={{ padding: '16px 16px 0' }}><h2 className="h2">{aiLabel}</h2><MockProviderLabel /></div>
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
