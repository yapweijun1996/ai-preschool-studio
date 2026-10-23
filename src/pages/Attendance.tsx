import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { AccessDenied } from '../components/AccessDenied';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Avatar } from '../components/ui';
import { DEMO_CHECK_IN_CREDENTIALS } from '../attendance/demo';
import { formatAttendanceDateTime } from '../attendance/domain';
import { CLASS_NAME, TODAY } from '../data/demo';
import type {
  AbsenceReason,
  AmendmentField,
  AttendanceRow,
  AttendanceSummary,
} from '../attendance/domain';
import type { PortRefusal } from '../data/port';
import { useI18n, type TKey } from '../i18n';
import { useDataPort, usePortfolio } from '../store/PortfolioContext';
import { useRole } from '../roles/RoleContext';
import { demoRole } from '../roles';
import { localTime } from '../attendance/domain';
import { now } from '../utils/clock';
import '../styles/attendance.css';

const CLASS_ID = 'k2-sunflower-2026';
type Filter = 'all' | 'notMarked' | 'present' | 'late' | 'absent';
type Dialog =
  | { kind: 'absence'; row: AttendanceRow }
  | { kind: 'bulk'; count: number }
  | { kind: 'amend'; row: AttendanceRow }
  | null;
const REFUSAL_KEYS: Record<PortRefusal, TKey> = {
  'unknown-student': 'pages.attendance.refusalUnknownStudent',
  'wrong-child-observation': 'pages.attendance.refusalWrongChildObservation',
  'date-outside-period': 'pages.attendance.refusalDateOutsidePeriod',
  'report-locked': 'pages.attendance.refusalReportLocked',
  'report-not-editable': 'pages.attendance.refusalReportNotEditable',
  'not-ready': 'pages.attendance.refusalNotReady',
  'unverified-claims': 'pages.attendance.refusalUnverifiedClaims',
  'invalid-target': 'pages.attendance.refusalInvalidTarget',
  'no-observations': 'pages.attendance.refusalNoObservations',
  'not-approved': 'pages.attendance.refusalNotApproved',
  'reason-required': 'pages.attendance.refusalReasonRequired',
  'unknown-child': 'pages.attendance.refusalUnknownChild',
  'invalid-child': 'pages.attendance.refusalInvalidChild',
  'unknown-guardian': 'pages.attendance.refusalUnknownGuardian',
  'invalid-guardian': 'pages.attendance.refusalInvalidGuardian',
  'primary-guardian-required': 'pages.attendance.refusalPrimaryGuardianRequired',
  'unknown-collector': 'pages.attendance.refusalUnknownCollector',
  'invalid-collector': 'pages.attendance.refusalInvalidCollector',
  'report-in-review': 'pages.attendance.refusalReportInReview',
  'record-child-mismatch': 'pages.attendance.refusalRecordChildMismatch',
  'status-change-not-allowed': 'pages.attendance.refusalStatusChangeNotAllowed',
  'not-today': 'pages.attendance.refusalNotToday',
  'already-marked': 'pages.attendance.refusalAlreadyMarked',
  'child-withdrawn': 'pages.attendance.refusalChildWithdrawn',
  'invalid-time': 'pages.attendance.refusalInvalidTime',
  'past-date': 'pages.attendance.refusalPastDate',
  'not-permitted': 'pages.attendance.refusalNotPermitted',
  'not-present': 'pages.attendance.refusalNotPresent',
  'already-departed': 'pages.attendance.refusalAlreadyDeparted',
  'pin-invalid': 'pages.attendance.refusalPinInvalid',
  'pin-locked': 'pages.attendance.refusalPinLocked',
  'consent-not-recorded': 'pages.attendance.refusalConsentNotRecorded',
  'unknown-card': 'pages.attendance.refusalUnknownCard',
  'unknown-record': 'pages.attendance.refusalUnknownRecord',
};
const REASON_KEYS: Record<AbsenceReason, TKey> = {
  sick: 'pages.attendance.reasonSick',
  family: 'pages.attendance.reasonFamily',
  travel: 'pages.attendance.reasonTravel',
  other: 'pages.attendance.reasonOther',
};
const FILTERS: Filter[] = ['all', 'notMarked', 'present', 'late', 'absent'];
const FILTER_LABELS: Record<Filter, TKey> = {
  all: 'pages.attendance.all',
  notMarked: 'pages.attendance.filterNotMarked',
  present: 'pages.attendance.filterPresent',
  late: 'pages.attendance.filterLate',
  absent: 'pages.attendance.filterAbsent',
};
const KIOSK_TAB_LABELS: Record<KioskMethod, TKey> = {
  pin: 'pages.attendance.pinTab',
  qr: 'pages.attendance.qrTab',
  face: 'pages.attendance.faceTab',
};

