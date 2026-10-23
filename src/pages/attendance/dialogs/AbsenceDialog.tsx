import { useState, type RefObject } from 'react';
import type { AbsenceReason, AttendanceRow } from '../../../attendance/domain';
import { Modal } from '../../../components/Modal';
import { useI18n } from '../../../i18n';
import { REASON_KEYS } from '../shared';

export function AbsenceDialog({
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
      backdropClassName="dialog-backdrop attendance-dialog-backdrop"
      panelClassName="card card-pad stack attendance-dialog"
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
