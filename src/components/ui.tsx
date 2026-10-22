import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { type ReportStatus } from '../data/demo';
import { frameworkFor, type Milestone } from '../framework';
import type { SaveStatus } from '../hooks/useAutosave';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { Icon, type IconName } from './Icon';

const STATUS_STYLE: Record<ReportStatus, { cls: string; icon?: IconName }> = {
  notStarted: { cls: 'st-notstarted' },
  draft: { cls: 'st-draft', icon: 'file' },
  review: { cls: 'st-review', icon: 'eye' },
  changes: { cls: 'st-changes', icon: 'alert' },
  approved: { cls: 'st-approved', icon: 'check' }
};

/** Report status: colour + icon + word, never colour alone. */
export function StatusLabel({ status }: { status: ReportStatus }) {
  const s = STATUS_STYLE[status];
  const labels = useLabels();
  return (
    <span className={`status ${s.cls}`}>
      {s.icon && <Icon name={s.icon} size={14} />}
      {labels.status(status)}
    </span>
  );
}

export function VerifyLabel({ children }: { children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <span className="status st-verify">
      <Icon name="alert" size={14} />
      {children ?? t('common.needsVerification')}
    </span>
  );
}

export function MockProviderLabel() {
  const { t } = useI18n();
  return <span className="status st-draft">{t('common.mockProvider')}</span>;
}

export function SourceChip({ id }: { id: string }) {
  const { t } = useI18n();
  return (
    <span className="src" title={t('shell.ui.sourceTitle', { id })}>
      {id}
    </span>
  );
}

/**
 * Milestone as dots + word; null means the domain has no observation yet (no dots, never a level).
 * Pass a report's framework version so an approved report keeps its own scale and words.
 */
export function MilestoneDots({ milestone, version }: { milestone: Milestone | null; version?: string }) {
  const labels = useLabels(version);
  const { t } = useI18n();
  if (!milestone) return <span className="ms ms-none">{t('common.notObserved')}</span>;
  const scale = frameworkFor(version).scale;
  const m = scale.find((x) => x.key === milestone)!;
  return (
    <span className="ms">
      <span className="dots" aria-hidden="true">
        {scale.map((_, idx) => idx + 1).map((i) => (
          <span key={i} className={`dot${i <= m.filled ? ' on' : ''}`} />
        ))}
      </span>
      {labels.milestone(m.key)}
    </span>
  );
}

export function Avatar({ initials, size, label }: { initials: string; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  return (
    <span className={`avatar${size ? ` avatar-${size}` : ''}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {initials}
    </span>
  );
}

export function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  const { t } = useI18n();
  if (status.kind === 'failed') {
    return (
      <span className="row" role="alert">
        <span className="status st-failed">
          <Icon name="alertCircle" size={14} />
          {t('shell.ui.saveFailed')}
        </span>
        <button className="btn btn-secondary" type="button" onClick={onRetry}>
          <Icon name="undo" size={18} />
          {t('shell.ui.retry')}
        </button>
      </span>
    );
  }
  if (status.kind === 'idle') return null;
  return (
    <span className="save-state" role="status">
      {status.kind === 'saved' && <Icon name="check" size={16} className="ic-primary" />}
      {status.kind === 'saving' && <Icon name="loader" size={16} className="spin" />}
      {status.kind === 'saved' ? t('shell.ui.savedAt', { time: status.at }) : status.kind === 'saving' ? t('shell.ui.saving') : t('shell.ui.unsaved')}
    </span>
  );
}

export function Notice({ tone, icon, children, id, role }: { tone: 'warning' | 'danger' | 'success' | 'info'; icon: IconName; children: ReactNode; id?: string; role?: 'status' | 'alert' }) {
  return (
    <div className={`notice notice-${tone}`} id={id} role={role}>
      <Icon name={icon} size={18} />
      <div className="grow stack" style={{ gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * A row that scrolls sideways. Fades its right edge while more content is hidden there,
 * so a half-visible last item reads as "scroll for more", not as a clipping bug.
 */
export function ScrollRow({ children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => el.setAttribute('data-more', String(el.scrollLeft + el.clientWidth < el.scrollWidth - 1));
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : undefined;
    ro?.observe(el);
    // Content changes (e.g. switching language) change the scroll width without resizing the row.
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(update) : undefined;
    mo?.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, []);
  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
