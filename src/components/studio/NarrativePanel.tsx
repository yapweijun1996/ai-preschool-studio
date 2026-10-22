import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { TEACHER, type Observation, type Paragraph } from '../../data/demo';
import { type Milestone, type DomainKey } from '../../framework';
import { useI18n } from '../../i18n';
import { useLabels } from '../../i18n/labels';
import { Icon } from '../Icon';
import { MilestoneDots, SourceChip, VerifyLabel } from '../ui';

export interface NarrativeProps {
  paragraphs: Paragraph[];
  milestones: Record<DomainKey, Milestone | null>;
  observations: Observation[];
  pendingParagraphId?: string;
  appliedParagraphId?: string;
  /** Wording locked (in review or approved). */
  locked: boolean;
  /** Evidence linking locked (approved only): a reviewer can still clear a claim during review. */
  linkLocked: boolean;
  reflection: string;
  onReflection: (text: string) => void;
  onLink: (sentenceId: string, obsId: string) => void;
  onRemove: (sentenceId: string) => void;
  onUndo: () => void;
  /** Domains with no sentence yet; each either fills from observations or needs one first. */
  missing: { domain: DomainKey; hasObs: boolean }[];
  onFill: () => void;
  observeHref: string;
  headerless?: boolean;
}

export function NarrativePanel(p: NarrativeProps) {
  const { t } = useI18n();
  const { domainFull, termShort } = useLabels();
  return (
    <>
      {!p.headerless && (
        <div className="panel-head">
          <div className="grow">
            <h2 id="nar-h" className="h2">{t('pages.studio.nar.heading')}</h2>
            <p className="cap muted">{t('pages.studio.nar.sub')}</p>
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
              {isPending && <p className="cap" style={{ marginTop: 6, color: 'var(--color-info)' }}>{t('pages.studio.nar.waiting')}</p>}
              {isApplied && (
                <div className="row" style={{ marginTop: 6 }}>
                  <span className="cap muted">{t('pages.studio.nar.appliedFrom')}</span>
                  <button className="btn btn-ghost" type="button" onClick={p.onUndo}><Icon name="undo" size={18} />{t('pages.studio.nar.undo')}</button>
                </div>
              )}
              {flagged.map((s) => {
                const candidates = p.observations.filter((o) => o.domain === para.domain).slice(0, 2);
                return (
                  <div key={s.id} className="notice notice-warning" data-claim tabIndex={-1} style={{ marginTop: 12, flexDirection: 'column', gap: 8 }}>
                    <VerifyLabel />
                    <p className="body-text">{t('pages.studio.nar.noLink', { text: s.text })}</p>
                    {!p.linkLocked && (
                      <div className="row">
                        {candidates.map((c) => (
                          <button key={c.id} className="btn btn-secondary" type="button" onClick={() => p.onLink(s.id, c.id)}>
                            <Icon name="link" size={18} />{t('pages.studio.nar.link', { id: c.id })}
                          </button>
                        ))}
                        {!p.locked && <button className="btn btn-ghost" type="button" onClick={() => p.onRemove(s.id)}>{t('pages.studio.nar.removeClaim')}</button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </article>
          );
        })}
        {p.missing.map((m) => (
          <article key={`missing-${m.domain}`} className="notice notice-warning missing-domain" style={{ flexDirection: 'column', gap: 8 }}>
            <p className="strong">{domainFull(m.domain)} · {t('pages.studio.nar.missingTitle')}</p>
            {m.hasObs ? (
              !p.locked && <button className="btn btn-secondary" type="button" onClick={p.onFill} style={{ alignSelf: 'flex-start' }}>{t('pages.studio.nar.fillMissing')}</button>
            ) : (
              <>
                <p className="body-text">{t('pages.studio.nar.missingNoObs', { term: termShort(4) })}</p>
                {!p.locked && <Link className="btn btn-secondary" to={p.observeHref} style={{ alignSelf: 'flex-start' }}><Icon name="plus" size={18} />{t('pages.shared.addObservation')}</Link>}
              </>
            )}
          </article>
        ))}
        <article>
          <div className="domain-head">
            <h3 className="strong"><label htmlFor="reflection">{t('pages.studio.nar.reflection')}</label></h3>
            <span className="cap muted">{t('pages.studio.nar.writtenBy', { name: TEACHER })}</span>
          </div>
          <textarea id="reflection" className="input narr" rows={4} value={p.reflection} readOnly={p.locked} onChange={(e) => p.onReflection(e.target.value)} />
        </article>
      </div>
    </>
  );
}
