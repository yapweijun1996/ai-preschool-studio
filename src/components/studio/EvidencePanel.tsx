import { useState } from 'react';
import { Link } from 'react-router-dom';
import { type Observation } from '../../data/demo';
import { DOMAINS, type DomainKey } from '../../framework';
import { useI18n } from '../../i18n';
import { useLabels } from '../../i18n/labels';
import { Icon } from '../Icon';
import { EmptyIllustration, PhotoIllustration } from '../EmptyIllustration';
import { ScrollRow, SourceChip } from '../ui';

export function EvidencePanel({
  studentId,
  observations,
  linkedIds,
  selected,
  onSelect,
  headerless
}: {
  studentId: string;
  observations: Observation[];
  linkedIds: Set<string>;
  selected?: string;
  onSelect: (id: string) => void;
  headerless?: boolean;
}) {
  const { t, fmtDate } = useI18n();
  const { domainShort, termShort } = useLabels();
  const [filter, setFilter] = useState<DomainKey | 'all'>('all');
  const [query, setQuery] = useState('');
  const list = observations
    .filter((o) => (filter === 'all' || o.domain === filter) && o.text.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));
  const addLabel = t('pages.shared.addObservation');

  return (
    <>
      {!headerless && (
        <div className="panel-head">
          <div className="grow">
            <h2 id="ev-h" className="h2">{t('pages.studio.evidence')}</h2>
            <p className="cap muted">{t('pages.studio.ev.count', { count: observations.length, term: termShort(4) })}</p>
          </div>
          <Link className="btn btn-primary" to={`/students/${studentId}/observe`}><Icon name="plus" size={18} />{addLabel}</Link>
        </div>
      )}
      <div className="panel-body" style={{ gap: 12 }}>
        {observations.length === 0 ? (
          <div className="empty">
            <EmptyIllustration name="no-observations" />
            <p className="strong">{t('pages.studio.ev.empty', { term: termShort(4) })}</p>
            <p className="sec muted">{t('pages.studio.ev.emptyBody')}</p>
            {headerless && <Link className="btn btn-primary" to={`/students/${studentId}/observe`}><Icon name="plus" size={18} />{addLabel}</Link>}
          </div>
        ) : (
          <>
            <div className="search-wrap">
              <label className="sr-only" htmlFor="ev-search">{t('pages.studio.ev.search')}</label>
              <Icon name="search" />
              <input id="ev-search" className="input" type="search" placeholder={t('pages.studio.ev.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <ScrollRow className="chip-row scroll" role="group" aria-label={t('pages.studio.ev.filterLabel')}>
              <button className="chip" type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{t('pages.shared.all')}</button>
              {DOMAINS.map((d) => (
                <button key={d.key} className="chip" type="button" aria-pressed={filter === d.key} onClick={() => setFilter(d.key)}>{domainShort(d.key)}</button>
              ))}
            </ScrollRow>
            {list.length === 0 && <div className="empty" role="status"><EmptyIllustration name="no-results" /><p className="sec muted">{t('pages.studio.ev.noMatch')}</p></div>}
            {list.map((o) => {
              const linked = linkedIds.has(o.id);
              return (
                <button key={o.id} type="button" className="ev-card" aria-pressed={selected === o.id} onClick={() => onSelect(o.id)}>
                  <span className="row"><SourceChip id={o.id} /><span className="cap muted num">{fmtDate(o.date)}</span></span>
                  <span className="cap muted">{domainShort(o.domain)}</span>
                  <span className="sec">{o.text}</span>
                  {o.hasPhoto && <PhotoIllustration domain={o.domain} id={o.id} />}
                  {linked ? (
                    <span className="cap row" style={{ gap: 4, color: 'var(--color-primary-hover)' }}><Icon name="check" size={14} />{t('pages.studio.ev.linked')}</span>
                  ) : (
                    <span className="cap muted">{t('pages.studio.ev.notLinked')}</span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
