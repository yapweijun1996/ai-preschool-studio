import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { AiPanel, type AiState } from '../components/studio/AiPanel';
import { EvidencePanel } from '../components/studio/EvidencePanel';
import { NarrativePanel } from '../components/studio/NarrativePanel';
import { ReadinessList } from '../components/ReportFlow';
import { Avatar, MockProviderLabel, Notice, SaveIndicator, StatusLabel, VerifyLabel } from '../components/ui';
import { CLASS_NAME, TODAY } from '../data/demo';
import { DOMAINS } from '../framework';
import { useAutosave } from '../hooks/useAutosave';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { useDirtyGuard } from '../pwa';
import { ProviderUnavailableError, requestSuggestion, type AiAction } from '../services/mockProvider';
import { usePortfolio } from '../store/PortfolioContext';
import { observationsFor, readiness, unverifiedClaims } from '../store/reducer';
import { milestonesFor, studentSummary } from '../store/selectors';
import { useVisit } from '../hooks/useNavMemory';
import { NotFound } from './NotFound';
import { useRole } from '../roles/RoleContext';
import { DEMO_ROLES } from '../roles';

type MobileTab = 'evidence' | 'write' | 'ai';

export function PortfolioStudio() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { term: periodLabel } = useLabels();
  const { state, dispatch } = usePortfolio();
  const role = useRole();
  const sum = studentSummary(state, id);
  useVisit(id, !!sum);
  const paragraphs = state.paragraphs[id] ?? [];
  const [chosenTarget, setTargetId] = useState('p-se');
  // Social-Emotional by default; otherwise the last paragraph this draft has.
  const targetId = paragraphs.some((p) => p.id === chosenTarget) ? chosenTarget : (paragraphs[paragraphs.length - 1]?.id ?? chosenTarget);
  const [ai, setAi] = useState<AiState>({ kind: 'idle' });
  const [variant, setVariant] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [drawer, setDrawer] = useState<'evidence' | 'ai' | null>('ai');
  const [tab, setTab] = useState<MobileTab>('write');
  const [whyBlocked, setWhyBlocked] = useState(false);
  // ?focus=claims (from the profile's report card) lands on the first claim needing verification.
  const [params] = useSearchParams();
  const focusClaims = params.get('focus') === 'claims';
  const requestSeq = useRef(0);

  const [reflection, setReflection] = useState(state.reflections[id] ?? '');
  const persist = useCallback((text: string) => dispatch({ type: 'setReflection', studentId: id, text }), [dispatch, id]);
  const { status: saveStatus, retry } = useAutosave(reflection, persist, state.sim.saveFail, undefined, (state.reflections[id] ?? '').trim().length > 0);
  // Reflection edits not yet saved (unsaved, saving or failed) block PWA reloads.
  useDirtyGuard(saveStatus.kind === 'unsaved' || saveStatus.kind === 'saving' || saveStatus.kind === 'failed');

  const run = useCallback(
    async (action: AiAction, paragraphId: string, v: number) => {
      const paragraph = (state.paragraphs[id] ?? []).find((p) => p.id === paragraphId);
      if (!paragraph) return;
      const seq = ++requestSeq.current;
      setAi({ kind: 'loading', action });
      try {
        const s = await requestSuggestion({ studentId: id, paragraph, action, variant: v, available: !state.sim.aiDown });
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
    void run('clearer', targetId, 0);
  }, [paragraphs.length, run, targetId]);

  useEffect(() => {
    if (!focusClaims) return;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[data-claim]');
      if (!el) return;
      // Scroll only the narrative panel when it scrolls on its own; otherwise the page.
      const box = el.closest<HTMLElement>('.panel-body');
      if (box && box.scrollHeight > box.clientHeight) box.scrollTop += el.getBoundingClientRect().top - box.getBoundingClientRect().top - 16;
      else el.scrollIntoView({ block: 'center' });
      el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [focusClaims]);

  if (!sum) return <NotFound />;
  const { student, report } = sum;
  const term = periodLabel(4);
  const demo = t('common.demoStudent');
  const submitLabel = t('pages.shared.submitForReview');
  const evidenceLabel = t('pages.studio.evidence');
  const aiLabel = t('pages.studio.aiAssistant');
  const observations = observationsFor(state, id);
  const claims = unverifiedClaims(state, id);
  const linkedIds = new Set(paragraphs.flatMap((p) => p.sentences.flatMap((s) => s.sources)));
  // Approved: frozen. In review: wording paused until the reviewer responds.
  const locked = report.status === 'approved' || report.status === 'review' || !role.can('draft.edit');
  const written = new Set(paragraphs.filter((p) => p.sentences.length > 0).map((p) => p.domain));
  const missing = DOMAINS.filter((d) => !written.has(d.key)).map((d) => ({ domain: d.key, hasObs: observations.some((o) => o.domain === d.key) }));
  const fill = () => dispatch({ type: 'fillMissingDomains', studentId: id });
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
  const ready = readiness(state, id);
  const canSubmit = !locked && report.status !== 'review' && report.status !== 'notStarted' && ready.canSubmit;
  const submit = () => {
    if (locked || report.status === 'review') return;
    // Not ready: say exactly what is missing instead of submitting.
    if (!ready.canSubmit) {
      setWhyBlocked(true);
      return;
    }
    dispatch({ type: 'submitForReview', studentId: id, submittedAt: TODAY });
    navigate(`/students/${id}/report`);
  };
  const submitButton = (cls: string) =>
    report.status === 'notStarted' ? null : (
      <button className={cls} type="button" onClick={submit} aria-disabled={!canSubmit} aria-describedby={whyBlocked && !ready.canSubmit ? 'why-blocked' : undefined}>{submitLabel}</button>
    );

  const evidence = (headerless?: boolean) => (
    <EvidencePanel studentId={id} observations={observations} linkedIds={linkedIds} selected={selected} onSelect={setSelected} headerless={headerless} />
  );
  const narrative = (headerless?: boolean) =>
    paragraphs.length === 0 ? (
      <div className="panel-body">
        {observations.length > 0 && report.status === 'notStarted' ? (
          <div className="empty">
            <div className="state-icon"><Icon name="fileText" size={24} /></div>
            <p className="strong">{t('pages.studio.startTitle')}</p>
            <p className="sec muted" style={{ maxWidth: '52ch' }}>{t('pages.studio.startBody', { count: observations.length })}</p>
            <button className="btn btn-primary" type="button" onClick={() => dispatch({ type: 'startDraft', studentId: id })}>{t('pages.studio.startDraft')}</button>
          </div>
        ) : observations.length === 0 ? (
          <div className="empty">
            <div className="state-icon"><Icon name="clipboard" size={24} /></div>
            <p className="strong">{t('pages.studio.noObsTitle')}</p>
            <p className="sec muted">{t('pages.studio.noObsBody')}</p>
            <Link className="btn btn-secondary" to={`/students/${id}/observe`}><Icon name="plus" size={18} />{t('pages.shared.addObservation')}</Link>
          </div>
        ) : (
          <div className="empty">
            <div className="state-icon"><Icon name="fileText" size={24} /></div>
            <p className="strong">{t('pages.studio.noNarrative')}</p>
            <p className="sec muted">{t('pages.studio.noNarrativeBody')}</p>
          </div>
        )}
      </div>
    ) : (
      <NarrativePanel
        headerless={headerless}
        paragraphs={paragraphs}
        milestones={milestonesFor(state, id, 4)}
        observations={observations}
        pendingParagraphId={pendingId}
        appliedParagraphId={appliedId}
        locked={locked}
        linkLocked={report.status === 'approved'}
        reflection={reflection}
        onReflection={setReflection}
        onLink={(sentenceId, obsId) => dispatch({ type: 'linkSource', studentId: id, sentenceId, obsId })}
        onRemove={(sentenceId) => dispatch({ type: 'removeSentence', studentId: id, sentenceId })}
        onUndo={undo}
        missing={missing}
        onFill={fill}
        observeHref={`/students/${id}/observe`}
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
    !role.can('draft.edit') ? (
      <Notice tone="info" icon="lock" role="status"><p className="body-text">{t('shell.roles.studioReadOnly', { role: t(DEMO_ROLES.find((item) => item.role === role.role)!.labelKey) })}</p></Notice>
    ) : whyBlocked && !ready.canSubmit && !locked ? (
      <Notice tone="warning" icon="lock" id="why-blocked" role="status">
        <p className="semibold">{t('pages.report.notReady')}</p>
        <p className="body-text">{t('pages.report.notReadyBody')}</p>
        <ReadinessList r={ready} />
        {missing.some((m) => m.hasObs) && <button className="btn btn-secondary" type="button" onClick={fill} style={{ alignSelf: 'flex-start' }}>{t('pages.studio.nar.fillMissing')}</button>}
      </Notice>
    ) : report.status === 'approved' ? (
      <Notice tone="success" icon="lock"><p className="body-text">{t('pages.studio.approvedLocked')}</p></Notice>
    ) : report.status === 'review' ? (
      <Notice tone="info" icon="lock"><p className="body-text">{t('pages.studio.reviewLocked')}</p></Notice>
    ) : report.status === 'changes' && report.comment ? (
      <Notice tone="warning" icon="alert"><p className="body-text"><span className="semibold">{t('pages.studio.changesBy', { name: report.comment.by })}</span> {report.comment.text}</p></Notice>
    ) : null;

  return (
    <AppShell
      module="students"
      focus
      currentStudentId={id}
      crumbs={[{ label: t('shell.module.students'), to: '/students' }, { label: student.name, to: `/students/${id}` }, { label: t('pages.studio.title') }]}
      mobileTitle={student.name}
      mobileSubtitle={t('pages.studio.mobileSubtitle', { term })}
      mobileBack={`/students/${id}`}
      mobileTrailing={<StatusLabel status={report.status} />}
      mobileActions={
        <>
          <Link className="btn btn-secondary" to={`/students/${id}/report`}>{t('pages.studio.preview')}</Link>
          {role.can('report.submit') && submitButton('btn btn-primary grow')}
        </>
      }
    >
      {(bp) => (
        <>
          {bp !== 'mobile' && (
            <div className="page-head studio-head">
              <Link className="icon-btn" to={`/students/${id}`} aria-label={t('pages.shared.backToProfileOf', { name: student.name })} title={t('pages.shared.backToProfile')}><Icon name="arrowLeft" /></Link>
              {bp === 'desktop' && <Avatar initials={student.initials} />}
              <div className="studio-title">
                <h1 className="h1">{t('pages.studio.title')}</h1>
                <p className="sec muted">{student.name} · {demo} · {CLASS_NAME} · {term}</p>
              </div>
              <div className="row">
                <StatusLabel status={report.status} />
                {claims.length > 0 && <VerifyLabel>{t('pages.shared.claims', { count: claims.length })}</VerifyLabel>}
                {paragraphs.length > 0 && <SaveIndicator status={saveStatus} onRetry={retry} />}
                {bp === 'tablet' && (
                  <>
                    <button className="chip" type="button" aria-pressed={drawer === 'evidence'} onClick={() => setDrawer(drawer === 'evidence' ? null : 'evidence')}><Icon name="clipboard" size={18} />{evidenceLabel}</button>
                    <button className="chip" type="button" aria-pressed={drawer === 'ai'} onClick={() => setDrawer(drawer === 'ai' ? null : 'ai')}><Icon name="sparkles" size={18} />{aiLabel}</button>
                  </>
                )}
                {bp === 'desktop' && <Link className="btn btn-secondary" to={`/students/${id}/report`}><Icon name="eye" size={18} />{t('pages.shared.previewPdf')}</Link>}
                {role.can('report.submit') && submitButton('btn btn-primary')}
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
                {paragraphs.length > 0 && <div className="row" style={{ padding: '12px 16px 0' }}><SaveIndicator status={saveStatus} onRetry={retry} /></div>}
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
