import { useState, type RefObject } from 'react';
import type { AbsenceReason, AmendmentField, AttendanceRow } from '../../../attendance/domain';
import { Modal } from '../../../components/Modal';
import { useI18n } from '../../../i18n';
import { atTime, REASON_KEYS, timeValue } from '../shared';

export function AmendDialog({
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
  const [error, setError] = useState<'reason' | 'absence' | null>(null);
  const [showNoChange, setShowNoChange] = useState(false);
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
        : (record[field] ?? '');
  const noChange = to === fromValue;
  return (
    <Modal
      labelledBy="amend-title"
      onClose={onClose}
      backdropClassName="dialog-backdrop attendance-dialog-backdrop"
      panelClassName="card card-pad stack attendance-dialog"
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
            setError(null);
            setShowNoChange(false);
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
              setError(null);
              setShowNoChange(e.target.value === fromValue);
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
            onChange={(e) => {
              setTo(e.target.value);
              setError(null);
              setShowNoChange(e.target.value === fromValue);
            }}
          />
        ) : (
          <select
            id="amend-value"
            className="input"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setError(null);
              setShowNoChange(e.target.value === fromValue);
            }}
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
            onChange={(e) => {
              setAbsenceReason(e.target.value as AbsenceReason | '');
              setError(null);
            }}
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
            setError(null);
          }}
        />
      </label>
      <p className="cap muted">{t('pages.attendance.amendHelp')}</p>
      <p className="cap num" aria-live="polite">
        {t('pages.attendance.characters', { count: reason.length })}
      </p>
      {error === 'absence' && (
        <p role="alert" className="field-error">
          {t('pages.attendance.requiredReason')}
        </p>
      )}
      {error === 'reason' && (
        <p role="alert" className="field-error">
          {t('pages.attendance.errorReason')}
        </p>
      )}
      {showNoChange && noChange && (
        <p role="status" className="field-error">
          {t('pages.attendance.noOpAmendment')}
        </p>
      )}
      {saveError && (
        <p role="alert" className="field-error">
          {saveError}
        </p>
      )}
      <div className="row">
        <button className="btn btn-ghost" type="button" disabled={saving} onClick={onClose}>
          {t('pages.attendance.cancel')}
        </button>
        <button
          className="btn btn-primary"
          type="button"
          disabled={saving || noChange}
          onClick={async () => {
            if (statusToAbsent && !absenceReason) {
              setError('absence');
              return;
            }
            if (reason.trim().length < 5 || reason.length > 200) {
              setError('reason');
              return;
            }
            const value = timeField ? atTime(to, record.date) : to;
            setSaving(true);
            if (
              await onSave(
                field,
                value,
                reason,
                statusToAbsent ? (absenceReason as AbsenceReason) : undefined,
              )
            ) {
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
