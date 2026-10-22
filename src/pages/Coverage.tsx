import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { Avatar, Notice } from '../components/ui';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { useRole } from '../roles/RoleContext';
import { usePortfolio, useDataPort } from '../store/PortfolioContext';
import type { CoverageStatus } from '../coverage';
import { DOMAINS } from '../framework';
import type { TKey } from '../i18n';

type Filter = 'all' | 'attention' | 'missing' | 'stale';

export function Coverage() {
  const role = useRole();
  if (!role.can('coverage.view')) return <AccessDenied />;
  return <CoverageContent />;
}

function AccessDenied() {
  const { t } = useI18n();
  const role = useRole();
  return <AppShell module="students" mobileTitle={t('pages.coverage.title')}>
    {() => <div className="page"><Notice tone="info" icon="lock" role="status">
      <p className="body-text">{t('shell.roles.dataAccessBlocked')}</p>
      <div className="row"><Link className="btn btn-secondary" to="/">{t('pages.report.backToDashboard')}</Link>
        <button className="btn btn-secondary" type="button" onClick={() => role.setRole('teacher')}>{t('shell.roles.switchTeacher')}</button></div>
    </Notice></div>}
  </AppShell>;
}

function CoverageContent() {
  const { t, fmtDate } = useI18n();
  const labels = useLabels();
  const role = useRole();
  const { state } = usePortfolio();
  const dataPort = useDataPort();
  const [term, setTerm] = useState<3 | 4>(4);
  const [filter, setFilter] = useState<Filter>('all');
  const [coverage, setCoverage] = useState<Awaited<ReturnType<typeof dataPort.getCoverage>>>();
  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    void dataPort.getCoverage(term).then(setCoverage).catch(() => setFailed(true));
  };
  useEffect(load, [dataPort, state, term]);

  const visible = useMemo(() => (coverage?.students ?? []).filter((student) => {
    if (filter === 'attention') return student.attentionAreas > 0;
    if (filter === 'missing' || filter === 'stale') return student.areas.some((area) => area.status === filter);
    return true;
  }), [coverage, filter]);
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('pages.coverage.all') },
    { key: 'attention', label: t('pages.coverage.attention') },
    { key: 'missing', label: t('pages.coverage.missingFilter') },
    { key: 'stale', label: t('pages.coverage.staleFilter') }
  ];
  const statusKeys: Record<CoverageStatus, TKey> = {
    missing: 'pages.coverage.statusMissing', thin: 'pages.coverage.statusThin', stale: 'pages.coverage.statusStale', ok: 'pages.coverage.statusOk'
  };
  const statusLabel = (status: CoverageStatus) => t(statusKeys[status]);
  const domainLabel = labels.domainShort;

  return (
    <AppShell module="students" crumbs={[{ label: t('shell.module.students'), to: '/students' }, { label: t('pages.coverage.title') }]} mobileTitle={t('pages.coverage.title')}>
      {() => (
        <div className="page coverage-page">
          <div className="page-title-row">
            <div className="grow"><h1 className="h1">{t('pages.coverage.title')}</h1></div>
            <label className="coverage-term">
              <span className="sr-only">{t('pages.coverage.term')}</span>
              <select className="input" value={term} onChange={(event) => setTerm(Number(event.target.value) as 3 | 4)}>
                <option value={3}>{labels.termShort(3)}</option><option value={4}>{labels.termShort(4)}</option>
              </select>
            </label>
          </div>
          {coverage && <section className="card card-pad coverage-summary" aria-label={t('pages.coverage.summary', {
            children: coverage.summary.childrenWithGaps, missing: coverage.summary.areasMissing, stale: coverage.summary.areasStale
          })}>
            <span className="coverage-summary-item"><Icon name="alertCircle" size={18} />{t('pages.coverage.summary', {
              children: coverage.summary.childrenWithGaps, missing: coverage.summary.areasMissing, stale: coverage.summary.areasStale
            })}</span>
            {coverage.summary.childrenWithGaps === 0 && <p className="sec">{t('pages.coverage.emptyOk')}</p>}
          </section>}
          <div className="coverage-filters" role="group" aria-label={t('pages.coverage.filters')}>
            {filters.map((item) => <button key={item.key} className={`chip${filter === item.key ? ' is-active' : ''}`} type="button" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}</button>)}
          </div>
          {failed && <div className="notice notice-error" role="alert"><span>{t('pages.coverage.error')}</span><button className="btn btn-secondary" type="button" onClick={load}>{t('pages.coverage.retry')}</button></div>}
          {!coverage && !failed && <p role="status" className="sec muted">{t('pages.coverage.loading')}</p>}
          {coverage && visible.length === 0 && filter !== 'all' && <p className="card card-pad sec" role="status">{t('pages.coverage.noResults')}</p>}
          {coverage && visible.length > 0 && (
            <>
              <div className="card coverage-table-card">
                <div className="coverage-scroll" role="region" aria-label={t('pages.coverage.tableCaption')}>
                  <table className="coverage-table">
                    <caption>{t('pages.coverage.tableCaption')} · {labels.termShort(term)}</caption>
                    <thead><tr><th className="coverage-student-head" scope="col">{t('pages.coverage.student')}</th>{DOMAINS.map((area) => <th scope="col" key={area.key}>{domainLabel(area.key)}</th>)}</tr></thead>
                    <tbody>{visible.map((row) => <tr key={row.student.id}>
                      <th className="coverage-student-cell" scope="row"><Link to={`/students/${row.student.id}`} className="coverage-child"><Avatar initials={row.student.initials} size="sm" /><span>{row.student.name}</span></Link></th>
                      {row.areas.map((area) => <td key={area.area}>
                        <div className={`coverage-cell status-${area.status}`}>
                          <div className="coverage-state"><Icon name={area.status === 'ok' ? 'check' : area.status === 'missing' ? 'info' : 'alertCircle'} size={16} /><strong>{statusLabel(area.status)}</strong></div>
                          <span className="sec num">{t('pages.coverage.count', { count: area.count })}</span>
                          <span className="cap muted">{area.latestDate ? t('pages.coverage.latest', { date: fmtDate(area.latestDate) }) : t('pages.coverage.noLatest')}</span>
                          {role.can('observation.add') && <Link className="coverage-add" aria-label={t('pages.coverage.addFor', { name: row.student.name, area: domainLabel(area.area) })} to={`/students/${row.student.id}/observe?area=${area.area}`}>{t('pages.coverage.add')}</Link>}
                        </div>
                      </td>)}
                    </tr>)}</tbody>
                  </table>
                </div>
              </div>
              <div className="coverage-mobile-list">
                {visible.map((row) => <article className="card card-pad coverage-mobile-card" key={row.student.id}>
                  <h2 className="h2"><Link to={`/students/${row.student.id}`} className="coverage-child"><Avatar initials={row.student.initials} size="sm" />{row.student.name}</Link></h2>
                  <div className="coverage-mobile-areas" role="group" aria-label={t('pages.coverage.mobileAreas', { name: row.student.name })}>
                    {row.areas.map((area) => <div className="coverage-mobile-area" key={area.area}>
                      <strong>{domainLabel(area.area)}</strong>
                      <span className="coverage-state"><Icon name={area.status === 'ok' ? 'check' : area.status === 'missing' ? 'info' : 'alertCircle'} size={16} />{statusLabel(area.status)}</span>
                      <span className="cap muted">{t('pages.coverage.count', { count: area.count })} · {area.latestDate ? fmtDate(area.latestDate) : t('pages.coverage.noLatest')}</span>
                      {role.can('observation.add') && <Link className="coverage-add" aria-label={t('pages.coverage.addFor', { name: row.student.name, area: domainLabel(area.area) })} to={`/students/${row.student.id}/observe?area=${area.area}`}>{t('pages.coverage.add')}</Link>}
                    </div>)}
                  </div>
                </article>)}
              </div>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