function actor(role: ReturnType<typeof useRole>['role']) {
  return { role, name: demoRole(role).name };
}
function summary(rows: AttendanceRow[]): AttendanceSummary {
  const value: AttendanceSummary = {
    present: 0,
    late: 0,
    absent: 0,
    notMarked: 0,
    absenceReasons: { sick: 0, family: 0, travel: 0, other: 0 },
  };
  rows.forEach((row) => {
    if (!row.record) value.notMarked++;
    else if (row.record.status === 'absent') {
      value.absent++;
      if (row.record.absenceReason) value.absenceReasons[row.record.absenceReason]++;
    } else {
      value.present++;
      if (row.late) value.late++;
    }
  });
  return value;
}

function useRegister(date = TODAY) {
  const { state } = usePortfolio();
  const port = useDataPort();
  const role = useRole();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    void port.getAttendanceRegister(CLASS_ID, date, actor(role.role)).then(
      (register) => {
        if (live) {
          setRows(register.rows);
          setLoading(false);
        }
      },
      () => {
        if (live) setLoading(false);
      },
    );
    return () => {
      live = false;
    };
  }, [port, date, role.role, state]);
  return {
    rows,
    loading,
    port,
    role,
    refresh: () =>
      port.getAttendanceRegister(CLASS_ID, date, actor(role.role)).then((r) => setRows(r.rows)),
  };
}

function timeValue(dateTime?: string) {
  return dateTime ? (localTime(dateTime) ?? '') : (localTime(now()) ?? '08:00');
}
function atTime(value: string, date = TODAY) {
  return `${date}T${value}:00+08:00`;
}
function amendmentActorName(actorId: string, t: (key: TKey) => string) {
  if (actorId === 'admin-wong') return 'Ms. Wong';
  if (actorId === 'teacher-lim') return 'Ms. Lim';
  if (actorId === 'check-in-kiosk') return t('pages.attendance.actorKiosk');
  return actorId;
}
function focusAttendanceChildWhenReady(childId: string, attempts = 30) {
  window.setTimeout(() => {
    const heading = document.querySelector<HTMLElement>(`[data-attendance-child="${childId}"]`);
    const list = heading?.closest<HTMLElement>('.attendance-list');
    if (heading && list?.getAttribute('aria-busy') === 'false') heading.focus();
    else if (attempts > 0) focusAttendanceChildWhenReady(childId, attempts - 1);
  }, 16);
}

