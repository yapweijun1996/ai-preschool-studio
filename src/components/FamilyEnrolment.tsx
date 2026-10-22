import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from './Icon';
import { Notice } from './ui';
import { useI18n } from '../i18n';
import { useRole } from '../roles/RoleContext';
import { demoRole } from '../roles';
import { useDataPort, usePortfolio } from '../store/PortfolioContext';
import type { PortRefusal, PortResult } from '../data/port';
import {
  validateChild,
  validateCollector,
  validateGuardian,
  type AuthorisedCollector,
  type Child,
  type Guardian
} from '../children/domain';
import type { FieldError } from '../children/domain';
import type { Actor } from '../store/reducer';
import type { TKey } from '../i18n';

type Dialog = 'child' | 'guardian' | 'collector' | 'removeGuardian' | 'removeCollector' | 'withdraw' | null;
type FormFields = Record<string, string>;
type FormErrors = Partial<Record<string, FieldError>>;

const emptyFields: FormFields = {
  name: '', relationship: '', phone: '', email: '', preferredLanguage: 'English', dateOfBirth: '',
  enrolledOn: '', homeLanguages: '', validFrom: '', validTo: '', note: '', allergies: '', medical: '', isPrimary: ''
};
const ERROR_KEYS: Record<FieldError, TKey> = {
  required: 'pages.children.errorRequired',
  'phone-format': 'pages.children.errorPhone',
  'email-format': 'pages.children.errorEmail',
  'date-format': 'pages.children.errorDate',
  'date-order': 'pages.children.errorDateOrder'
};
const REFUSAL_KEYS: Record<PortRefusal, TKey> = {
  'unknown-child': 'pages.children.refusal.unknownChild',
  'invalid-child': 'pages.children.refusal.invalidChild',
  'unknown-guardian': 'pages.children.refusal.unknownGuardian',
  'invalid-guardian': 'pages.children.refusal.invalidGuardian',
  'primary-guardian-required': 'pages.children.refusal.primaryGuardian',
  'unknown-collector': 'pages.children.refusal.unknownCollector',
  'invalid-collector': 'pages.children.refusal.invalidCollector',
  'report-in-review': 'pages.children.refusal.reportInReview',
  'invalid-target': 'pages.children.refusal.invalidTarget',
  'record-child-mismatch': 'pages.children.refusal.invalidTarget',
  'unknown-student': 'pages.children.refusal.invalidTarget',
  'wrong-child-observation': 'pages.children.refusal.invalidTarget',
  'date-outside-period': 'pages.children.refusal.invalidTarget',
  'report-locked': 'pages.children.refusal.invalidTarget',
  'report-not-editable': 'pages.children.refusal.invalidTarget',
  'not-ready': 'pages.children.refusal.invalidTarget',
  'unverified-claims': 'pages.children.refusal.invalidTarget',
  'no-observations': 'pages.children.refusal.invalidTarget',
  'not-approved': 'pages.children.refusal.invalidTarget',
  'reason-required': 'pages.children.refusal.invalidTarget',
  'status-change-not-allowed': 'pages.children.refusal.invalidTarget'
};

function maskedPhone(phone: string) {
  return phone.replace(/^\+65 9\d{3} /, '+65 9••• ');
}

