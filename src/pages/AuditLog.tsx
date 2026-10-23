import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EmptyIllustration } from '../components/EmptyIllustration';
import { Notice } from '../components/ui';
import { STUDENTS } from '../data/demo';
import { useI18n } from '../i18n';
import { usePortfolio } from '../store/PortfolioContext';
import type { AuditEvent } from '../store/reducer';
import { AUDIT_ACTIONS, auditActionLabel, auditSummaryLabel, isAuditAction } from '../store/audit';
import { useRole } from '../roles/RoleContext';

const actions = AUDIT_ACTIONS;

export function AuditLog() {
  const role = useRole();
  const { dataPort, state } = usePortfolio();
  const { t, fmtDate, fmtTime } = useI18n();
  const [action, setAction] = useState('');
  const [studentId, setStudentId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const filters = useMemo(
    () => ({
      action: isAuditAction(action) ? action : undefined,
      studentId: studentId || undefined,
      from: from || undefined,
      to: to || undefined
    }),
    [action, studentId, from, to]
  );

  const load = () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(false);
    void dataPort.getAuditLog(filters)
      .then((result) => { if (currentRequest === requestId.current) setEvents(result); })
      .catch(() => { if (currentRequest === requestId.current) setError(true); })
      .finally(() => { if (currentRequest === requestId.current) setLoading(false); });
  };
  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [dataPort, filters, state.auditEvents.length]);

  if (!role.can('audit.view')) {
    return (
      <AppShell module="settings" mobileTitle={t('pages.audit.title')}>
        {() => (
          <div className="card card-pad stack">
            <h1 className="h1">{t('shell.roles.accessDenied')}</h1>
            <Link className="btn btn-secondary" to="/">{t('pages.report.dashboard')}</Link>
          </div>
        )}
      </AppShell>
    );
  }

  const childName = (id: string) => STUDENTS.find((student) => student.id === id)?.name ?? id;
  const summary = (event: AuditEvent) => t(auditSummaryLabel(event), event.summaryParams);
  const clear = () => {
    setAction('');
    setStudentId('');
    setFrom('');
    setTo('');
  };
  const eventCard = (event: AuditEvent) => (
    <article className="card card-pad audit-mobile-card" key={event.id}>
      <div className="audit-mobile-card-head">
        <strong>{t(auditActionLabel[event.action])}</strong>
        <time className="cap muted num" dateTime={event.at}>{fmtDate(event.at)} · {fmtTime(new Date(event.at))}</time>
      </div>
      <p className="sec">{summary(event)}</p>
      <div className="audit-mobile-meta">
        <span className="audit-mobile-actor"><strong>{event.actor.name}</strong><span className="cap muted">{t(`shell.roles.${event.actor.role}`)}</span></span>
        <span className="cap muted">{t('pages.audit.child')}: {event.target.type !== 'demo' ? childName(event.target.id) : '—'}</span>
      </div>
    </article>
  );

  return (
    <AppShell module="settings" crumbs={[{ label: t('pages.audit.title') }]} mobileTitle={t('pages.audit.title')}>
      {() => (
        <>
          <div className="page audit-page">
          <div className="page-head">
            <div className="grow">
              <h1 className="h1">{t('pages.audit.title')}</h1>
              <p className="sec muted">{t('pages.audit.subtitle')}</p>
            </div>
          </div>
          <section className="card card-pad audit-filters" aria-label={t('pages.audit.title')}>
            <div className="audit-filter-row">
              <label className="field">
                <span className="field-label">{t('pages.audit.action')}</span>
                <select className="input" value={action} onChange={(event) => setAction(event.target.value)}>
                  <option value="">{t('pages.audit.allActions')}</option>
                  {actions.map((item) => <option key={item} value={item}>{t(auditActionLabel[item])}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">{t('pages.audit.child')}</span>
                <select className="input" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                  <option value="">{t('pages.audit.allChildren')}</option>
                  {STUDENTS.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">{t('pages.audit.from')}</span>
                <input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">{t('pages.audit.to')}</span>
                <input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </label>
              <button className="btn btn-secondary" type="button" onClick={clear}>{t('pages.audit.clear')}</button>
            </div>
          </section>
          <section className="audit-results stack" aria-live="polite">
            {loading && (
              <div className="skel" role="status" aria-label={t('pages.audit.title')} style={{ minHeight: 180 }} />
            )}
            {error && (
              <Notice tone="warning" icon="alert" role="alert">
                <p>{t('pages.audit.readFailed')}</p>
                <button className="btn btn-secondary" type="button" onClick={load}>{t('pages.shared.retry')}</button>
              </Notice>
            )}
            {!loading && !error && events.length === 0 && (
              <div className="card card-pad stack empty-state">
                <EmptyIllustration name="no-results" />
                <p className="sec">{t('pages.audit.empty')}</p>
                <button className="btn btn-secondary" type="button" onClick={clear}>{t('pages.audit.clear')}</button>
              </div>
            )}
            {!loading && !error && events.length > 0 && (
              <>
                <div className="audit-table-wrap card">
                  <div className="audit-table-scroll" role="region" aria-label={t('pages.audit.title')} tabIndex={0}>
                  <table className="audit-table">
                    <caption>{t('pages.audit.title')}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t('pages.audit.action')}</th>
                        <th scope="col">{t('pages.audit.child')}</th>
                        <th scope="col">{t('pages.audit.actor')}</th>
                        <th scope="col">{t('pages.audit.summary')}</th>
                        <th scope="col">{t('pages.audit.timestamp')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id}>
                          <td>{t(auditActionLabel[event.action])}</td>
                          <td>{event.target.type !== 'demo' ? childName(event.target.id) : '—'}</td>
                          <td>
                            <span className="audit-actor"><strong>{event.actor.name}</strong><span className="cap muted">{t(`shell.roles.${event.actor.role}`)}</span></span>
                          </td>
                          <td>{summary(event)}</td>
                          <td className="audit-timestamp"><time dateTime={event.at}>{fmtDate(event.at)} · {fmtTime(new Date(event.at))}</time></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
                <div className="audit-mobile-list">{events.map(eventCard)}</div>
              </>
            )}
          </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
