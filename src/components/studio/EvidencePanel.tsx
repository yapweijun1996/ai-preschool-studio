import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DOMAINS, domainShort, formatDate, type DomainKey, type Observation } from '../../data/demo';
import { Icon } from '../Icon';
import { SourceChip } from '../ui';

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
  const [filter, setFilter] = useState<DomainKey | 'all'>('all');
  const [query, setQuery] = useState('');
  const list = observations
    .filter((o) => (filter === 'all' || o.domain === filter) && o.text.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      {!headerless && (
        <div className="panel-head">
          <div className="grow">
            <h2 id="ev-h" className="h2">Evidence</h2>
            <p className="cap muted">{observations.length} {observations.length === 1 ? 'observation' : 'observations'} · Term 4</p>
          </div>
          <Link className="btn btn-primary" to={`/students/${studentId}/observe`}><Icon name="plus" size={18} />Add observation</Link>
        </div>
      )}
      <div className="panel-body" style={{ gap: 12 }}>
        {observations.length === 0 ? (
          <div className="empty">
            <div className="state-icon"><Icon name="clipboard" size={24} /></div>
            <p className="strong">No observations in Term 4 yet</p>
            <p className="sec muted">Observations you add become evidence the narrative can cite.</p>
            {headerless && <Link className="btn btn-primary" to={`/students/${studentId}/observe`}><Icon name="plus" size={18} />Add observation</Link>}
          </div>
        ) : (
          <>
            <div className="search-wrap">
              <label className="sr-only" htmlFor="ev-search">Search evidence</label>
              <Icon name="search" />
              <input id="ev-search" className="input" type="search" placeholder="Search evidence" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="chip-row scroll" role="group" aria-label="Filter by domain">
              <button className="chip" type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
              {DOMAINS.map((d) => (
                <button key={d.key} className="chip" type="button" aria-pressed={filter === d.key} onClick={() => setFilter(d.key)}>{d.short}</button>
              ))}
            </div>
            {list.length === 0 && <p className="sec muted" role="status">No evidence matches this filter.</p>}
            {list.map((o) => {
              const linked = linkedIds.has(o.id);
              return (
                <button key={o.id} type="button" className="ev-card" aria-pressed={selected === o.id} onClick={() => onSelect(o.id)}>
                  <span className="row"><SourceChip id={o.id} /><span className="cap muted num">{formatDate(o.date)}</span></span>
                  <span className="cap muted">{domainShort(o.domain)}</span>
                  <span className="sec">{o.text}</span>
                  {o.hasPhoto && <span className="ph" style={{ width: '100%', height: 72 }}><Icon name="image" size={18} />Photo placeholder</span>}
                  {linked ? (
                    <span className="cap row" style={{ gap: 4, color: 'var(--color-primary-hover)' }}><Icon name="check" size={14} />Linked in narrative</span>
                  ) : (
                    <span className="cap muted">Not linked yet</span>
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