export function FamilyEnrolment({ childId }: { childId: string }) {
  const { t, fmtDate } = useI18n();
  const role = useRole();
  const { state } = usePortfolio();
  const port = useDataPort();
  const child = state.children[childId];
  const guardians = state.guardians.filter((guardian) => guardian.childIds.includes(childId));
  const collectors = state.collectors.filter((collector) => collector.childId === childId);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | undefined>();
  const [selectedCollector, setSelectedCollector] = useState<AuthorisedCollector | undefined>();
  const [fields, setFields] = useState<FormFields>(emptyFields);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const firstField = useRef<HTMLInputElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const targetChildId = useRef(childId);
  const actor: Actor = { role: role.role, name: demoRole(role.role).name };
  const editable = role.can('children.edit');

  useEffect(() => {
    if (dialog) firstField.current?.focus();
    else if (returnFocus.current) returnFocus.current.focus();
  }, [dialog]);

  const openDialog = (
    kind: Exclude<Dialog, null>,
    trigger: HTMLElement,
    guardian?: Guardian,
    collector?: AuthorisedCollector
  ) => {
    returnFocus.current = trigger;
    targetChildId.current = childId;
    setSelectedGuardian(guardian);
    setSelectedCollector(collector);
    setErrors({});
    setFormError('');
    setSaved(false);
    if (kind === 'child' && child) {
      setFields({
        ...emptyFields, name: child.name, dateOfBirth: child.dateOfBirth, enrolledOn: child.enrolledOn,
        homeLanguages: child.homeLanguages, allergies: child.notes.allergies ?? '', medical: child.notes.medical ?? ''
      });
    } else if (kind === 'guardian' && guardian) {
      setFields({
        ...emptyFields, name: guardian.name, relationship: guardian.relationship, phone: guardian.phone,
        email: guardian.email, preferredLanguage: guardian.preferredLanguage
      });
    } else if (kind === 'collector' && collector) {
      setFields({
        ...emptyFields, name: collector.name, relationship: collector.relationship,
        validFrom: collector.validFrom, validTo: collector.validTo ?? '', note: collector.note
      });
    }
    else setFields({ ...emptyFields, validFrom: '2026-01-01' });
    setDialog(kind);
  };

  const close = () => { setDialog(null); setErrors({}); setFormError(''); };
  const setField = (key: string, value: string) => setFields((current) => ({ ...current, [key]: value }));
  const field = (key: string, label: string, type = 'text') => (
    <label className="field" key={key}>
      <span className="field-label">{label}</span>
      <input
        ref={key === 'name' ? firstField : undefined}
        className="input"
        type={type}
        value={fields[key] ?? ''}
        onChange={(event) => setField(key, event.target.value)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
      />
      {errors[key] && <span className="field-error" id={`${key}-error`}>{t(ERROR_KEYS[errors[key]])}</span>}
    </label>
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!child) return;
    setErrors({}); setFormError(''); setSaving(true); setSaved(false);
    let result: PortResult<unknown>;
    if (dialog === 'child') {
      const updated: Child = {
        ...child,
        name: fields.name,
        dateOfBirth: fields.dateOfBirth,
        enrolledOn: fields.enrolledOn,
        homeLanguages: fields.homeLanguages,
        notes: { allergies: fields.allergies, medical: fields.medical }
      };
      const validation = validateChild(updated);
      setErrors(validation);
      if (Object.keys(validation).length) { setSaving(false); setFormError(t('pages.children.formError')); return; }
      result = await port.updateChild(updated, actor);
    } else if (dialog === 'guardian') {
      const guardian: Guardian = {
        id: selectedGuardian?.id ?? `guardian-${targetChildId.current}-${state.nextAuditNumber}`,
        childIds: selectedGuardian?.childIds ?? [targetChildId.current],
        name: fields.name,
        relationship: fields.relationship,
        phone: fields.phone,
        email: fields.email,
        preferredLanguage: fields.preferredLanguage,
        isPrimary: fields.isPrimary
          ? fields.isPrimary === 'true'
          : selectedGuardian?.isPrimary ?? guardians.length === 0
      };
      const validation = validateGuardian(guardian);
      setErrors(validation);
      if (Object.keys(validation).length) { setSaving(false); setFormError(t('pages.children.formError')); return; }
      result = await port.upsertGuardian(guardian, actor);
    } else if (dialog === 'collector') {
      const collector: AuthorisedCollector = {
        id: selectedCollector?.id ?? `collector-${targetChildId.current}-${state.nextAuditNumber}`,
        childId: targetChildId.current,
        name: fields.name,
        relationship: fields.relationship,
        validFrom: fields.validFrom,
        ...(fields.validTo ? { validTo: fields.validTo } : {}),
        note: fields.note
      };
      const validation = validateCollector(collector);
      setErrors(validation);
      if (Object.keys(validation).length) { setSaving(false); setFormError(t('pages.children.formError')); return; }
      result = await port.upsertCollector(collector, actor);
    } else { setSaving(false); return; }
    setSaving(false);
    if (result.ok) { setSaved(true); close(); }
    else { setFormError(t(REFUSAL_KEYS[result.reason])); }
  };

  const removeOrWithdraw = async () => {
    if (!dialog) return;
    setSaving(true); setFormError('');
    const result: PortResult<unknown> = dialog === 'removeGuardian' && selectedGuardian
      ? await port.removeGuardian(selectedGuardian.id, actor)
      : dialog === 'removeCollector' && selectedCollector
        ? await port.removeCollector(selectedCollector.id, actor)
        : dialog === 'withdraw' ? await port.withdrawChild(childId, actor) : { ok: false, reason: 'invalid-target' };
    setSaving(false);
    if (result.ok) { setSaved(true); close(); }
    else setFormError(t(REFUSAL_KEYS[result.reason]));
  };

  if (!child) return null;
  const classRecord = state.classes.find((item) => item.id === child.classId);
  const familyCanView = role.can('contacts.view');
  const canViewHealth = role.can('health.view');
  const activeDialog = dialog !== null;
  const dialogTitle: TKey = dialog === 'child'
    ? 'pages.children.dialog.child'
    : dialog === 'guardian'
      ? 'pages.children.dialog.guardian'
      : dialog === 'collector'
        ? 'pages.children.dialog.collector'
        : dialog === 'withdraw'
          ? 'pages.children.dialog.withdraw'
          : 'pages.children.dialog.remove';

  return (
    <section className="card family-section stack" aria-labelledby="family-heading">
      <div className="card-head row">
        <h2 className="h2 grow" id="family-heading">{t('pages.children.familyTitle')}</h2>
        {editable && child.status === 'active' && (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={(event) => openDialog('child', event.currentTarget)}
          >
            <Icon name="edit" size={16} />{t('pages.children.editChild')}
          </button>
        )}
      </div>
      <div className="family-facts">
        <div>
          <span className="cap muted">{t('pages.children.class')}</span>
          <strong>{classRecord?.name ?? '—'}</strong>
        </div>
        <div>
          <span className="cap muted">
            {t('pages.children.levelYear', {
              level: classRecord?.level ?? '',
              year: classRecord?.year ?? ''
            })}
          </span>
          <strong>{t(`pages.children.${child.status}`)}</strong>
        </div>
        <div>
          <span className="cap muted">{t('pages.children.dateOfBirth')}</span>
          <strong>{fmtDate(child.dateOfBirth)}</strong>
        </div>
        <div>
          <span className="cap muted">{t('pages.children.enrolledOn')}</span>
          <strong>{fmtDate(child.enrolledOn)}</strong>
        </div>
        <div>
          <span className="cap muted">{t('pages.children.homeLanguages')}</span>
          <strong>{child.homeLanguages}</strong>
        </div>
      </div>
      {!editable && <p className="cap muted">{t('pages.children.readOnlyReason')}</p>}
      <section className="family-subsection" aria-labelledby="guardians-heading">
        <div className="row">
          <h3 className="h3 grow" id="guardians-heading">{t('pages.children.guardians')}</h3>
          {familyCanView && editable && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={(event) => openDialog('guardian', event.currentTarget)}
            >
              <Icon name="plus" size={16} />{t('pages.children.addGuardian')}
            </button>
          )}
        </div>
        {!familyCanView ? (
          <p className="sec muted">{t('pages.children.contactsRestricted')}</p>
        ) : guardians.length ? guardians.map((guardian) => (
          <div className="family-record" key={guardian.id}>
            <div className="grow">
              <strong>{guardian.name}</strong>
              <p className="sec muted">
                {guardian.relationship}{guardian.isPrimary ? ` · ${t('pages.children.primary')}` : ''}
              </p>
              <p className="sec num">
                {role.can('contacts.view') ? guardian.phone : maskedPhone(guardian.phone)} · {guardian.email}
              </p>
            </div>
            {editable && (
              <div className="row">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={(event) => openDialog('guardian', event.currentTarget, guardian)}
                >
                  {t('pages.children.edit')}
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={t('pages.children.removeGuardianFor', { name: guardian.name })}
                  onClick={(event) => openDialog('removeGuardian', event.currentTarget, guardian)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            )}
          </div>
        )) : <p className="sec muted">{t('pages.children.noGuardians')}</p>}
      </section>
      <section className="family-subsection" aria-labelledby="collectors-heading">
        <div className="row">
          <h3 className="h3 grow" id="collectors-heading">{t('pages.children.collectors')}</h3>
          {familyCanView && editable && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={(event) => openDialog('collector', event.currentTarget)}
            >
              <Icon name="plus" size={16} />{t('pages.children.addCollector')}
            </button>
          )}
        </div>
        {!familyCanView ? (
          <p className="sec muted">{t('pages.children.contactsRestricted')}</p>
        ) : collectors.length ? collectors.map((collector) => (
          <div className="family-record" key={collector.id}>
            <div className="grow">
              <strong>{collector.name}</strong>
              <p className="sec muted">
                {collector.relationship} · {fmtDate(collector.validFrom)}
                {collector.validTo
                  ? ` – ${fmtDate(collector.validTo)}`
                  : ` · ${t('pages.children.noExpiry')}`}
              </p>
              <p className="cap muted">{t('pages.children.photoIdNote')}</p>
            </div>
            {editable && (
              <div className="row">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={(event) => openDialog('collector', event.currentTarget, undefined, collector)}
                >
                  {t('pages.children.edit')}
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={t('pages.children.removeCollectorFor', { name: collector.name })}
                  onClick={(event) => openDialog('removeCollector', event.currentTarget, undefined, collector)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            )}
          </div>
        )) : <p className="sec muted">{t('pages.children.noCollectors')}</p>}
      </section>
      <section className="family-health" aria-labelledby="health-heading">
        <h3 className="h3" id="health-heading">{t('pages.children.healthNotes')}</h3>
        {canViewHealth ? (
          <div className="stack">
            <p className="sec">
              <strong>{t('pages.children.allergies')}:</strong>
              {' '}{child.notes.allergies || t('pages.children.noneRecorded')}
            </p>
            <p className="sec">
              <strong>{t('pages.children.medical')}:</strong>
              {' '}{child.notes.medical || t('pages.children.noneRecorded')}
            </p>
          </div>
        ) : <p className="sec muted">{t('pages.children.healthRestricted')}</p>}
      </section>
      {editable && child.status === 'active' && (
        <button
          className="btn btn-ghost danger-text"
          type="button"
          onClick={(event) => openDialog('withdraw', event.currentTarget)}
        >
          {t('pages.children.withdraw')}
        </button>
      )}
      {saved && <Notice tone="success" icon="check" role="status">{t('pages.children.saved')}</Notice>}
      {activeDialog && (
        <div
          className="dialog-backdrop"
          onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
        >
          <section
            className="card stack family-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="family-dialog-title"
            onKeyDown={(event) => { if (event.key === 'Escape') close(); }}
          >
            <div className="row">
              <h2 id="family-dialog-title" className="h2 grow">{t(dialogTitle)}</h2>
              <button
                className="icon-btn"
                type="button"
                aria-label={t('pages.children.close')}
                onClick={close}
              >
                <Icon name="close" />
              </button>
            </div>
            {formError && (
              <div role="alert" className="notice notice-danger">
                <Icon name="alert" />
                <div>
                  <strong>{t('pages.children.formError')}</strong>
                  <p className="sec">{formError}</p>
                </div>
              </div>
            )}
            {dialog === 'removeGuardian' && (
              <p className="sec">
                {t('pages.children.confirmRemoveGuardian', { name: selectedGuardian?.name ?? '' })}
              </p>
            )}
            {dialog === 'removeCollector' && (
              <p className="sec">
                {t('pages.children.confirmRemoveCollector', { name: selectedCollector?.name ?? '' })}
              </p>
            )}
            {dialog === 'withdraw' && (
              <p className="sec">{t('pages.children.confirmWithdraw', { name: child.name })}</p>
            )}
            {dialog === 'child' && <form className="stack" onSubmit={(event) => void submit(event)} noValidate>
              {field('name', t('pages.children.childName'))}
              {field('dateOfBirth', t('pages.children.dateOfBirth'), 'date')}
              {field('enrolledOn', t('pages.children.enrolledOn'), 'date')}
              {field('homeLanguages', t('pages.children.homeLanguages'))}
              {field('allergies', t('pages.children.allergies'))}
              {field('medical', t('pages.children.medical'))}
              <div className="row">
                <button className="btn btn-secondary" type="button" onClick={close}>
                  {t('pages.shared.cancel')}
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? t('pages.children.saving') : t('pages.shared.save')}
                </button>
              </div>
            </form>}
            {dialog === 'guardian' && <form className="stack" onSubmit={(event) => void submit(event)} noValidate>
              {field('name', t('pages.children.guardianName'))}
              {field('relationship', t('pages.children.relationship'))}
              {field('phone', t('pages.children.phone'))}
              {field('email', t('pages.children.email'))}
              {field('preferredLanguage', t('pages.children.preferredLanguage'))}
              <label className="row sec">
                <input
                  type="checkbox"
                  checked={fields.isPrimary
                    ? fields.isPrimary === 'true'
                    : selectedGuardian?.isPrimary ?? guardians.length === 0}
                  onChange={(event) => setField('isPrimary', String(event.target.checked))}
                />
                {t('pages.children.primaryGuardian')}
              </label>
              <div className="row">
                <button className="btn btn-secondary" type="button" onClick={close}>
                  {t('pages.shared.cancel')}
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? t('pages.children.saving') : t('pages.shared.save')}
                </button>
              </div>
            </form>}
            {dialog === 'collector' && <form className="stack" onSubmit={(event) => void submit(event)} noValidate>
              {field('name', t('pages.children.collectorName'))}
              {field('relationship', t('pages.children.relationship'))}
              {field('validFrom', t('pages.children.validFrom'), 'date')}
              {field('validTo', t('pages.children.validToOptional'), 'date')}
              {field('note', t('pages.children.note'))}
              <p className="cap muted">{t('pages.children.noIdentityNumbers')}</p>
              <div className="row">
                <button className="btn btn-secondary" type="button" onClick={close}>
                  {t('pages.shared.cancel')}
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? t('pages.children.saving') : t('pages.shared.save')}
                </button>
              </div>
            </form>}
            {['removeGuardian', 'removeCollector', 'withdraw'].includes(dialog) && (
              <div className="row">
                <button className="btn btn-secondary" type="button" onClick={close}>
                  {t('pages.shared.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={saving}
                  onClick={() => void removeOrWithdraw()}
                >
                  {saving ? t('pages.children.saving') : t('pages.children.confirm')}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
