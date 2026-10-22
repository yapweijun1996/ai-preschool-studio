import { Fragment } from 'react';
import type { Paragraph, Sentence } from '../../data/demo';
import { useI18n } from '../../i18n';
import { useLabels } from '../../i18n/labels';
import { AI_ACTION_LABEL, type AiAction, type Suggestion } from '../../services/mockProvider';
import type { UnverifiedClaim } from '../../store/reducer';
import { Icon } from '../Icon';
import { MockProviderLabel, Notice, SourceChip, VerifyLabel } from '../ui';

export type AiState =
  | { kind: 'idle' }
  | { kind: 'loading'; action: AiAction }
  | { kind: 'ready'; suggestion: Suggestion }
  | { kind: 'applied'; suggestion: Suggestion; previous: Paragraph }
  | { kind: 'rejected'; suggestion: Suggestion }
  | { kind: 'none'; action: AiAction }
  | { kind: 'unavailable'; action: AiAction };

const ACTIONS = Object.keys(AI_ACTION_LABEL) as AiAction[];

function Sentences({ items }: { items: Sentence[] }) {
  return (
    <>
      {items.map((s) => (
        <Fragment key={s.id}>
          {s.text}
          {s.sources.map((src) => (
            <Fragment key={src}> <SourceChip id={src} /></Fragment>
          ))}{' '}
        </Fragment>
      ))}
    </>
  );
}

