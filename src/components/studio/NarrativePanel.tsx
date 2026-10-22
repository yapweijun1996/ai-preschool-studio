import { Fragment } from 'react';
import { TEACHER, domainFull, type Milestone, type Observation, type Paragraph, type DomainKey } from '../../data/demo';
import { Icon } from '../Icon';
import { MilestoneDots, SourceChip, VerifyLabel } from '../ui';

export interface NarrativeProps {
  paragraphs: Paragraph[];
  milestones: Record<DomainKey, Milestone>;
  observations: Observation[];
  pendingParagraphId?: string;
  appliedParagraphId?: string;
  locked: boolean;
  reflection: string;
  onReflection: (text: string) => void;
  onLink: (sentenceId: string, obsId: string) => void;
  onRemove: (sentenceId: string) => void;
  onUndo: () => void;
  headerless?: boolean;
}

export function NarrativePanel(p: NarrativeProps) {
  return (
    <>
      {!p.headerless && (
        <div className="panel-head">
          <div className="grow">
            <h2 id="nar-h" className="h2">Narrative</h2>
            <p className="cap muted">Written by you. AI suggestions change nothing until you apply them.</p>
          </div>
        </div>
      )}
      <div className="panel-body narrative-body">
        {p.paragraphs.map((para) => {
          const flagged = para.sentences.filter((s) => s.sources.length === 0);
          const isPending = p.pendingParagraphId === para.id;
          const isApplied = p.appliedParagraphId === para.id;
          return (
            <article key={para.id} aria-labelledby={`h-${para.id}`}>
              <div className="domain-head">
                <h3 id={`h-${para.id}`} className="strong">{domainFull(para.domain)}</h3>
                <MilestoneDots milestone={p.milestones[para.domain]} />
              </div>
              <p className="narr">
                {para.sentences.map((s) => (
                  <Fragment key={s.id}>
                    {s.sources.length === 0 ? (
                      <mark className="flag">{s.text}</mark>
                    ) : (
                      <span className={isApplied ? 'applied' : isPending ? 'pending-target' : undefined}>{s.text}</span>
                    )}
                    {s.sources.map((src) => (
                      <Fragment key={src}> <SourceChip id={src} /></Fragment>
                    ))}{' '}
                  </Fragment>
                ))}
              </p>
              {isPending && <p className="cap" style={{ marginTop: 6, color: 'var(--color-info)' }}>Suggestion waiting in AI Assistant</p>}
              {isApplied && (
                <div className="row" style={{ marginTop: 6 }}>
                  <span className="cap muted">Applied from a Mock provider suggestion</span>
                  <button className="btn btn-ghost" type="button" onClick={p.onUndo}><Icon name="undo" size={18} />Undo</button>
                </div>
              )}
              {flagged.map((s) => {
                const candidates = p.observations.filter((o) => o.domain === para.domain).slice(0, 2);
                return (
                  <div key={s.id} className="notice notice-warning" style={{ marginTop: 12, flexDirection: 'column', gap: 8 }}>
                    <VerifyLabel />
                    <p className="body-text">“{s.text}” has no linked observation. Link evidence or remove the claim before review.</p>
                    {!p.locked && (
                      <div className="row">
                        {candidates.map((c) => (
                          <button key={c.id} className="btn btn-secondary" type="button" onClick={() => p.onLink(s.id, c.id)}>
                            <Icon name="link" size={18} />Link {c.id}
                          </button>
                        ))}
                        <button className="btn btn-ghost" type="button" onClick={() => p.onRemove(s.id)}>Remove claim</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </article>
          );
        })}
        <article>
          <div className="domain-head">
            <h3 className="strong"><label htmlFor="reflection">Teacher reflection</label></h3>
            <span className="cap muted">Written by {TEACHER} · not AI-generated</span>
          </div>
          <textarea id="reflection" className="input narr" rows={4} value={p.reflection} readOnly={p.locked} onChange={(e) => p.onReflection(e.target.value)} />
        </article>
      </div>
    </>
  );
}
