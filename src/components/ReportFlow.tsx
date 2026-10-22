import type { ReportStatus } from '../data/demo';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { Icon } from './Icon';

export const FLOW: ReportStatus[] = ['draft', 'review', 'changes', 'approved'];

/** Draft → In review → Changes requested → Approved, with the current step marked. */
export function ReportFlow({ status, hadChanges, compact }: { status: ReportStatus; hadChanges?: boolean; compact?: boolean }) {
  const { t } = useI18n();
  const { status: statusLabel } = useLabels();
  const cur = FLOW.indexOf(status);
  return (
    <ol aria-label={t('pages.report.flowLabel')} className={`stack${compact ? ' flow-compact' : ''}`} style={{ gap: compact ? 0 : 4 }}>
      {FLOW.map((st, i) => {
        const skipped = st === 'changes' && status === 'approved' && !hadChanges;
        const done = cur > i && !skipped;
        const current = cur === i;
        return (
          <li key={st} className="step" aria-current={current ? 'step' : undefined}>
            <span className={`step-mark${done ? ' done' : current ? ' current' : ''}`}>{done ? <Icon name="check" size={14} /> : i + 1}</span>
            <span className={`sec grow${current ? ' semibold' : ''}`}>{statusLabel(st)}</span>
            <span className="cap muted">{current ? t('pages.report.current') : skipped ? t('pages.report.notNeeded') : done ? t('pages.report.done') : ''}</span>
          </li>
        );
      })}
    </ol>
  );
}