export function AiPanel({
  ai,
  paragraphs,
  targetId,
  onTarget,
  onRequest,
  onApply,
  onReject,
  onRegenerate,
  claims,
  locked,
  headerless
}: {
  ai: AiState;
  paragraphs: Paragraph[];
  targetId: string;
  onTarget: (id: string) => void;
  onRequest: (action: AiAction) => void;
  onApply: () => void;
  onReject: () => void;
  onRegenerate: () => void;
  claims: UnverifiedClaim[];
  locked: boolean;
  headerless?: boolean;
}) {
  const { t } = useI18n();
  const { domainFull } = useLabels();
  const actionLabel = (a: AiAction) => t(`pages.studio.ai.actions.${a}`);
  const target = paragraphs.find((p) => p.id === targetId);
  const busy = ai.kind === 'loading';
  const suggestion = 'suggestion' in ai ? ai.suggestion : undefined;
  const sources = suggestion ? Array.from(new Set(suggestion.after.flatMap((s) => s.sources))) : [];

  return (
    <>
      {!headerless && (
        <div className="panel-head">
          <div className="grow">
            <div className="row"><h2 id="ai-h" className="h2">{t('pages.studio.aiAssistant')}</h2><MockProviderLabel /></div>
            <p className="cap muted">{t('pages.studio.ai.sub')}</p>
          </div>
        </div>
      )}
      {ai.kind === 'unavailable' ? (
        <div className="panel-body" style={{ alignItems: 'flex-start' }}>
          <div className="state-icon"><Icon name="cloudOff" size={24} /></div>
          <p className="strong" role="alert">{t('pages.studio.ai.unavailable')}</p>
          <p className="sec">{t('pages.studio.ai.unavailableBody')}</p>
          <button className="btn btn-secondary" type="button" onClick={() => onRequest(ai.action)}><Icon name="refresh" size={18} />{t('pages.studio.ai.tryAgain')}</button>
          <p className="cap muted">{t('pages.studio.ai.paused')}</p>
        </div>
      ) : (
        <div className="panel-body">
          <div className="field">
            <label className="field-label" htmlFor="ai-target">{t('pages.studio.ai.paragraph')}</label>
            <select id="ai-target" className="input" value={targetId} onChange={(e) => onTarget(e.target.value)} disabled={busy || locked}>
              {paragraphs.map((p) => <option key={p.id} value={p.id}>{domainFull(p.domain)}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {ACTIONS.map((a) => (
              <button key={a} className="btn btn-secondary" type="button" onClick={() => onRequest(a)} aria-disabled={busy || locked || !target}>
                {actionLabel(a)}
              </button>
            ))}
          </div>

          {ai.kind === 'loading' && (
            <div className="card card-pad stack" role="status" aria-live="polite">
              <span className="save-state"><Icon name="loader" size={16} className="spin" />{t('pages.studio.ai.asking', { action: actionLabel(ai.action) })}</span>
              <div className="skel" style={{ height: 14 }} />
              <div className="skel" style={{ height: 14, width: '90%' }} />
              <div className="skel" style={{ height: 14, width: '70%' }} />
            </div>
          )}

          {ai.kind === 'none' && <p className="sec muted" role="status">{t('pages.studio.ai.none')}</p>}

          {suggestion && ai.kind !== 'applied' && (
            <div className="card card-pad stack">
              <div>
                <p className="sec semibold">{t('pages.studio.ai.suggestion', { action: actionLabel(suggestion.action) })}</p>
                <p className="cap muted">{domainFull(paragraphs.find((p) => p.id === suggestion.paragraphId)?.domain ?? 'en')}</p>
              </div>
              {ai.kind === 'ready' && (
                <>
                  <div className="diff" aria-label={t('pages.studio.ai.proposed')}>
                    <p className="diff-line diff-del"><span className="diff-sign" aria-hidden="true">−</span><span><span className="sr-only">{t('pages.studio.ai.remove')}</span><del><Sentences items={suggestion.before} /></del></span></p>
                    <p className="diff-line diff-ins"><span className="diff-sign" aria-hidden="true">+</span><span><span className="sr-only">{t('pages.studio.ai.add')}</span><ins><Sentences items={suggestion.after} /></ins></span></p>
                  </div>
                  <div className="row" style={{ gap: 6 }}><span className="cap muted">{t('pages.studio.ai.sources')}</span>{sources.map((s) => <SourceChip key={s} id={s} />)}</div>
                  {!locked && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                      <button className="btn btn-primary" type="button" onClick={onApply} style={{ gridColumn: 'span 2' }}><Icon name="check" size={18} />{t('pages.studio.ai.apply')}</button>
                      <button className="btn btn-secondary" type="button" onClick={onReject}><Icon name="x" size={18} />{t('pages.studio.ai.reject')}</button>
                      <button className="btn btn-ghost" type="button" onClick={onRegenerate}><Icon name="refresh" size={18} />{t('pages.studio.ai.regenerate')}</button>
                    </div>
                  )}
                </>
              )}
              {ai.kind === 'rejected' && (
                <>
                  <p className="sec" role="status">{t('pages.studio.ai.rejected')}</p>
                  <button className="btn btn-secondary" type="button" onClick={onRegenerate} style={{ alignSelf: 'flex-start' }}><Icon name="refresh" size={18} />{t('pages.studio.ai.regenerate')}</button>
                </>
              )}
            </div>
          )}
          {ai.kind === 'applied' && (
            <Notice tone="success" icon="check" role="status">
              <p className="body-text">{t('pages.studio.ai.applied', { domain: domainFull(ai.previous.domain) })}</p>
            </Notice>
          )}

          <div className="card card-pad stack" style={{ gap: 8 }}>
            <p className="sec semibold">{t('pages.studio.ai.claimCheck')}</p>
            {claims.length === 0 ? (
              <p className="sec row" style={{ gap: 6 }}><Icon name="check" size={16} className="ic-primary" />{t('pages.studio.ai.allLinked')}</p>
            ) : (
              claims.map((c) => (
                <div key={c.sentence.id} className="stack" style={{ gap: 6 }}>
                  <VerifyLabel />
                  <p className="sec">“{c.sentence.text}” — {domainFull(paragraphs.find((p) => p.id === c.paragraphId)!.domain)}</p>
                </div>
              ))
            )}
            <p className="cap muted">{t('pages.studio.ai.claimNote')}</p>
          </div>
        </div>
      )}
      <div className="panel-foot">
        <p className="cap muted">{t('pages.studio.ai.footnote')}</p>
      </div>
    </>
  );
}
