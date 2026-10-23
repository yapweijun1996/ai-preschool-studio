import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AccessDenied } from '../../components/AccessDenied';
import { AppShell } from '../../components/AppShell';
import { Icon } from '../../components/Icon';
import { Avatar } from '../../components/ui';
import {
  formatAttendanceDateTime,
  localTime,
  type AbsenceReason,
  type AmendmentField,
  type AttendanceAmendment,
  type AttendanceRow,
} from '../../attendance/domain';
import { CLASS_NAME, TODAY } from '../../data/demo';
import { useI18n } from '../../i18n';
import { useDataPort, usePortfolio } from '../../store/PortfolioContext';
import { useRole } from '../../roles/RoleContext';
import {
  actor,
  amendmentActorName,
  CLASS_ID,
  focusAttendanceChildWhenReady,
  REASON_KEYS,
  REFUSAL_KEYS,
  summary,
} from './shared';
import { AmendDialog } from './dialogs/AmendDialog';

export function AttendanceHistory() {
  const { t, fmtDate } = useI18n();
  const { state } = usePortfolio();
  const port = useDataPort();
  const role = useRole();
  const dates = [...new Set(state.attendanceRecords.map((record) => record.date))].sort((a, b) =>
    b.localeCompare(a),
  );
  const initialDate = dates.find((date) => date < TODAY) ?? dates[0] ?? TODAY;
  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [dialog, setDialog] = useState<AttendanceRow | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const announceSaved = () => {
    setMessage('');
    window.setTimeout(() => setMessage(t('pages.attendance.historySaved')), 0);
  };
  const [trails, setTrails] = useState<Record<string, AttendanceAmendment[]>>({});
  const fallbackFocusRef = useRef<HTMLElement>(null);
  const fallbackFocusId = useRef<string | null>(null);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setLoadFailed(false);
    void port.getAttendanceRegister(CLASS_ID, date, actor(role.role)).then(
      (register) => {
        if (live) {
          setRows(register.rows);
          setLoading(false);
          setLoadFailed(false);
        }
      },
      () => {
        if (live) {
          setLoading(false);
          setLoadFailed(true);
        }
      },
    );
    return () => {
      live = false;
    };
  }, [port, date, role.role, state, retryCount]);
  useEffect(() => {
    let live = true;
    void Promise.all(
      rows
        .filter((row) => row.record)
        .map(
          async (row) =>
            [row.record!.id, await port.getAmendments(row.record!.id, actor(role.role))] as const,
        ),
    ).then((items) => {
      if (live) setTrails(Object.fromEntries(items));
    });
    return () => {
      live = false;
    };
  }, [port, role.role, rows, state]);
  const denied = !role.can('attendance.view');
  const canAmend = role.role === 'admin';
  const counts = summary(rows);
  const fieldLabel = (field: AmendmentField) =>
    t(
      field === 'status'
        ? 'pages.attendance.fieldStatus'
        : field === 'arrivedAt'
          ? 'pages.attendance.fieldArrival'
          : field === 'departedAt'
            ? 'pages.attendance.fieldDeparted'
            : 'pages.attendance.fieldAbsence',
    );
  const valueLabel = (field: AmendmentField, value?: string) => {
    if (!value) return t('pages.attendance.timeEmpty');
    if (field === 'status')
      return t(
        value === 'present' ? 'pages.attendance.valuePresent' : 'pages.attendance.valueAbsent',
      );
    if (field === 'absenceReason') return t(REASON_KEYS[value as AbsenceReason]);
    return localTime(value) ?? value;
  };
  return (
    <AppShell module="attendance" mobileTitle={t('pages.attendance.historyTitle')}>
      {() =>
        denied ? (
          <AccessDenied title="pages.attendance.historyTitle" />
        ) : (
          <div className="page attendance-page history-page">
            <div className="page-title-row">
              <div className="grow">
                <h1 className="h1">{t('pages.attendance.historyTitle')}</h1>
                <p className="sec muted">{CLASS_NAME}</p>
              </div>
              <Link className="btn btn-ghost" to="/attendance">
                {t('pages.attendance.title')}
              </Link>
            </div>
            <div className="history-toolbar">
              <label className="stack sec" htmlFor="history-date">
                {t('pages.attendance.historyDate')}
                <select
                  id="history-date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                >
                  {dates.map((day) => (
                    <option key={day} value={day}>
                      {fmtDate(day)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sec muted">
                {date === TODAY ? (
                  <>
                    {t('pages.attendance.historyTodayLive')}{' '}
                    <Link to="/attendance">{t('pages.attendance.viewRegister')}</Link>
                  </>
                ) : canAmend ? (
                  t('pages.attendance.historyReadOnly')
                ) : (
                  t('pages.attendance.readOnlyPast')
                )}
              </div>
            </div>
            <section className="attendance-summary" aria-label={t('pages.attendance.summaryLabel')}>
              {(['present', 'late', 'absent', 'notMarked'] as const).map((key) => (
                <div key={key} className={`attendance-stat stat-${key}`}>
                  <span className="cap muted">{t(`pages.attendance.${key}`)}</span>
                  <strong className="h2 num">{counts[key]}</strong>
                  {key === 'present' && counts.late > 0 && (
                    <span className="attendance-late-count">
                      {t('pages.attendance.summaryLateCount', { count: counts.late })}
                    </span>
                  )}
                </div>
              ))}
            </section>
            {error && (
              <div className="notice notice-danger" role="alert">
                <Icon name="alertCircle" size={18} />
                <p className="sec">{error}</p>
              </div>
            )}
            {loadFailed && (
              <div className="notice notice-danger" role="alert">
                <Icon name="alertCircle" size={18} />
                <p className="sec">{t('pages.attendance.historyLoadFailed')}</p>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setRetryCount((count) => count + 1)}
                >
                  {t('pages.attendance.retry')}
                </button>
              </div>
            )}
            <div role="status" aria-live="polite" className="sr-only">
              {message}
            </div>
            <section
              className="attendance-list"
              aria-busy={loading}
              aria-label={t('pages.attendance.historyTitle')}
            >
              {loading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <div className="attendance-skeleton" key={i}>
                    <span className="skel" />
                    <span className="skel grow" />
                    <span className="skel" />
                  </div>
                ))
              ) : loadFailed ? null : rows.length === 0 ? (
                <div className="card card-pad">
                  <p className="sec muted">{t('pages.attendance.historyEmpty')}</p>
                </div>
              ) : (
                rows.map((row) => {
                  const record = row.record;
                  return (
                    <article className="card attendance-row history-row" key={row.child.id}>
                      <Avatar initials={row.child.initials} />
                      <div className="attendance-child grow">
                        <div className="row">
                          <strong
                            className="strong"
                            tabIndex={-1}
                            data-attendance-child={row.child.id}
                            ref={(element) => {
                              if (element && fallbackFocusId.current === row.child.id) {
                                fallbackFocusRef.current = element;
                              }
                            }}
                          >
                            {row.child.name}
                          </strong>
                          {row.child.status === 'withdrawn' && (
                            <span className="status st-notstarted">
                              {t('pages.attendance.withdrawn')}
                            </span>
                          )}
                        </div>
                        <div className="attendance-meta">
                          {record ? (
                            <>
                              <span className={`status attendance-status st-${record.status}`}>
                                {t(`pages.attendance.${record.status}`)}
                              </span>
                              {row.late && (
                                <span className="status attendance-late-badge">
                                  {t('pages.attendance.late')}
                                </span>
                              )}
                              {record.arrivedAt && (
                                <span>
                                  {t('pages.attendance.arrivalTime')}: {localTime(record.arrivedAt)}
                                </span>
                              )}
                              {record.departedAt && (
                                <span>
                                  {t('pages.attendance.fieldDeparted')}:{' '}
                                  {localTime(record.departedAt)}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="status st-notstarted">
                              {t('pages.attendance.notMarked')}
                            </span>
                          )}
                        </div>
                        {record && (trails[record.id]?.length ?? 0) > 0 && (
                          <details className="amendment-details">
                            <summary>
                              {t('pages.attendance.amendmentTrail')} · {trails[record.id].length}
                            </summary>
                            <ol className="amendment-list">
                              {trails[record.id].map((amendment) => (
                                <li key={amendment.id}>
                                  <strong>
                                    {t('pages.attendance.amendmentWhoWhen', {
                                      by: amendmentActorName(amendment.by, t),
                                      when: formatAttendanceDateTime(amendment.at, fmtDate),
                                    })}
                                  </strong>
                                  <span>
                                    {t('pages.attendance.amendmentChange', {
                                      field: fieldLabel(amendment.field),
                                      from: valueLabel(amendment.field, amendment.from),
                                      to: valueLabel(amendment.field, amendment.to),
                                    })}
                                  </span>
                                  <span>
                                    {t('pages.attendance.amendmentReason', {
                                      reason: amendment.reason,
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </details>
                        )}
                      </div>
                      {canAmend && record && (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          aria-label={t('pages.attendance.amendFor', { name: row.child.name })}
                          onClick={() => {
                            fallbackFocusId.current = row.child.id;
                            fallbackFocusRef.current = document.querySelector<HTMLElement>(
                              `[data-attendance-child="${row.child.id}"]`,
                            );
                            setDialog(row);
                          }}
                        >
                          {t('pages.attendance.adminAmend')}
                        </button>
                      )}
                    </article>
                  );
                })
              )}
            </section>
            {dialog && (
              <AmendDialog
                row={dialog}
                saveError={error}
                onClose={() => setDialog(null)}
                fallbackFocusRef={fallbackFocusRef}
                onSave={async (field, to, reason, absenceReason) => {
                  setError('');
                  const result = await port.amendAttendance(
                    dialog.record!.id,
                    {
                      field,
                      to,
                      reason,
                      ...(absenceReason ? { absenceReason } : {}),
                    },
                    actor(role.role),
                  );
                  if (!result.ok) {
                    setError(t(REFUSAL_KEYS[result.reason]));
                    return false;
                  }
                  announceSaved();
                  setError('');
                  const fresh = await port.getAttendanceRegister(CLASS_ID, date, actor(role.role));
                  setRows(fresh.rows);
                  focusAttendanceChildWhenReady(dialog.child.id);
                  setDialog(null);
                  return true;
                }}
              />
            )}
          </div>
        )
      }
    </AppShell>
  );
}
