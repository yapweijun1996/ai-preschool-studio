import { Fragment } from 'react';
import { domainFull, type Paragraph, type Sentence } from '../../data/demo';
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
  const target = paragraphs.find((p) => p.id === targetId);
  const busy = ai.kind === 'loading';
  const suggestion = 'suggestion' in ai ? ai.suggestion : undefined;
  const sources = suggestion ? Array.from(new Set(suggestion.after.flatMap((s) => s.sources))) : [];

  return (
    <>
      {!headerless && (
        <div className="panel-head">
          <div className="grow">
            <div className="row"><h2 id="ai-h" className="h2">AI Assistant</h2><MockProviderLabel /></div>
            <p className="cap muted">Suggestions only — nothing changes until you apply it.</p>
          </div>
        </div>
      )}
      {ai.kind === 'unavailable' ? (
        <div className="panel-body" style={{ alignItems: 'flex-start' }}>
          <div className="state-icon"><Icon name="cloudOff" size={24} /></div>
          <p className="strong" role="alert">AI Assistant unavailable</p>
          <p className="sec">The Mock provider did not respond. Your narrative is saved and you can keep writing without it.</p>
          <button className="btn btn-secondary" type="button" onClick={() => onRequest(ai.action)}><Icon name="refresh" size={18} />Try again</button>
          <p className="cap muted">Suggestions and Regenerate are paused until the provider responds. Turn off “Simulate AI unavailable” in More to recover.</p>
        </div>
      ) : (
        <div className="panel-body">
          <div className="field">
            <label className="field-label" htmlFor="ai-target">Paragraph</label>
            <select id="ai-target" className="input" value={targetId} onChange={(e) => onTarget(e.target.value)} disabled={busy || locked}>
              {paragraphs.map((p) => <option key={p.id} value={p.id}>{domainFull(p.domain)}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {(Object.keys(AI_ACTION_LABEL) as AiAction[]).map((a) => (
              <button key={a} className="btn btn-secondary" type="button" onClick={() => onRequest(a)} aria-disabled={busy || locked || !target}>
                {AI_ACTION_LABEL[a]}
              </button>
            ))}
          </div>

          {ai.kind === 'loading' && (
            <div className="card card-pad stack" role="status" aria-live="polite">
              <span className="save-state"><Icon name="loader" size={16} className="spin" />Asking Mock provider · {AI_ACTION_LABEL[ai.action]}…</span>
              <div className="skel" style={{ height: 14 }} />
              <div className="skel" style={{ height: 14, width: '90%' }} />
              <div className="skel" style={{ height: 14, width: '70%' }} />
            </div>
          )}

          {ai.kind === 'none' && <p className="sec muted" role="status">The Mock provider has no suggestion for this paragraph.</p>}

          {suggestion && ai.kind !== 'applied' && (
            <div className="card card-pad stack">
              <div>
                <p className="sec semibold">Suggestion · {AI_ACTION_LABEL[suggestion.action]}</p>
                <p className="cap muted">{domainFull(paragraphs.find((p) => p.id === suggestion.paragraphId)?.domain ?? 'en')}</p>
              </div>
              {ai.kind === 'ready' && (
                <>
                  <div className="diff" aria-label="Proposed change">
                    <p className="diff-line diff-del"><span className="diff-sign" aria-hidden="true">−</span><span><span className="sr-only">Remove: </span><del><Sentences items={suggestion.before} /></del></span></p>
                    <p className="diff-line diff-ins"><span className="diff-sign" aria-hidden="true">+</span><span><span className="sr-only">Add: </span><ins><Sentences items={suggestion.after} /></ins></span></p>
                  </div>
                  <div className="row" style={{ gap: 6 }}><span className="cap muted">Sources</span>{sources.map((s) => <SourceChip key={s} id={s} />)}</div>
                  {!locked && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                      <button className="btn btn-primary" type="button" onClick={onApply} style={{ gridColumn: 'span 2' }}><Icon name="check" size={18} />Apply</button>
                      <button className="btn btn-secondary" type="button" onClick={onReject}><Icon name="x" size={18} />Reject</button>
                      <button className="btn btn-ghost" type="button" onClick={onRegenerate}><Icon name="refresh" size={18} />Regenerate</button>
                    </div>
                  )}
                </>
              )}
              {ai.kind === 'rejected' && (
                <>
                  <p className="sec" role="status">Suggestion rejected. The paragraph is unchanged.</p>
                  <button className="btn btn-secondary" type="button" onClick={onRegenerate} style={{ alignSelf: 'flex-start' }}><Icon name="refresh" size={18} />Regenerate</button>
                </>
              )}
            </div>
          )}
          {ai.kind === 'applied' && (
            <Notice tone="success" icon="check" role="status">
              <p className="body-text">Applied to {domainFull(ai.previous.domain)}. You can undo it in the narrative.</p>
            </Notice>
          )}

          <div className="card card-pad stack" style={{ gap: 8 }}>
            <p className="sec semibold">Claim check</p>
            {claims.length === 0 ? (
              <p className="sec row" style={{ gap: 6 }}><Icon name="check" size={16} className="ic-primary" />Every claim in this draft links to evidence.</p>
            ) : (
              claims.map((c) => (
                <div key={c.sentence.id} className="stack" style={{ gap: 6 }}>
                  <VerifyLabel />
                  <p className="sec">“{c.sentence.text}” — {domainFull(paragraphs.find((p) => p.id === c.paragraphId)!.domain)}</p>
                </div>
              ))
            )}
            <p className="cap muted">Claim check runs on this device: every sentence must cite an observation.</p>
          </div>
        </div>
      )}
      <div className="panel-foot">
        <p className="cap muted">Mock provider returns fictional sample text. No live AI is connected.</p>
      </div>
    </>
  );
}
