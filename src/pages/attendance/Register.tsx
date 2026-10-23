import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AccessDenied } from '../../components/AccessDenied';
import { AppShell } from '../../components/AppShell';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { Avatar } from '../../components/ui';
import { CLASS_NAME, TODAY } from '../../data/demo';
import { attendanceEmptyState, type AttendanceRow } from '../../attendance/domain';
import type { PortRefusal } from '../../data/port';
import { useI18n, type TKey } from '../../i18n';
import {
  useRegister,
  actor,
  atTime,
  CLASS_ID,
  focusAttendanceChildWhenReady,
  FILTERS,
  FILTER_LABELS,
  REFUSAL_KEYS,
  summary,
  timeValue,
  type Dialog,
  type Filter,
} from './shared';
import { LATE_CUTOFF_LOCAL_TIME } from '../../attendance/policy';
import { AbsenceDialog } from './dialogs/AbsenceDialog';
import { AmendDialog } from './dialogs/AmendDialog';

export function Attendance() {
  const { t, fmtDate } = useI18n();
  const { rows, loading, loadFailed, retry, port, role, refresh } = useRegister();
  const [filter, setFilter] = useState<Filter>('all');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [timeFor, setTimeFor] = useState<string | null>(null);
  const [arrival, setArrival] = useState(timeValue());
  const trigger = useRef<HTMLButtonElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const fallbackFocusRef = useRef<HTMLElement>(null);
  const fallbackFocusId = useRef<string | null>(null);
  const rowHeadings = useRef(new Map<string, HTMLElement>());
  const focusRow = (childId: string) => {
    focusAttendanceChildWhenReady(childId);
  };
  const readOnly = !role.can('attendance.mark');
  const counts = useMemo(() => summary(rows), [rows]);
  const filtered = rows.filter(
    (row) =>
      filter === 'all' ||
      (filter === 'notMarked'
        ? !row.record
        : filter === 'present'
          ? row.record?.status === 'present'
          : filter === 'late'
            ? row.late
            : row.record?.status === 'absent'),
  );
  const saveRefusal = (reason: PortRefusal) => {
    setError(t(REFUSAL_KEYS[reason]));
    setMessage('');
  };
  const announceSaved = (key: TKey) => {
    setMessage('');
    window.setTimeout(() => setMessage(t(key)), 0);
  };
  const markPresent = async (row: AttendanceRow, time = timeValue()) => {
    const result = await port.markPresent(
      row.child.id,
      { arrivedAt: atTime(time), method: 'staff' },
      actor(role.role),
    );
    if (!result.ok) saveRefusal(result.reason);
    else {
      setError('');
      announceSaved('pages.attendance.saved');
      setTimeFor(null);
      await refresh();
      focusRow(row.child.id);
    }
  };
  const filteredCounts: Record<Filter, number> = {
    all: rows.length,
    notMarked: counts.notMarked,
    present: counts.present,
    late: counts.late,
    absent: counts.absent,
  };
  return (
    <AppShell module="attendance" mobileTitle={t('pages.attendance.title')}>
      {() =>
        !role.can('attendance.view') ? (
          <AccessDenied title="pages.attendance.title" />
        ) : (
          <div className="page attendance-page">
            <div className="page-title-row">
              <div className="grow">
                <h1 className="h1">{t('pages.attendance.title')}</h1>
                <p className="sec muted">
                  {t('pages.attendance.subtitle', { className: CLASS_NAME })} · {fmtDate(TODAY)}
                </p>
              </div>
              <Link className="btn btn-secondary" to="/attendance/kiosk">
                <Icon name="scan" size={18} />
                {t('shell.panel.attendanceKiosk')}
              </Link>
            </div>
            {readOnly && (
              <div className="notice notice-info" role="note">
                <Icon name="eye" size={18} />
                <p className="sec">{t('pages.attendance.readOnly')}</p>
              </div>
            )}
            <section
              ref={summaryRef}
              tabIndex={-1}
              className="attendance-summary"
              aria-label={t('pages.attendance.summaryLabel')}
            >
              {(['present', 'late', 'absent', 'notMarked'] as const).map((key) => (
                <div key={key} className={`attendance-stat stat-${key}`}>
                  <span className="cap muted">{t(`pages.attendance.${key}`)}</span>
                  <strong className="h2 num">{counts[key]}</strong>
                  {key === 'present' && counts.late > 0 && (
                    <span className="attendance-late-count">
                      {t('pages.attendance.summaryLateCount', { count: counts.late })}
                    </span>
                  )}
                  {key === 'late' && (
                    <span className="sr-only">{t('pages.attendance.lateNote')}</span>
                  )}
                </div>
              ))}
            </section>
            <p className="sr-only">{t('pages.attendance.lateNote')}</p>
            <div className="attendance-tools">
              <div
                className="attendance-filters"
                role="group"
                aria-label={t('pages.attendance.filters')}
              >
                {FILTERS.map((key) => (
                  <button
                    key={key}
                    className={`filter-chip${filter === key ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={filter === key}
                    onClick={() => setFilter(key)}
                  >
                    {t(FILTER_LABELS[key])} <span className="num">{filteredCounts[key]}</span>
                  </button>
                ))}
              </div>
              {!readOnly && counts.notMarked > 0 && (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    fallbackFocusId.current = null;
                    fallbackFocusRef.current = summaryRef.current;
                    setDialog({ kind: 'bulk', count: counts.notMarked, time: timeValue() });
                  }}
                >
                  {t('pages.attendance.markRemaining')}
                </button>
              )}
            </div>
            <div className="sr-only" role="status" aria-live="polite">
              {message}
            </div>
            {error && (
              <div className="notice notice-danger" role="alert">
                <Icon name="alertCircle" size={18} />
                <p className="sec">{error}</p>
              </div>
            )}
            {loadFailed && (
              <div className="notice notice-danger" role="alert">
                <Icon name="alertCircle" size={18} />
                <p className="sec">{t('pages.attendance.registerLoadFailed')}</p>
                <button className="btn btn-secondary" type="button" onClick={retry}>
                  {t('pages.attendance.retry')}
                </button>
              </div>
            )}
            <section
              className="attendance-list"
              aria-label={t('pages.attendance.registerLabel')}
              aria-busy={loading}
            >
              {loading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <div className="attendance-skeleton" key={i}>
                    <span className="skel" />
                    <span className="skel grow" />
                    <span className="skel" />
                  </div>
                ))
              ) : loadFailed ? null : filtered.length === 0 ? (
                <div className="card card-pad">
                  <p className="sec muted">
                    {t(`pages.attendance.${attendanceEmptyState(filter, rows.length)}`)}
                  </p>
                </div>
              ) : (
                filtered.map((row) => {
                  const time = row.record?.arrivedAt ? timeValue(row.record.arrivedAt) : '';
                  return (
                    <article className="card attendance-row" key={row.child.id}>
                      <Avatar initials={row.child.initials} />
                      <div className="attendance-child grow">
                        <strong
                          className="strong"
                          tabIndex={-1}
                          data-attendance-child={row.child.id}
                          ref={(element) => {
                            if (element) {
                              rowHeadings.current.set(row.child.id, element);
                              if (fallbackFocusId.current === row.child.id) {
                                fallbackFocusRef.current = element;
                              }
                            } else rowHeadings.current.delete(row.child.id);
                          }}
                        >
                          {row.child.name}
                        </strong>
                        <div className="attendance-meta">
                          {row.record ? (
                            <>
                              <span className={`status attendance-status st-${row.record.status}`}>
                                {t(`pages.attendance.${row.record.status}`)}
                              </span>
                              {row.late && (
                                <span className="status attendance-late-badge">
                                  {t('pages.attendance.late')}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="status st-notstarted">
                              {t('pages.attendance.notMarked')}
                            </span>
                          )}
                          {row.record?.status === 'present' && (
                            <>
                              <span className="num">{time}</span>
                              <span>
                                {t('pages.attendance.method')}:{' '}
                                {t(
                                  row.record.method === 'pin'
                                    ? 'pages.attendance.methodPin'
                                    : row.record.method === 'qr'
                                      ? 'pages.attendance.methodQr'
                                      : 'pages.attendance.methodStaff',
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {!readOnly && (
                        <div className="attendance-actions">
                          {!row.record && (
                            <>
                              {timeFor === row.child.id ? (
                                <>
                                  <label className="sr-only" htmlFor={`arrival-${row.child.id}`}>
                                    {t('pages.attendance.arrivalTime')}
                                  </label>
                                  <input
                                    id={`arrival-${row.child.id}`}
                                    className="input time-input"
                                    type="time"
                                    value={arrival}
                                    onChange={(e) => setArrival(e.target.value)}
                                  />
                                  <button
                                    className="btn btn-primary"
                                    type="button"
                                    aria-label={t('pages.attendance.markPresentFor', {
                                      name: row.child.name,
                                    })}
                                    onClick={() => void markPresent(row, arrival)}
                                  >
                                    {t('pages.attendance.save')}
                                  </button>
                                  <button
                                    className="btn btn-ghost"
                                    type="button"
                                    onClick={() => setTimeFor(null)}
                                  >
                                    {t('pages.attendance.cancel')}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-primary"
                                    type="button"
                                    aria-label={t('pages.attendance.markPresentFor', {
                                      name: row.child.name,
                                    })}
                                    onClick={() => void markPresent(row)}
                                  >
                                    {t('pages.attendance.markPresent')}
                                  </button>
                                  <button
                                    className="btn btn-ghost"
                                    type="button"
                                    aria-label={t('pages.attendance.markAbsentFor', {
                                      name: row.child.name,
                                    })}
                                    onClick={(e) => {
                                      trigger.current = e.currentTarget;
                                      fallbackFocusId.current = row.child.id;
                                      fallbackFocusRef.current =
                                        rowHeadings.current.get(row.child.id) ?? null;
                                      setDialog({ kind: 'absence', row });
                                      setError('');
                                    }}
                                  >
                                    {t('pages.attendance.markAbsent')}
                                  </button>
                                  <button
                                    className="btn btn-ghost"
                                    type="button"
                                    aria-label={t('pages.attendance.setTimeFor', {
                                      name: row.child.name,
                                    })}
                                    onClick={() => {
                                      setTimeFor(row.child.id);
                                      setArrival(timeValue());
                                    }}
                                  >
                                    {t('pages.attendance.setTime')}
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          {row.record && (
                            <button
                              className="btn btn-secondary"
                              type="button"
                              aria-label={t('pages.attendance.changeFor', { name: row.child.name })}
                              onClick={(e) => {
                                trigger.current = e.currentTarget;
                                fallbackFocusId.current = row.child.id;
                                fallbackFocusRef.current =
                                  rowHeadings.current.get(row.child.id) ?? null;
                                setDialog({ kind: 'amend', row });
                                setError('');
                              }}
                            >
                              {t('pages.attendance.change')}
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </section>
            {dialog?.kind === 'absence' && (
              <AbsenceDialog
                row={dialog.row}
                fallbackFocusRef={fallbackFocusRef}
                onClose={() => setDialog(null)}
                onSave={async (reason) => {
                  const result = await port.markAbsent(
                    dialog.row.child.id,
                    { reason },
                    actor(role.role),
                  );
                  if (!result.ok) {
                    saveRefusal(result.reason);
                    setDialog(null);
                    return false;
                  }
                  announceSaved('pages.attendance.saved');
                  await refresh();
                  focusRow(dialog.row.child.id);
                  return true;
                }}
              />
            )}
            {dialog?.kind === 'bulk' && (
              <Modal
                labelledBy="bulk-title"
                onClose={() => setDialog(null)}
                fallbackFocusRef={fallbackFocusRef}
                backdropClassName="dialog-backdrop"
                panelClassName="card card-pad stack"
              >
                <h2 id="bulk-title" className="h2">
                  {t('pages.attendance.confirmBulkTitle')}
                </h2>
                <p className="sec">
                  {t('pages.attendance.confirmBulk', {
                    count: dialog.count,
                    time: dialog.time,
                    cutoff: LATE_CUTOFF_LOCAL_TIME,
                  })}
                </p>
                <div className="row">
                  <button className="btn btn-ghost" type="button" onClick={() => setDialog(null)}>
                    {t('pages.attendance.cancel')}
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={async () => {
                      const result = await port.markRemainingPresent(CLASS_ID, actor(role.role));
                      if (!result.ok) {
                        saveRefusal(result.reason);
                        setDialog(null);
                      } else {
                        announceSaved('pages.attendance.saved');
                        setError('');
                        await refresh();
                        setDialog(null);
                        window.setTimeout(() => summaryRef.current?.focus(), 0);
                      }
                    }}
                  >
                    {t('pages.attendance.confirm')}
                  </button>
                </div>
              </Modal>
            )}
            {dialog?.kind === 'amend' && dialog.row.record && (
              <AmendDialog
                row={dialog.row}
                saveError={error}
                fallbackFocusRef={fallbackFocusRef}
                onClose={() => setDialog(null)}
                onSave={async (field, to, reason, absenceReason) => {
                  setError('');
                  const result = await port.amendAttendance(
                    dialog.row.record!.id,
                    {
                      field,
                      to,
                      reason,
                      ...(absenceReason ? { absenceReason } : {}),
                    },
                    actor(role.role),
                  );
                  if (!result.ok) {
                    saveRefusal(result.reason);
                    return false;
                  }
                  announceSaved('pages.attendance.saved');
                  setError('');
                  await refresh();
                  focusRow(dialog.row.child.id);
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
