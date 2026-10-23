import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccessDenied } from '../../components/AccessDenied';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { DEMO_CHECK_IN_CREDENTIALS } from '../../attendance/demo';
import { CLASS_NAME } from '../../data/demo';
import { useI18n } from '../../i18n';
import { useDataPort, usePortfolio } from '../../store/PortfolioContext';
import { useRole } from '../../roles/RoleContext';
import { localTime } from '../../attendance/domain';
import { PIN_ATTEMPTS_BEFORE_LOCKOUT, PIN_LOCKOUT_MS } from '../../attendance/policy';
import { DEMO_END, now } from '../../utils/clock';
import { KIOSK_TAB_LABELS, REFUSAL_KEYS, type KioskMethod } from './shared';

export function AttendanceKiosk() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { state } = usePortfolio();
  const port = useDataPort();
  const role = useRole();
  const [method, setMethod] = useState<KioskMethod>('pin');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [pinAttempted, setPinAttempted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ name: string; at: string } | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [staffPin, setStaffPin] = useState('');
  const [staffFailures, setStaffFailures] = useState(0);
  const [staffLockedUntil, setStaffLockedUntil] = useState(0);
  const [staffError, setStaffError] = useState('');
  const codeRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const resetFocusRef = useRef(false);
  const resetAttempt = () => {
    resetFocusRef.current = true;
    setSuccess(null);
    setCode('');
    setPin('');
    setPinAttempted(false);
    setError('');
  };
  const credentials = DEMO_CHECK_IN_CREDENTIALS.slice(0, 3).map((credential) => ({
    ...credential,
    name: state.children[credential.childId]?.name ?? '',
  }));
  useEffect(() => {
    if (!success) return;
    successRef.current?.focus();
    const timer = window.setTimeout(resetAttempt, 5000);
    return () => window.clearTimeout(timer);
  }, [success]);
  useEffect(() => {
    if (success || !resetFocusRef.current) return;
    resetFocusRef.current = false;
    if (method === 'pin') codeRef.current?.focus();
    else document.querySelector<HTMLElement>('.kiosk-card-list button')?.focus();
  }, [method, success]);
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
    const attemptedAt = now();
    const result = await port.checkInWithPin(code.trim().toUpperCase(), pin);
    setPin('');
    if (!result.ok) {
      const childCode = code.trim().toUpperCase();
      if (result.reason === 'pin-locked') {
        const lockout = state.attendancePinLockouts[childCode];
        const lockedUntil = Math.min(
          Date.parse(lockout?.lockedUntil ?? new Date(Date.parse(attemptedAt) + PIN_LOCKOUT_MS).toISOString()),
          DEMO_END,
        );
        const minutes = Math.max(
          1,
          Math.ceil((lockedUntil - Date.parse(attemptedAt)) / 60000),
        );
        setError(t('pages.attendance.pinLocked', { count: minutes }));
      } else if (result.reason === 'pin-invalid') {
        const failedAttempts = (state.attendancePinLockouts[childCode]?.failedAttempts ?? 0) + 1;
        if (failedAttempts < PIN_ATTEMPTS_BEFORE_LOCKOUT) {
          setError(
            t('pages.attendance.pinAttemptsLeft', {
              count: PIN_ATTEMPTS_BEFORE_LOCKOUT - failedAttempts,
            }),
          );
        } else {
          setError(t(REFUSAL_KEYS[result.reason]));
        }
      } else setError(t(REFUSAL_KEYS[result.reason]));
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
    <main id="main" className="kiosk-screen">
      {denied ? (
        <div className="page attendance-page kiosk-page">
          <AccessDenied title="pages.attendance.kioskTitle" />
        </div>
      ) : (
        <div className="page attendance-page kiosk-page">
          <div className="notice notice-info kiosk-demo-banner" role="note">
            <Icon name="info" size={18} />
            <strong>{t('pages.attendance.kioskDemoBanner')}</strong>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setStaffPin('');
                setStaffError('');
                setExitOpen(true);
              }}
            >
              {t('pages.attendance.exitKiosk')}
            </button>
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
                aria-label={
                  item === 'face'
                    ? t('pages.attendance.kioskFaceUnavailableLabel')
                    : t(KIOSK_TAB_LABELS[item])
                }
                data-unavailable={item === 'face' || undefined}
                onClick={() => {
                  setMethod(item);
                  setError('');
                  setSuccess(null);
                }}
              >
                {item === 'face' ? (
                  <span className="kiosk-face-tab-label">
                    <span>{t('pages.attendance.faceTab')}</span>
                    <small>{t('pages.attendance.faceUnavailableTab')}</small>
                  </span>
                ) : t(KIOSK_TAB_LABELS[item])}
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
                <h2 className="h2" ref={successRef} tabIndex={-1}>
                  {t('pages.attendance.pinSuccess', {
                    name: success.name,
                    time: success.at,
                  })}
                </h2>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={resetAttempt}
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
                          ref={codeRef}
                          className="input"
                          type="text"
                          autoComplete="off"
                          autoCapitalize="characters"
                          inputMode="text"
                          pattern="[A-Z]{2}-[0-9]{4}"
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
                      <Icon name="info" size={24} />
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
                  <span data-label={t('pages.attendance.credentialName')}>{credential.name}</span>
                  <code data-label={t('pages.attendance.credentialCode')}>
                    {credential.childCode}
                  </code>
                  <code data-label={t('pages.attendance.credentialPin')}>
                    {pinAttempted ? '••••' : credential.pin}
                  </code>
                  <code data-label={t('pages.attendance.credentialCard')}>{credential.cardId}</code>
                </div>
              ))}
            </div>
            <p className="cap muted">
              {t('pages.attendance.staffCredential', { pin: '8642' })}
            </p>
          </details>
          {exitOpen && (
            <Modal
              labelledBy="exit-kiosk-title"
              onClose={() => setExitOpen(false)}
              backdropClassName="dialog-backdrop attendance-dialog-backdrop"
              panelClassName="card card-pad stack attendance-dialog"
            >
              <h2 className="h2" id="exit-kiosk-title">
                {t('pages.attendance.exitDialogTitle')}
              </h2>
              <p className="sec muted">{t('pages.attendance.exitDialogHelp')}</p>
              <label className="stack sec" htmlFor="staff-pin">
                {t('pages.attendance.staffPinLabel')}
                <input
                  id="staff-pin"
                  className="input"
                  type="password"
                  autoComplete="off"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  value={staffPin}
                  onChange={(event) => {
                    setStaffPin(event.target.value.replace(/\D/g, '').slice(0, 4));
                    setStaffError('');
                  }}
                />
              </label>
              {staffError && <p role="alert" className="field-error">{staffError}</p>}
              <div className="row">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setExitOpen(false)}
                >
                  {t('pages.attendance.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={staffPin.length !== 4}
                  onClick={() => {
                    if (Date.now() < staffLockedUntil) {
                      setStaffError(t('pages.attendance.staffPinLocked'));
                    } else if (staffPin === '8642') {
                      setStaffPin('');
                      setExitOpen(false);
                      navigate('/attendance');
                    } else {
                      const failures = staffFailures + 1;
                      setStaffFailures(failures);
                      setStaffPin('');
                      setStaffError(
                        failures >= PIN_ATTEMPTS_BEFORE_LOCKOUT
                          ? t('pages.attendance.staffPinLocked')
                          : t('pages.attendance.staffPinInvalid', {
                              count: PIN_ATTEMPTS_BEFORE_LOCKOUT - failures,
                            }),
                      );
                      if (failures >= PIN_ATTEMPTS_BEFORE_LOCKOUT) {
                        setStaffLockedUntil(Date.now() + PIN_LOCKOUT_MS);
                      }
                    }
                  }}
                >
                  {t('pages.attendance.confirmExit')}
                </button>
              </div>
            </Modal>
          )}
        </div>
      )}
    </main>
  );
}
