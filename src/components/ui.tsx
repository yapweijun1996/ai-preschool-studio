import type { ReactNode } from 'react';
import { MILESTONES, REPORT_STATUS_LABEL, type Milestone, type ReportStatus } from '../data/demo';
import type { SaveStatus } from '../hooks/useAutosave';
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
  return (
    <span className={`status ${s.cls}`}>
      {s.icon && <Icon name={s.icon} size={14} />}
      {REPORT_STATUS_LABEL[status]}
    </span>
  );
}

export function VerifyLabel({ children = 'Needs teacher verification' }: { children?: ReactNode }) {
  return (
    <span className="status st-verify">
      <Icon name="alert" size={14} />
      {children}
    </span>
  );
}

export function MockProviderLabel() {
  return <span className="status st-draft">Mock provider</span>;
}

export function SourceChip({ id }: { id: string }) {
  return (
    <span className="src" title={`Source observation ${id}`}>
      {id}
    </span>
  );
}

export function MilestoneDots({ milestone }: { milestone: Milestone }) {
  const m = MILESTONES.find((x) => x.key === milestone)!;
  return (
    <span className="ms">
      <span className="dots" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`dot${i <= m.filled ? ' on' : ''}`} />
        ))}
      </span>
      {m.label}
    </span>
  );
}

export function Avatar({ initials, size, label }: { initials: string; size?: 'sm' | 'lg'; label?: string }) {
  return (
    <span className={`avatar${size ? ` avatar-${size}` : ''}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {initials}
    </span>
  );
}

export function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status.kind === 'failed') {
    return (
      <span className="row" role="alert">
        <span className="status st-failed">
          <Icon name="alertCircle" size={14} />
          Save failed
        </span>
        <button className="btn btn-secondary" type="button" onClick={onRetry}>
          <Icon name="undo" size={18} />
          Retry
        </button>
      </span>
    );
  }
  return (
    <span className="save-state" role="status">
      {status.kind === 'saved' && <Icon name="check" size={16} className="ic-primary" />}
      {status.kind === 'saving' && <Icon name="loader" size={16} className="spin" />}
      {status.kind === 'saved' ? `Saved at ${status.at}` : status.kind === 'saving' ? 'Saving…' : 'Unsaved changes'}
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