export function Attendance() {
  const { t, fmtDate } = useI18n();
  const { rows, loading, port, role, refresh } = useRegister();
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
  const markPresent = async (row: AttendanceRow, time = timeValue()) => {
    const result = await port.markPresent(
      row.child.id,
      { arrivedAt: atTime(time), method: 'staff' },
      actor(role.role),
    );
    if (!result.ok) saveRefusal(result.reason);
    else {
      setError('');
      setMessage(t('pages.attendance.saved'));
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
              <Link className="btn btn-secondary" to="/attendance/check-in">
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
                    setDialog({ kind: 'bulk', count: counts.notMarked });
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
              ) : filtered.length === 0 ? (
                <div className="card card-pad">
                  <p className="sec muted">{t('pages.attendance.empty')}</p>
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
                            }
                            else rowHeadings.current.delete(row.child.id);
                          }}
                        >
                          {row.child.name}
                        </strong>
                        <div className="attendance-meta">
                          {row.record ? (
                            <span className={`status attendance-status st-${row.record.status}`}>
                              {t(`pages.attendance.${row.record.status}`)}
                              {row.late ? ` · ${t('pages.attendance.late')}` : ''}
                            </span>
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
                                    aria-label={t('pages.attendance.markPresentFor', { name: row.child.name })}
                                    onClick={() => void markPresent(row, arrival)}
                                  >
                                    {t('pages.attendance.save')}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-primary"
                                    type="button"
                                    aria-label={t('pages.attendance.markPresentFor', { name: row.child.name })}
                                    onClick={() => void markPresent(row)}
                                  >
                                    {t('pages.attendance.markPresent')}
                                  </button>
                                  <button
                                    className="btn btn-ghost"
                                    type="button"
                                    aria-label={t('pages.attendance.markAbsentFor', { name: row.child.name })}
                                    onClick={(e) => {
                                      trigger.current = e.currentTarget;
                                      fallbackFocusId.current = row.child.id;
                                      fallbackFocusRef.current = rowHeadings.current.get(row.child.id) ?? null;
                                      setDialog({ kind: 'absence', row });
                                      setError('');
                                    }}
                                  >
                                    {t('pages.attendance.markAbsent')}
                                  </button>
                                  <button
                                    className="btn btn-ghost"
                                    type="button"
                                    aria-label={t('pages.attendance.setTimeFor', { name: row.child.name })}
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
                                fallbackFocusRef.current = rowHeadings.current.get(row.child.id) ?? null;
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
                  setMessage(t('pages.attendance.saved'));
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
                <p className="sec">{t('pages.attendance.confirmBulk', { count: dialog.count })}</p>
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
                        setMessage(t('pages.attendance.saved'));
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
                  setMessage(t('pages.attendance.saved'));
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

function AbsenceDialog({
  row,
  onClose,
  onSave,
  fallbackFocusRef,
}: {
  row: AttendanceRow;
  onClose: () => void;
  onSave: (reason: AbsenceReason) => Promise<boolean>;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState<AbsenceReason | ''>('');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const choices: AbsenceReason[] = ['sick', 'family', 'travel', 'other'];
  return (
    <Modal
      labelledBy="absence-title"
      onClose={onClose}
      backdropClassName="dialog-backdrop"
      panelClassName="card card-pad stack"
      fallbackFocusRef={fallbackFocusRef}
    >
      <h2 className="h2" id="absence-title">
        {t('pages.attendance.absenceTitle', { name: row.child.name })}
      </h2>
      <fieldset className="stack attendance-reasons">
        <legend className="sec semibold">{t('pages.attendance.absenceReason')}</legend>
        {choices.map((value) => (
          <label className="radio-row" key={value}>
            <input
              type="radio"
              name="absence-reason"
              value={value}
              checked={reason === value}
              onChange={() => {
                setReason(value);
                setError(false);
              }}
            />
            {t(REASON_KEYS[value])}
          </label>
        ))}
      </fieldset>
      {error && (
        <p className="field-error" role="alert">
          {t('pages.attendance.requiredReason')}
        </p>
      )}
      <div className="row">
        <button className="btn btn-ghost" type="button" onClick={onClose}>
          {t('pages.attendance.cancel')}
        </button>
        <button
          className="btn btn-primary"
          type="button"
          disabled={saving}
          onClick={async () => {
            if (!reason) {
              setError(true);
              return;
            }
            setSaving(true);
            if (await onSave(reason)) onClose();
            else setSaving(false);
          }}
        >
          {t('pages.attendance.save')}
        </button>
      </div>
    </Modal>
  );
}

function AmendDialog({
  row,
  onClose,
  onSave,
  fallbackFocusRef,
  saveError,
}: {
  row: AttendanceRow;
  onClose: () => void;
  onSave: (
    field: AmendmentField,
    to: string | undefined,
    reason: string,
    absenceReason?: AbsenceReason,
  ) => Promise<boolean>;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  saveError?: string;
}) {
  const { t } = useI18n();
  const record = row.record!;
  const [field, setField] = useState<AmendmentField>('status');
  const [to, setTo] = useState<string>(record.status);
  const [absenceReason, setAbsenceReason] = useState<AbsenceReason | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const label =
    field === 'status'
      ? 'pages.attendance.fieldStatus'
      : field === 'arrivedAt'
        ? 'pages.attendance.fieldArrival'
        : field === 'departedAt'
          ? 'pages.attendance.fieldDeparted'
          : 'pages.attendance.fieldAbsence';
  const timeField = field === 'arrivedAt' || field === 'departedAt';
  const statusToAbsent = field === 'status' && to === 'absent';
  const fromValue =
    field === 'arrivedAt'
      ? timeValue(record.arrivedAt)
      : field === 'departedAt'
        ? timeValue(record.departedAt)
        : record[field] ?? '';
  const noChange = to === fromValue;
  return (
    <Modal
      labelledBy="amend-title"
      onClose={onClose}
      backdropClassName="dialog-backdrop"
      panelClassName="card card-pad stack"
      fallbackFocusRef={fallbackFocusRef}
      ariaBusy={saving}
    >
      <h2 className="h2" id="amend-title">
        {t('pages.attendance.amendTitle', { name: row.child.name })}
      </h2>
      <label className="stack sec" htmlFor="amend-field">
        {t('pages.attendance.change')}
        <select
          className="input"
          id="amend-field"
          value={field}
          onChange={(e) => {
            const next = e.target.value as AmendmentField;
            setField(next);
            setError(false);
            setTo(
              next === 'status'
                ? record.status
                : next === 'arrivedAt'
                  ? timeValue(record.arrivedAt)
                  : next === 'departedAt'
                    ? timeValue(record.departedAt)
                    : (record.absenceReason ?? 'other'),
            );
          }}
        >
          <option value="status">{t('pages.attendance.fieldStatus')}</option>
          {record.status === 'present' && (
            <>
              <option value="arrivedAt">{t('pages.attendance.fieldArrival')}</option>
              <option value="departedAt">{t('pages.attendance.fieldDeparted')}</option>
            </>
          )}
          {record.status === 'absent' && (
            <option value="absenceReason">{t('pages.attendance.fieldAbsence')}</option>
          )}
        </select>
      </label>
      <label className="stack sec" htmlFor="amend-value">
        {t(label)}
        {field === 'status' ? (
          <select
            id="amend-value"
            className="input"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setError(false);
              if (e.target.value === 'absent') setAbsenceReason('');
            }}
          >
            <option value="present">{t('pages.attendance.valuePresent')}</option>
            <option value="absent">{t('pages.attendance.valueAbsent')}</option>
          </select>
        ) : timeField ? (
          <input
            id="amend-value"
            className="input"
            type="time"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        ) : (
          <select
            id="amend-value"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {(['sick', 'family', 'travel', 'other'] as AbsenceReason[]).map((r) => (
              <option key={r} value={r}>
                {t(REASON_KEYS[r])}
              </option>
            ))}
          </select>
        )}
      </label>
      {statusToAbsent && (
        <label className="stack sec" htmlFor="amend-absence-reason">
          {t('pages.attendance.absenceReason')}
          <select
            id="amend-absence-reason"
            className="input"
            value={absenceReason}
            onChange={(e) => setAbsenceReason(e.target.value as AbsenceReason | '')}
          >
            <option value="">{t('pages.attendance.chooseAbsenceReason')}</option>
            {(['sick', 'family', 'travel', 'other'] as AbsenceReason[]).map((r) => (
              <option key={r} value={r}>
                {t(REASON_KEYS[r])}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="stack sec" htmlFor="amend-reason">
        {t('pages.attendance.amendReason')}
        <textarea
          id="amend-reason"
          className="input"
          rows={4}
          minLength={5}
          maxLength={200}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(false);
          }}
        />
      </label>
      <p className="cap muted">{t('pages.attendance.amendHelp')}</p>
      <p className="cap num" aria-live="polite">
        {t('pages.attendance.characters', { count: reason.length })}
      </p>
      {error && (
        <p role="alert" className="field-error">
          {t('pages.attendance.errorReason')}
        </p>
      )}
      {noChange && (
        <p role="status" className="field-error">
          {t('pages.attendance.noOpAmendment')}
        </p>
      )}
      {saveError && <p role="alert" className="field-error">{saveError}</p>}
      <div className="row">
        <button className="btn btn-ghost" type="button" disabled={saving} onClick={onClose}>
          {t('pages.attendance.cancel')}
        </button>
        <button
          className="btn btn-primary"
          type="button"
          disabled={saving || noChange}
          onClick={async () => {
            if (
              reason.trim().length < 5 ||
              reason.length > 200 ||
              (statusToAbsent && !absenceReason)
            ) {
              setError(true);
              return;
            }
            const value = timeField ? atTime(to, record.date) : to;
            setSaving(true);
            if (await onSave(
                field,
                value,
                reason,
                statusToAbsent ? (absenceReason as AbsenceReason) : undefined,
              )) {
              onClose();
            } else {
              setSaving(false);
            }
          }}
        >
          {t('pages.attendance.submit')}
        </button>
      </div>
    </Modal>
  );
}

type KioskMethod = 'pin' | 'qr' | 'face';
export function AttendanceKiosk() {
  const { t } = useI18n();
  const { state } = usePortfolio();
  const port = useDataPort();
  const role = useRole();
  const [method, setMethod] = useState<KioskMethod>('pin');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [pinAttempted, setPinAttempted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ name: string; at: string } | null>(null);
  const credentials = DEMO_CHECK_IN_CREDENTIALS.slice(0, 3).map((credential) => ({
    ...credential,
    name: state.children[credential.childId]?.name ?? '',
  }));
  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);
  const done = (record: { childId: string; arrivedAt?: string }) => {
    const child = state.children[record.childId];
    setSuccess({
      name: child?.name ?? '',
      at: record.arrivedAt ? (localTime(record.arrivedAt) ?? '') : '',
    });
    setError('');
    setPin('');
  };
  const denied = !role.can('attendance.mark');
  const tryPin = async () => {
    setPinAttempted(true);
    const result = await port.checkInWithPin(code.trim().toUpperCase(), pin);
    setPin('');
    if (!result.ok) {
      const lockedUntil = state.attendancePinLockouts[code.trim().toUpperCase()]?.lockedUntil;
      const minutes = lockedUntil
        ? Math.max(1, Math.ceil((Date.parse(lockedUntil) - Date.parse(now())) / 60000))
        : 5;
      setError(
        result.reason === 'pin-locked'
          ? t('pages.attendance.pinLocked', { minutes })
          : t(REFUSAL_KEYS[result.reason]),
      );
      return;
    }
    done(result.value);
  };
  const tryQr = async (cardId: string) => {
    const result = await port.checkInWithQr(cardId);
    if (!result.ok) setError(t(REFUSAL_KEYS[result.reason]));
    else done(result.value);
  };
  return (
    <main className="kiosk-screen">
      {denied ? (
        <div className="page attendance-page kiosk-page">
          <AccessDenied title="pages.attendance.kioskTitle" />
        </div>
      ) : (
        <div className="page attendance-page kiosk-page">
          <div className="notice notice-info kiosk-demo-banner" role="note">
            <Icon name="info" size={18} />
            <strong>{t('pages.attendance.kioskDemoBanner')}</strong>
            <Link className="btn btn-secondary" to="/attendance">
              {t('pages.attendance.exitKiosk')}
            </Link>
          </div>
          <div className="page-title-row">
            <div className="grow">
              <h1 className="h1">{t('pages.attendance.kioskTitle')}</h1>
              <p className="sec muted">{CLASS_NAME}</p>
            </div>
          </div>
          <div
            className="attendance-kiosk-tabs"
            role="tablist"
            aria-label={t('pages.attendance.kioskTitle')}
          >
            {(['pin', 'qr', 'face'] as KioskMethod[]).map((item) => (
              <button
                key={item}
                className="btn btn-secondary"
                id={`kiosk-tab-${item}`}
                role="tab"
                aria-selected={method === item}
                aria-controls="kiosk-panel"
                data-unavailable={item === 'face' || undefined}
                onClick={() => {
                  setMethod(item);
                  setError('');
                  setSuccess(null);
                }}
              >
                {t(KIOSK_TAB_LABELS[item])}
              </button>
            ))}
          </div>
          <section
            id="kiosk-panel"
            className="card card-pad stack kiosk-panel"
            role="tabpanel"
            aria-labelledby={`kiosk-tab-${method}`}
          >
            {success ? (
              <div className="kiosk-success" role="status" aria-live="polite">
                <span className="kiosk-success-mark">
                  <Icon name="check" size={24} />
                </span>
                <h2 className="h2">
                  {t('pages.attendance.pinSuccess', {
                    name: success.name,
                    time: success.at,
                  })}
                </h2>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setSuccess(null);
                    setCode('');
                    setPin('');
                    setPinAttempted(false);
                  }}
                >
                  {t('pages.attendance.nextFamily')}
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div role="alert" className="notice notice-danger">
                    <Icon name="alertCircle" size={18} />
                    <p className="sec">{error}</p>
                  </div>
                )}
                {method === 'pin' && (
                  <>
                    <h2 className="h2">{t('pages.attendance.pinTitle')}</h2>
                    <form
                      className="kiosk-pin-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void tryPin();
                      }}
                    >
                      <label className="stack sec" htmlFor="child-code">
                        {t('pages.attendance.childCode')}
                        <input
                          id="child-code"
                          className="input"
                          autoComplete="off"
                          inputMode="numeric"
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                        />
                      </label>
                      <label className="stack sec" htmlFor="child-pin">
                        {t('pages.attendance.pinLabel')}
                        <input
                          id="child-pin"
                          className="input"
                          type="password"
                          autoComplete="off"
                          inputMode="numeric"
                          pattern="[0-9]{4}"
                          maxLength={4}
                          value={pin}
                          onChange={(e) => {
                            setPinAttempted(true);
                            setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                          }}
                        />
                      </label>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={code.length < 1 || pin.length !== 4}
                      >
                        {t('pages.attendance.submitPin')}
                      </button>
                    </form>
                  </>
                )}
                {method === 'qr' && (
                  <>
                    <h2 className="h2">{t('pages.attendance.qrTitle')}</h2>
                    <p className="sec muted">{t('pages.attendance.qrIntro')}</p>
                    <div className="qr-scan-panel">
                      <Icon name="scan" size={24} />
                      <strong>{t('pages.attendance.scanCard')}</strong>
                    </div>
                    <div className="kiosk-card-list">
                      {DEMO_CHECK_IN_CREDENTIALS.map((item) => ({
                        ...item,
                        name: state.children[item.childId]?.name ?? '',
                      })).map((credential) => (
                        <button
                          key={credential.cardId}
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => void tryQr(credential.cardId)}
                        >
                          {credential.cardId} · {credential.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {method === 'face' && (
                  <>
                    <h2 className="h2">{t('pages.attendance.faceTab')}</h2>
                    <div className="face-placeholder" aria-hidden="true">
                      <span className="face-card">
                        <span className="face-card-band" />
                        <span className="face-card-line" />
                        <span className="face-card-slash" />
                      </span>
                      <Icon name="lock" size={24} />
                    </div>
                    <div className="notice notice-info">
                      <Icon name="info" size={18} />
                      <p className="sec">{t('pages.attendance.faceUnavailable')}</p>
                    </div>
                    <p className="cap muted">{t('pages.attendance.faceNoFace')}</p>
                  </>
                )}
              </>
            )}
          </section>
          <details className="card card-pad stack kiosk-credentials">
            <summary>{t('pages.attendance.showDemoCredentials')}</summary>
            <div className="credential-grid" aria-labelledby="demo-credential-title">
              <h2 className="sr-only" id="demo-credential-title">
                {t('pages.attendance.demoCredentials')}
              </h2>
              <strong>{t('pages.attendance.credentialName')}</strong>
              <strong>{t('pages.attendance.credentialCode')}</strong>
              <strong>{t('pages.attendance.credentialPin')}</strong>
              <strong>{t('pages.attendance.credentialCard')}</strong>
              {credentials.map((credential) => (
                <div className="credential-row" key={credential.childCode}>
                  <span>{credential.name}</span>
                  <code>{credential.childCode}</code>
                  <code>{pinAttempted ? '••••' : credential.pin}</code>
                  <code>{credential.cardId}</code>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </main>
  );
}

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
  const [dialog, setDialog] = useState<AttendanceRow | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [trails, setTrails] = useState<
    Record<string, import('../attendance/domain').AttendanceAmendment[]>
  >({});
  const fallbackFocusRef = useRef<HTMLElement>(null);
  const fallbackFocusId = useRef<string | null>(null);
  useEffect(() => {
    let live = true;
    setLoading(true);
    void port.getAttendanceRegister(CLASS_ID, date, actor(role.role)).then(
      (register) => {
        if (live) {
          setRows(register.rows);
          setLoading(false);
        }
      },
      () => {
        if (live) setLoading(false);
      },
    );
    return () => {
      live = false;
    };
  }, [port, date, role.role, state]);
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
                  aria-label={t('pages.attendance.selectDay')}
                >
                  {dates.map((day) => (
                    <option key={day} value={day}>
                      {fmtDate(day)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="sec muted">
                {canAmend
                  ? t('pages.attendance.historyReadOnly')
                  : t('pages.attendance.readOnlyPast')}
              </p>
            </div>
            {error && (
              <div className="notice notice-danger" role="alert">
                <Icon name="alertCircle" size={18} />
                <p className="sec">{error}</p>
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
              ) : rows.length === 0 ? (
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
                                {row.late ? ` · ${t('pages.attendance.late')}` : ''}
                              </span>
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
                        <details className="amendment-details">
                          <summary>
                            {t('pages.attendance.amendmentTrail')} ·{' '}
                            {(record ? trails[record.id]?.length : 0) ?? 0}
                          </summary>
                          {!record || !trails[record.id]?.length ? (
                            <p className="cap muted">{t('pages.attendance.noAmendments')}</p>
                          ) : (
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
                          )}
                        </details>
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
                  setMessage(t('pages.attendance.historySaved'));
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
